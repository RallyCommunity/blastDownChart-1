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
                        parentless: []
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
                                children: []
                            };
                            break;
                        case "PortfolioItem/Feature":
                            aggregateData.features[artifact.data.ObjectID] = {
                                feature: artifact.raw,
                                children: []
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
                        teamsPoints: {}
                    };
                    var projects = [];

                    // Add tasks as children of their associated story/defect
                    _.each(tasks, function (task) {
                        var parent = task.WorkProduct;

                        if (aggregateData.storiesAndDefects[parent]) {
                            // add it to the list of children
                            Ext.Array.push(aggregateData.storiesAndDefects[parent].children, task);
                        } // else not parented to a story/defect
                    });

                    // Add stories and tasks as children of their feature
                    _.each(aggregateData.storiesAndDefects, function (object, oid) {
                        var parent;
                        var types = object.artifact._TypeHierarchy;

                        Ext.Array.include(projects, object.artifact.Project);

                        if (organizedData.teamsPoints[object.artifact.Project] && object.artifact.State === "Closed") {
                            Ext.Array.push(organizedData.closedStories, object);
                            organizedData.teamsPoints[object.artifact.Project] += object.artifact.PlanEstimate;
                            return;
                        } else if (organizedData.teamsPoints[object.artifact.Project]) {
                            organizedData.teamsPoints[object.artifact.Project] = object.artifact.PlanEstimate;
                            return;
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

                    Ext.create('Rally.data.WsapiDataStore', {
                        model: 'Project',
                        fetch: ['Name'],
                        limit: Infinity
                            /*
                                                TODO optimize
                                                filters: [
                                                        {
                                                                property: 'ObjectID',
                                                                operator: 'in',
                                                                value: projects
                                                        }
                                                ]
                                                */
                    }).load({
                        scope: this,
                        callback: function (records, operation, success) {
                            console.log("records", records);
                            console.log(GLOBAL);

                            var i = 0;
                            projectUUIDs = [];
                            Ext.Array.each(records, function (record) {
                                if (Ext.Array.indexOf(projects, record.get('ObjectID')) >= 0) {
                                    Ext.Array.push(projectUUIDs, record.get('_refObjectUUID'));
                                }
                            });
                            organizedData.features = _.toArray(aggregateData.features);
                            organizedData.initiative = GLOBAL;

                            console.log("initiative UUID", GLOBAL._refObjectUUID);

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