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
    var PAGE_SIZE = 50;
    var projects = [];
    var lookbackStore;
    var oids = {};
    //var parentMap = {};

    var triggerEvents = function(records, operation, success) {
        //console.log(records);
        
        _.each(records, function(record) {
            //console.log(record.get('Recycled') + " " + record.get('FormattedID'), record);
            var prev = oids[record.get('ObjectID')];

            var currentOid = record.get('ObjectID');
            Ext.Array.include(projects, record.get('Project'));

            if (prev) {
                // Did the feature lose a user story?
                if (prev.type == 'PortfolioItem/Feature') {
                    var previousStories = prev.record.get('UserStories');
                    var currentStories = record.get('UserStories');
                    if (previousStories && currentStories && previousStories.length > currentStories.length) {
                        
                        var j;
                        var remove = -1;
                        var deleteOid = -1;
                        for (var j = 0; j < previousStories.length; j++) {
                            // compare the children
                            if (!_.contains(currentStories, previousStories[j])) {
                                // this oid needs to get deleted
                                remove = j;
                                deleteOid = previousStories[j];
                                break;
                            }
                        }

                        if (remove != -1 && oids[deleteOid]) {
                            // trigger recycle event and update our data structures
                            eventTrigger.trigger(oids[deleteOid].type + '-Recycled', {record: null, oid: deleteOid, date: new Date(record.get('_ValidFrom'))});
                            delete oids[deleteOid];
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
                    //console.info("Triggering: " + oids[currentOid].type + '-Updated');
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

                    //console.info("Triggering: " + dataType + '-Created');
                    eventTrigger.trigger(dataType + '-Created', {record: record, oid: currentOid, changes: [], date: new Date(record.get('_ValidTo'))});
                }
            }
        });
    };


    var loadPage = function(page) {
        console.log("loading page: " + page);
        lookbackStore.loadPage(page, {
            scope: this,
            callback: function (records, operation, success) {
                //console.log("page " + page, records);
                page++;
                triggerEvents(records, operation, success);
                if (records.length == PAGE_SIZE) {
                    loadPage(page);
                } else {
                    setupRealtime();
                }
            }   
        });
    };

    var setupRealtime = function() {
        // Get project UUIDs and connect to realtime, then reveal the game
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
                var projectUUIDs = [];
                var allProjects = [];
                _.each(records, function (record) {
                    if (_.indexOf(projects, record.get('ObjectID')) >= 0) {
                        Ext.Array.push(allProjects, record);
                    }
                });

                _.each(allProjects, function(project) {
                    console.log(project);
                    Ext.Array.push(projectUUIDs, project.get('_refObjectUUID'));
                    eventTrigger.trigger("Project", {record: project});
                    //organizedData.scoreboard[project.data.Name] = aggregateData.teamsPoints[project.data.ObjectID]
                });
                
                var scope = angular.element($("#root")).scope();
                
                scope.connectRealtime(projectUUIDs); // listen for changes in realtime
            }
        });
    };

    return {
        connect: function(itemHierarchy) {
            lookbackStore = Ext.create('Rally.data.lookback.SnapshotStore', {
                fetch: ["Recycled", "ActualEndDate", "ScheduleState", "State", "_TypeHierarchy", "Project", "FormattedID", "Name", "Parent", "Feature", "DirectChildrenCount", "Children", "UserStories", "Tasks", "PlanEstimate"], //['ObjectID', '_TypeHierarchy', 'State', 'ScheduleState', ], // what are all the fields I might need?
                hydrate: ["Recycled", "ScheduleState", "State", "_TypeHierarchy", "Project", "FormattedID", "Children", "UserStories", "Project"],
                pageSize: PAGE_SIZE,
                findConfig: {
                    "_ItemHierarchy": itemHierarchy
                }
            });
            
            loadPage(1); 
            game.reveal();    
        }
    };
});