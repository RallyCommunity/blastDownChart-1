function WSAPIAggregator(evtTrigger) {
    var eventTrigger = evtTrigger;
    this.getWorkItem = function(oid, model, callback) {
        Ext.create('Rally.data.WsapiDataStore', {
            model   : model,
            fetch   : true,
            context: {
                workspace: Rally.util.Ref.getRelativeUri(),
                project: null
            },
            filters: [{
                property : 'ObjectID',
                value    : oid
            }]
        }).load({
            scope: this,
            callback: function(records) {
                if (callback && _.isFunction(callback)) {
                    if (records && records.length == 1) {
                        // set the feature properly

                        var returnRecord = records[0];

                        var featureParts = returnRecord.get("Feature");
                        if (featureParts) {
                            featureParts = featureParts._ref.split("/");
                        }
                        if (featureParts && featureParts.length > 0) {
                            returnRecord.data.Feature = featureParts[featureParts.length - 1];
                        }

                        var project = returnRecord.get("Project");
                        // same interface as lbapi, must trigger project event for this project!
                        if (project && project._refObjectName) {
                            Ext.create('Rally.data.WsapiDataStore', {
                                model: 'Project',
                                fetch: ['Name', 'ObjectID'],
                                limit: Infinity,
                                context: {
                                    workspace: Rally.util.Ref.getRelativeUri(),
                                    project: null
                                },
                                filters: [{
                                    property : 'Name',
                                    value    : project._refObjectName
                                }]
                            }).load({
                                scope: this,
                                callback: function (records, operation, success) {
                                    if (records) {
                                        _.each(records, function (record) {
                                            eventTrigger.trigger("Project", {record: record});
                                            if (returnRecord.data) {
                                                returnRecord.data.Project = record.get('ObjectID');
                                            }
                                        });
                                    }

                                    callback(returnRecord);
                                }
                            });
                        } else {
                            callback(returnRecord);
                        }
                    } else {
                        callback(null);
                    }
                }
            }
        });
    }
}