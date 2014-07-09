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
    var initiative;

    var triggerEvents = function(records, operation, success) {    
        _.each(records, function(record) {
            var prev = oids[record.get('ObjectID')];

            var currentOid = record.get('ObjectID');
            projects.push(record.get('Project'));

            if (prev) {
                // Did the feature lose a user story?
                if (prev.type == 'PortfolioItem/Feature') {
                    var previousStories = prev.record.get('UserStories');
                    var currentStories = record.get('UserStories');
                    if (previousStories && currentStories && previousStories.length > currentStories.length) {
                        var remove = _.find(previousStories, function(story) {
                            return !_.contains(currentStories, story);
                        });

                        if (remove && oids[remove]) {
                            // trigger recycle event and update our data structures
                            eventTrigger.trigger(oids[remove].type + '-Recycled', {record: null, oid: remove, date: new Date(record.get('_ValidFrom'))});
                            delete oids[remove];
                        }
                    }
                } else if (prev.type == 'UserStory') {
                    var previousTasks = prev.record.get('Tasks');
                    var currentTasks = record.get('Tasks');
                    if (previousTasks && currentTasks && previousTasks.length > currentTasks.length) { // task deleted

                        var remove = _.find(previousTasks, function(task) {
                            return !_.contains(currentTasks, previousTasks[i]);
                        });

                        if (remove && oids[remove]) {
                            eventTrigger.trigger(oids[remove].type + '-Recycled', {record: null, oid: remove, date: new Date(record.get('_ValidFrom'))});
                            //delete oids[remove]; // task gets updated afterwards which would create a new task!
                        }
                    }
                    
                } else if (prev.type == 'PortfolioItem/Initiative') {
                    // handle Feature destruction
                    var previousFeatures = prev.record.get('Children');
                    var currentFeatures = record.get('Children');
                    if (previousFeatures && currentFeatures && previousFeatures.length > currentFeatures.length) { // feature deleted
                        var remove = _.find(previousFeatures, function(feature) {
                            return !_.contains(currentFeatures, feature);
                        });

                        if (remove != -1 && oids[remove]) {
                            eventTrigger.trigger(oids[remove].type + '-Recycled', {record: null, oid: remove, date: new Date(record.get('_ValidFrom'))});
                            delete oids[remove];
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
                    eventTrigger.trigger(dataType + '-Created', {record: record, oid: currentOid, changes: [], date: new Date(record.get('_ValidTo'))});
                }
            }
        });

        projects = _.uniq(projects);
    };


    var loadPage = function(page) {
        lookbackStore.loadPage(page, {
            scope: this,
            callback: function (records, operation, success) {
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
                        allProjects.push(record);
                    }
                });

                _.each(allProjects, function(project) {
                    projectUUIDs.push(project.get('_refObjectUUID'));
                    eventTrigger.trigger("Project", {record: project});
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