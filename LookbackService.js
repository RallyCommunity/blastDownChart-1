/**
 *  A data service that triggers events from historical data by querying the lbapi
 *  Intended to use the same interface as the Realtime Data service to abstract the backend away.
 *  The service will trigger a number of events in short succession, (most likely) unlike the realtime service
 *
 *  It is important to note that this service operates on a few assumptions, namely:
 *      - the lbapi will not aggregate multiple changes of the same type into one instance
 *          (e.g. multiple tasks deleted will be broken into multiple changes)
 *      - event ordering is 'logical'
 *          (e.g. a feature will not be created after a story is parented to it)
 */

module.factory('LookbackService', function() {
    var eventTrigger = $('body');

    return {
        connect: function(itemHierarchy) {
            var lookbackStore = Ext.create('Rally.data.lookback.SnapshotStore', {
                fetch: ["ScheduleState", "State", "_TypeHierarchy", "Project", "FormattedID", "Name", "Parent", "Feature", "DirectChildrenCount", "Children", "UserStories", "Tasks"], //['ObjectID', '_TypeHierarchy', 'State', 'ScheduleState', ], // what are all the fields I might need?
                hydrate: ["ScheduleState", "State", "_TypeHierarchy", "Project", "FormattedID", "Children", "UserStories"],
                findConfig: {
                    "_ItemHierarchy": itemHierarchy
                }
            });

            lookbackStore.load({
                scope: this,
                callback: function (records, operation, success) {
                    var oids = {};
                    var parentMap = {};
                    
                    _.each(records, function(record) {
                        var prev = oids[record.get('ObjectID')];

                        var feature = record.get('Feature');
                        if (feature) {
                            var mapping = parentMap[feature];
                            if (mapping) {
                                if (!_.contains(mapping, record.get('ObjectID'))) {
                                    mapping.push(record.get('ObjectID'));
                                }
                            } else {
                                parentMap[feature] = [record.get('ObjectID')];
                            }
                        }

                        var currentOid = record.get('ObjectID');

                        if (prev) {
                            // Did the feature lose a user story?
                            if (prev.type == 'PortfolioItem/Feature') {
                                if (prev.record.get('DirectChildrenCount') > record.get('DirectChildrenCount')) {
                                    var children = record.get('UserStories');
                                    var j;
                                    var remove = -1;
                                    for (var j = 0; j < parentMap[currentOid].length; j++) {
                                        // compare the children
                                        if (!_.contains(children, parentMap[currentOid][j])) {
                                            // this oid needs to get deleted
                                            remove = j;
                                            break;
                                        }
                                    }

                                    if (remove != -1 && oids[parentMap[currentOid][remove]]) {
                                        // trigger recycle event and update our data structures
                                        eventTrigger.trigger(oids[parentMap[currentOid][remove]].type + '-Recycled', {record: null, oid: parentMap[currentOid][remove], date: new Date(record.get('_ValidFrom'))});
                                        delete oids[parentMap[currentOid][remove]];
                                        parentMap[currentOid].splice(remove, 1);
                                    }
                                }
                            } else if (prev.type == 'UserStory') {
                                var previousTasks = prev.record.get('Tasks');
                                var currentTasks = record.get('Tasks');
                                if (previousTasks && currentTasks && previousTasks.length > currentTasks.length) { // task deleted

                                    var removeOid = -1;
                                    for (var i = 0; i < previousTasks.length; i++) {
                                        if (!_.contains(currentTasks, previousTasks[i])) {
                                            removeOid = previousTasks[i];
                                            break;
                                        }
                                    }

                                    if (removeOid != -1 && oids[removeOid]) {
                                        eventTrigger.trigger(oids[removeOid].type + '-Recycled', {record: null, oid: removeOid, date: new Date(record.get('_ValidFrom'))});
                                        //delete oids[removeOid]; // task gets updated afterwards which would create a new task!
                                    }
                                }
                                
                            } else if (prev.type == 'PortfolioItem/Initiative') {
                                // handle Feature destruction
                                var previousFeatures = prev.record.get('Children');
                                var currentFeatures = record.get('Children');
                                if (previousFeatures && currentFeatures && previousFeatures.length > currentFeatures.length) { // feature deleted
                                    var removeOid = -1;
                                    for (var i = 0; i < previousFeatures.length; i++) {
                                        if (!_.contains(currentFeatures, previousFeatures[i])) {
                                            removeOid = previousFeatures[i];
                                            break;
                                        }
                                    }

                                    if (removeOid != -1 && oids[removeOid]) {
                                        eventTrigger.trigger(oids[removeOid].type + '-Recycled', {record: null, oid: removeOid, date: new Date(record.get('_ValidFrom'))});
                                        delete oids[removeOid];
                                    }
                                }
                            }

                            // update this item
                            var changes = new Array();

                            _.each(oids[currentOid].record.data, function(prevValue, prevIdx) {
                                if (prevValue != record.get(prevIdx)) {
                                    changes.push(prevIdx);
                                }
                            });

                            changes = _.without(changes, "_ValidFrom", "_ValidTo", "_TypeHierarchy");

                            if (changes.length > 0) { // only trigger the event if something meaningful changed
                                oids[currentOid] = {
                                    type: oids[currentOid].type,
                                    record: record
                                }
                                eventTrigger.trigger(oids[currentOid].type + '-Updated', {record: record, oid: currentOid, changes: changes, date: new Date(record.get('_ValidFrom'))});
                            }
                        } else {
                            // creation!
                            var types = record.get('_TypeHierarchy');
                            if (types && types.length > 0) {
                                var dataType = types[types.length - 1];
                                if (dataType === "HierarchicalRequirement") {
                                    dataType = "UserStory";
                                }
                                oids[currentOid] = {
                                    type: dataType,
                                    record: record
                                }

                                eventTrigger.trigger(dataType + '-Created', {record: record, oid: currentOid, changes: [], date: new Date(record.get('_ValidFrom'))});
                            }
                        }
                    });
                }
            });               
        }
    };
});
