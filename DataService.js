module.service('RallyDataService', function (RealtimeService) {
    var lookbackStore = Ext.create('Rally.data.lookback.SnapshotStore', {
        fetch: true,
        hydrate: ["ScheduleState", "State", "_TypeHierarchy", "Project", "FormattedID"],
        findConfig: {
            "_ItemHierarchy": GLOBAL.ObjectID,
            "__At": "current"
        }
    });

    return {
        getData: function (connect, callbackData) {
            lookbackStore.load({
                scope: this,
                callback: function (records, operation, success) {
                    // aggreate data first, then organize it
                    aggregateData = {
                        initiative: {},
                        features: {},
                        storiesAndDefects: {},
                        parentless: [],
                        teamsPoints: {}
                    };

                    var tasks = [];
                    _.each(records, function (artifact) {
                        var types = artifact.raw._TypeHierarchy;
                        console.log(artifact);
                        switch (types[types.length - 1]) {
                        case "Defect":
                            aggregateData.storiesAndDefects[artifact.data.ObjectID] = {
                                artifact: artifact.raw,
                                children: []
                            };
                            break;
                        case "HierarchicalRequirement":
                            aggregateData.storiesAndDefects[artifact.data.ObjectID] = {
                                artifact: artifact.raw,
                                children: [],
                                completedTasks: []
                            };
                            break;
                        case "PortfolioItem/Feature":
                            aggregateData.features[artifact.data.ObjectID] = {
                                feature: artifact.raw,
                                children: [],
                                completedTasks: []
                            };
                            break;
                        case "Task":
                            Ext.Array.push(tasks, artifact.raw);                            
                            break;
                        default: // ignore
                        }
                    });

                    // organizedData
                    //   |
                    //   +-->Initiative
                    //   +-->Features
                    //   |   |
                    //   |   +-->Stories/Defects
                    //   |       |
                    //   |       +-->Tasks
                    //   |
                    //   +-->ClosedStories


                    var organizedData = {
                        initiative: angular.element(document.body).scope().initiative,
                        features: [],
                        closedStories: [],
                        scoreboard: {}
                    };
                    var projects = [];

                    // Add tasks as children of their associated story/defect
                    _.each(tasks, function (task) {
                        var parent = task.WorkProduct;

                        if (aggregateData.storiesAndDefects[parent]) {
                            // add it to the list of children
                            if (task.State == "Completed") {
                                Ext.Array.push(aggregateData.storiesAndDefects[parent].completedTasks, task);
                            } else {
                                Ext.Array.push(aggregateData.storiesAndDefects[parent].children, task);
                            }

                        } // else not parented to a story/defect
                    });

                    // Add stories and tasks as children of their feature
                    _.each(aggregateData.storiesAndDefects, function (object, oid) {
                        var parent;
                        var types = object.artifact._TypeHierarchy;

                        Ext.Array.include(projects, object.artifact.Project);

                        if (!aggregateData.teamsPoints[object.artifact.Project]) {
                            aggregateData.teamsPoints[object.artifact.Project] = {
                                score: 0,
                                lives: 5
                            };
                        }

                        var state = object.artifact.ScheduleState;

                        if (state == "Completed" || state == "Accepted" || state == "Released") {
                            // aggregateData.teamsPoints[object.artifact.Project].score += object.artifact.PlanEstimate || 0;
                            // Ext.Array.push(organizedData.closedStories, object);
                            Ext.Array.push(organizedData.closedStories, object);
                            console.log("completed", object.artifact)
                        }

                        if (types[types.length - 1] === "HierarchicalRequirement") {
                            // stories have an associated PortfolioItem/Feature
                            parent = object.artifact.PortfolioItem;
                        } else {
                            // defects associate with a story or defect that will parent to a Feature
                            var requirement = aggregateData.storiesAndDefects[object.artifact.Requirement];
                            if (requirement) {
                                parent = requirement.artifact.PortfolioItem;
                            } // else no parent requirement
                        }

                        if (aggregateData.features[parent]) {
                            // add it to the list of children
                            Ext.Array.push(aggregateData.features[parent].children, object);
                        } // else not parented to a feature
                    });

                    // TODO optimize if possible
                    Ext.create('Rally.data.WsapiDataStore', {
                        model: 'Project',
                        fetch: ['Name', 'ObjectID'],
                        limit: Infinity,
                        context: {
                            workspace: Rally.util.Ref.getRelativeUri(),
                            project: null
                        }
                    }).load({
                        scope: this,
                        callback: function (records, operation, success) {
                            projectUUIDs = [];
                            var allProjects = [];
                            _.each(records, function (record) {
                                if (_.indexOf(projects, record.get('ObjectID')) >= 0) {
                                    Ext.Array.push(allProjects, record);
                                }
                                
                            });

                            _.each(allProjects, function(project) {
                                console.log(project);
                                Ext.Array.push(projectUUIDs, project.data._refObjectUUID);
                                organizedData.scoreboard[project.data.Name] = aggregateData.teamsPoints[project.data.ObjectID]
                            });

                            console.log(aggregateData.teamsPoints, organizedData.scoreboard);
                            organizedData.features = _.toArray(aggregateData.features);
                            organizedData.initiative = GLOBAL;
                            
                            var scope = angular.element($("#root")).scope();
                            scope.realtimeConnection = function () {
                                RealtimeService.connect(projectUUIDs);
                            };
                            scope.realtimeConnection(); // listen for changes in realtime
                            callbackData(organizedData);
                        }
                    });
                }
            });
        }
    };
});