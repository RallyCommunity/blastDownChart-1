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
    var PAGE_SIZE = 200;
    var projects = [];
    var lookbackStore;
    var oids = {};
    var initiative;
    var initiativeOid;

    var projectOidMap = {};
    var triggered = {};

    var hierarchyMap = null;
    var initiativeOffset = 0;
    var featureOffset = 0;


    // converty hierarchical requirement to user story
    var getType = function(type) {
        if (type === "HierarchicalRequirement") {
            return "UserStory";
        }
        return type;
    };

    var creationEvent = function(currentType, record, oid) {
        currentType = getType(currentType);
        if (currentType == "PortfolioItem/Initiative") {
            console.log("CREATED INITIATIVE");
        }
        eventTrigger.trigger(currentType + "-Created", {
            record: record,
            oid: oid,
            date: moment(record.get('_ValidFrom'))  
        });
    };

    var recycleEvent = function(currentType, record, oid) {
        if (currentType == 'PortfolioItem/Initiative' || oid == initiativeOid   ) {
            console.log("recycle initiative", currentType, record, oid, hierarchyMap.children);
        }
        currentType = getType(currentType);
        eventTrigger.trigger(currentType + "-Recycled", {
            record: null,
            oid: oid,
            date: moment(moment(record.get('_ValidTo')))  
        });
    };

    var updateEvent = function(currentType, record, oid) {
        currentType = getType(currentType);
        eventTrigger.trigger(currentType + "-Updated", {
            record: record,
            oid: oid,
            date: moment(record.get('_ValidFrom'))  
        });
    };

    var getChildren = function(record, type) {
        switch(type) {
            case "PortfolioItem/Feature":
                return record.get('UserStories');
            default: return record.get('Children');
        }
    };

    var setOffset = function(itemHierarchy) {
        for (var i = 0; i < itemHierarchy.length; i++) {
            if (itemHierarchy[i] == initiativeOid) {
                initiativeOffset = i;
                featureOffset = i + 1;
                return;
            }
        } 
    };

    var triggerEvents = function(records, operation, success) {
        var lbService = this;
        _.each(records, function(record) {
            // fire events in order of what happenend historically
            // -Created
            // -Recycled
            // -Updated
            var currentOid = record.get('ObjectID');
            var projectOid = record.get('Project');
            if (projectOidMap[projectOid] && !triggered[projectOid]) {
                triggered[projectOid] = true;
                eventTrigger.trigger("Project", {record: projectOidMap[projectOid]});
            }

            var typeHierarchy = record.get('_TypeHierarchy');
            var itemHierarchy = record.get('_ItemHierarchy');
            var currentType = typeHierarchy[typeHierarchy.length  -1];


            if (!hierarchyMap) {
                // map not initialized yet, we are dealing with the creation of the initiative
                initiativeOffset = itemHierarchy.length - 1; // set the offset for the initiaitive within the itemHierarchy to base everything on
                featureOffset = initiativeOffset + 1;
                initiativeOid = currentOid;
                hierarchyMap = {
                    children: {},
                    type: currentType,
                    record: record
                };

                creationEvent(currentType, record, currentOid);
                console.log('HierarchyMap', hierarchyMap, initiativeOffset);
                return;
            }

            if (currentOid == initiativeOid) {
                // make sure you update the feature offset as necessary
                initiativeOffset = itemHierarchy.length - 1; // set the offset for the initiative within the itemHierarchy to base everything on
                featureOffset = initiativeOffset + 1;
            }

            var currentObject = hierarchyMap

            if (itemHierarchy.length > featureOffset) {
                // set the feature to the oid that is in the feature position
                if (itemHierarchy[initiativeOffset] != initiativeOid) {
                    setOffset(itemHierarchy);
                    // console.log("ItemHierarchy", itemHierarchy);
                }
                if (currentType == 'HierarchicalRequirement') {
                    record.data.Feature = itemHierarchy[featureOffset]; // should be fine TODO sanity check
                }
                
            }

            // traverse the hierarchy
            if (initiativeOid != currentOid) {
                for (var i = initiativeOffset; i < itemHierarchy.length - 1; i++) {
                    if (currentObject && currentObject.children[itemHierarchy[i + 1]]) {
                        currentObject = currentObject.children[itemHierarchy[i + 1]];
                    } else {
                        if (itemHierarchy[i + 1] == initiativeOid) {
                            console.error("added initiative as a child of itself");
                        }
                        // handle creation event
                        currentObject.children[itemHierarchy[i + 1]] = {
                            children: {},
                            type: currentType
                        }
                        currentObject = currentObject.children[itemHierarchy[i + 1]];


                        if (currentType == 'HierarchicalRequirement' && itemHierarchy.length > featureOffset) {
                            // set the feature to the oid that is in the feature position
                            record.data.Feature = itemHierarchy[featureOffset]; // should be fine TODO sanity check
                        }
                        creationEvent(currentType, record, currentOid);

                        //console.log('HierarchyMap', hierarchyMap);
                        return;
                    }
                }
            }

            // map has been initialized
            // check the hierarchyMap to see if this item has lost a child
            // TODO use a different property for children based on the type (Feature->"User Stories") or something like that?
            var children = getChildren(record, currentType);
            // this was some sort of update event
            // could represent the recycling of a child - make sure to check that;

            var previousChildren = _.toArray(currentObject.children);
            if (children && previousChildren.length > children.length) {
                //console.log('Recycle Event');
                // TODO better way to find the missing child
                var keys = _.toArray(Object.keys(currentObject.children));
                var theKey = _.find(keys, function(key) {
                    return !_.contains(children, key);
                });

                if (currentType == "PortfolioItem/Initiative") {
                    //console.log("removing features from an initiative", hierarchyMap.children);
                }


                recycleEvent(currentObject.children[theKey].type, record, theKey);
                delete currentObject.children[theKey];
                // TODO also fire the update event for this item
                // TODO recycle all children?
            } else {
                // update event
                updateEvent(currentType, record, currentOid);
            }

            


            // keep track of everything by oid in a map
            // rely on the item hierarchy to tell the relationship between items

            /*
            var currentOid = record.get('ObjectID');
            var projectOid = record.get('Project');
            if (projectOidMap[projectOid] && !triggered[projectOid]) {
                triggered[projectOid] = true;
                eventTrigger.trigger("Project", {record: projectOidMap[projectOid]});
            }

            var prev = oids[currentOid];

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
                            return !_.contains(currentTasks, task);
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

                // Remove the changes that we do not care about
                // Changes are provided to mirror the interface to the realtime service
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

            */
        });
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
                    // Got less data back than an entire page size => done fetching data from the realtime
                    // TODO this should setup realtime after all other data has been parsed...didnt work in demo
                    setupRealtime();
                }
            }   
        });
    };

    var setupRealtime = function() {
        var projectUUIDs = [];
        _.each(triggered, function(value, key) {
            projectUUIDs.push(projectOidMap[key].get('_refObjectUUID'));
        });

        var scope = angular.element($("#root")).scope();
                
        scope.connectRealtime(projectUUIDs); // listen for changes in realtime
    }

    var getProjects = function(callbackFn) {
        // Get project UUIDs and connect to realtime, then reveal the game
        // TODO optimize if possible, what about customers that have a lot of projects
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
                _.each(records, function (record) {
                    projectOidMap[record.get('ObjectID')] = record;
                });
                callbackFn();
            }
        });
    };

    return {
        connect: function(itemHierarchy) {
            lookbackStore = Ext.create('Rally.data.lookback.SnapshotStore', {
                fetch: ["Recycled", "ActualEndDate", "ScheduleState", "State", "_TypeHierarchy", "Project", "FormattedID", "Name", "Parent", "Feature", "DirectChildrenCount", "Children", "UserStories", "Tasks", "PlanEstimate", "_ItemHierarchy"], //['ObjectID', '_TypeHierarchy', 'State', 'ScheduleState', ], // what are all the fields I might need?
                hydrate: ["Recycled", "ScheduleState", "State", "_TypeHierarchy", "FormattedID", "Children", "UserStories", "Feature"],
                pageSize: PAGE_SIZE,
                findConfig: {
                    "_ItemHierarchy": itemHierarchy
                }
            });
            
            getProjects(function() {
                loadPage(1); 
                game.reveal();  
            });
        }
    };
});