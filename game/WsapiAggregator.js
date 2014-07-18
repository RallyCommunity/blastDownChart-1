function WSAPIAggregator() {
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
                        callback(records[0]);
                    } else {
                        callback(null);
                    }
                }
            }
        });
    }
}