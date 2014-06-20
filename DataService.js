module.service('RallyDataService', function() {
    var lookbackStore = Ext.create('Rally.data.lookback.SnapshotStore', {
        fetch: true,
        hydrate: ["ScheduleState", "State", "_TypeHierarchy"],
        findConfig: {
            "_ItemHierarchy" : GLOBAL.itemHierarchy,
            "__At" : "current"
        }
    });

    return {
        getData: function(callbackData) {
            lookbackStore.load({
                scope: this,
                callback: function(records, operation, success) {

                    aggregateData = {
                        initiative: {},
                        features: {},
                        storiesAndDefects: {},
                        parentless: []
                    };

                    var tasks = [];
                    _.each(records, function(artifact) {
                        var types = artifact.raw._TypeHierarchy;
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
                    //       |
                    //       +-->Stories/Defects
                    //           |
                    //           +-->Tasks
                    var organizedData = {
                        initiative: GLOBAL.initiative
                    };

                    // Add tasks as children of their associated story/defect
                    _.each(tasks, function(task) {
                        var parent = task.WorkProduct;

                        if (aggregateData.storiesAndDefects[parent]) {
                            // add it to the list of children
                            Ext.Array.push(aggregateData.storiesAndDefects[parent].children, task);
                        } else {
                            // not parented to a story/defect
                            console.log('not parented to a story or defect', task);
                        }
                    });

                    // Add stories and tasks as children of their feature
                    _.each(aggregateData.storiesAndDefects, function(object, oid) {
                        var parent;
                        console.log(object);
                        var types = object.artifact._TypeHierarchy;

                        if (types[types.length - 1] === "HierarchicalRequirement") {
                            // stories have an associated PortfolioItem/Feature
                            parent = object.artifact.PortfolioItem;
                        } else {
                            // defects associate with a story or defect that will parent to a Feature
                            var requirement = aggregateData.storiesAndDefects[object.artifact.Requirement];
                            if (requirement) {
                                parent = requirement.artifact.PortfolioItem;
                            } else {
                                console.log('not found', object);
                            }
                        }

                        if (aggregateData.features[parent]) {
                            // add it to the list of children
                            Ext.Array.push(aggregateData.features[parent].children, object);
                        } else {
                            // not parented to a feature
                            console.log('not parented to a feature');
                        }
                    });
                    console.log('aggreate', aggregateData);
                    organizedData.features = aggregateData.features;
                    console.log(organizedData);
                    callbackData(organizedData);
                }
            });
        }
    };
});


