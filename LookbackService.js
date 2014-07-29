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

    var maxPage = -2;


    // converty hierarchical requirement to user story
    var getType = function(type) {
        if (type === "HierarchicalRequirement") {
            return "UserStory";
        }
        return type;
    };

    var creationEvent = function(currentType, record, oid) {
        currentType = getType(currentType);
        eventTrigger.trigger(currentType + "-Created", {
            record: record,
            oid: oid,
            date: moment(record.get('_ValidFrom'))  
        });
    };

    var recycleEvent = function(currentType, record, oid) {
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
        if (type == "PortfolioItem/Feature") {
            return record.get('UserStories');
        } else {
            return record.get('Children');
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

    var triggerEvents = function(page, records, operation, success) {
        if (page == 1) {
            eventTrigger.trigger("History-Started");
        }
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
                //eventTrigger.trigger("Project", {record: projectOidMap[projectOid]});
            }

            var typeHierarchy = record.get('_TypeHierarchy');
            var itemHierarchy = record.get('_ItemHierarchy');
            var currentType;

            if (typeHierarchy && itemHierarchy) {
                currentType = typeHierarchy[typeHierarchy.length  -1];
            } else {
                return;
            }


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
                return;
            }

            if (currentOid == initiativeOid) {
                // make sure you update the feature offset as necessary
                initiativeOffset = itemHierarchy.length - 1; // set the offset for the initiative within the itemHierarchy to base everything on
                featureOffset = initiativeOffset + 1;
            }

            var currentObject = hierarchyMap;

            if (itemHierarchy.length > featureOffset) {
                // set the feature to the oid that is in the feature position
                if (itemHierarchy[initiativeOffset] != initiativeOid) {
                    setOffset(itemHierarchy);
                }
                if (itemHierarchy.length > featureOffset && (currentType == 'HierarchicalRequirement' || currentType == "Task")) {
                    record.data.Feature = itemHierarchy[featureOffset];
                }
                
            }

            // traverse the hierarchy
            if (initiativeOid != currentOid) {
                for (var i = initiativeOffset; i < itemHierarchy.length - 1; i++) {
                    if (currentObject && currentObject.children[itemHierarchy[i + 1]]) {
                        currentObject = currentObject.children[itemHierarchy[i + 1]];
                    } else {
                        if (itemHierarchy[i + 1] == initiativeOid) {
                            //console.error("added initiative as a child of itself");
                        }
                        // handle creation event
                        currentObject.children[itemHierarchy[i + 1]] = {
                            children: {},
                            type: currentType
                        };
                        currentObject = currentObject.children[itemHierarchy[i + 1]];


                        if (itemHierarchy.length > featureOffset && (currentType == 'HierarchicalRequirement' || currentType == "Task")) {
                            // set the feature to the oid that is in the feature position
                            record.data.Feature = itemHierarchy[featureOffset];
                        }
                        creationEvent(currentType, record, currentOid);

                        return;
                    }
                }
            }

            // map has been initialized
            // check the hierarchyMap to see if this item has lost a child
            var children = getChildren(record, currentType);
            // this was some sort of update event
            // could represent the recycling of a child - make sure to check that;

            var previousChildren = _.toArray(currentObject.children);
            if (children && previousChildren.length > children.length) {
                var keys = _.toArray(Object.keys(currentObject.children));
                var theKey = _.find(keys, function(key) {
                    if (!_.contains(children, parseInt(key, 10))) {
                        return true;
                    }
                    return false;
                });

                recycleEvent(currentObject.children[theKey].type, record, theKey);
                delete currentObject.children[theKey];
            }
            updateEvent(currentType, record, currentOid);
        });

        // triggered all historical events, its okay to set up the realtime now!
        if (page == maxPage) {
            eventTrigger.trigger("History-Completed");
            setupRealtime();
        }
    };


    var loadPage = function(page) {
        lookbackStore.loadPage(page, {
            scope: this,
            callback: function (records, operation, success) {
                if (records.length != PAGE_SIZE) {
                    // Got less data back than an entire page size => done fetching data from the realtime
                    maxPage = page;
                }
                triggerEvents(page, records, operation, success);
                if (records.length == PAGE_SIZE) {
                    page++;
                    loadPage(page);
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
    };

    var getProjects = function(callbackFn) {
        // Get project UUIDs and connect to realtime, then reveal the game
        Ext.create('Rally.data.WsapiDataStore', {
            model: 'Project',
            fetch: ['Name', 'ObjectID'],
            limit: Infinity,
            context: {
                workspace: Rally.util.Ref.getRelativeUri(),
                project: null
            }
        }).load(function (records, operation, success) {
                _.each(records, function (record) {
                    projectOidMap[record.get('ObjectID')] = record;
                    eventTrigger.trigger("Project", {record: record});
                });
                callbackFn();
        });
    };

    return {
        connect: function(itemHierarchy) {
            lookbackStore = Ext.create('Rally.data.lookback.SnapshotStore', {
                fetch: ["_ref", "ObjectID", "_VaildFrom", "_ValidTo", "Recycled", "ActualEndDate", "ScheduleState", "State", "_TypeHierarchy", "Project", "FormattedID", "Name", "Parent", "Feature", "DirectChildrenCount", "Children", "UserStories", "Tasks", "PlanEstimate", "_ItemHierarchy"], //['ObjectID', '_TypeHierarchy', 'State', 'ScheduleState', ], // what are all the fields I might need?
                hydrate: ["Recycled", "ScheduleState", "State", "_TypeHierarchy", "FormattedID", "Children", "UserStories", "Feature"],
                pageSize: PAGE_SIZE,
                findConfig: {
                    "_ItemHierarchy": itemHierarchy
                },
                proxy: 'rallylookbackjsonpproxy'
            });

            lookbackStore.proxy.fetch = ["_ref", "ObjectID", "_VaildFrom", "_ValidTo", "Recycled", "ActualEndDate", "ScheduleState", "State", "_TypeHierarchy", "Project", "FormattedID", "Name", "Parent", "Feature", "DirectChildrenCount", "Children", "UserStories", "Tasks", "PlanEstimate", "_ItemHierarchy"];
            lookbackStore.proxy.hydrate = ["Recycled", "ScheduleState", "State", "_TypeHierarchy", "FormattedID", "Children", "UserStories", "Feature"];
            lookbackStore.proxy.find = {
                "_ItemHierarchy": itemHierarchy
            };

            getProjects(function() {
                loadPage(1);   
            });
        }
    };
});