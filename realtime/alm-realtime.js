function Realtime() {
    this.ENDPOINT = "wss://realtime.rally1.rallydev.com/_websocket";

    this.getSubscribeMessage = function() {
        var projectUuid = Rally.environment.getContext().getProject()._refObjectUUID;
        return JSON.stringify({
                uri: '/_subscribe',
                    "request-method": "post",
                    body: { topic: projectUuid }
            });
    };

    this.getSubscribeMessageByUuid = function(projectUuid) {
        return JSON.stringify({
                uri: '/_subscribe',
                    "request-method": "post",
                    body: { topic: projectUuid }
            });
    };

    this.getStateFieldValue = function(data, name) {
        var field = _.find(_.values(data.data.state), { name: name });

        return field && field.value;
    };

    this.getExtCompatibleRecordData = function(data, Model, useOldValue) {
        var values = _.values(data.data.state).concat(_.values(data.data.changes));

        var recordData = _.reduce(values, function(rd, v) {
                rd[v.name] = useOldValue ? v.old_value : v.value;
                return rd;
            }, {});

        recordData._type = Model.typePath;

        return recordData;
    };

    this.getTypeFromScope = function(data) {
        if(!data || !data.data || !data.data.scope) {
            return;
        }

        // pull type out of "/alm-prod/<type>"
        var match = data.data.scope.match(/([^\/]*)$/);

        if(!match) {
            return;
        }

        var typeString = match.pop();

        var typeMap = {
            'user-story': 'UserStory'
        };

        return typeMap[typeString] || typeString;
    };

    this.buildRecord = function(data, callback) {
        var recordType = this.getStateFieldValue(data, 'object_type') || this.getTypeFromScope(data);

        if(!recordType) {
            return;
        }
        var me = this;
        Rally.data.WsapiModelFactory.getModel({
                type: recordType,
                success: function(Model) {
                    var record = new Model(me.getExtCompatibleRecordData(data, Model, data.data.action === 'Recycled'));
                    callback(record);
                }
            });
    };

    this.getChangedFields = function(data) {
        return _.pluck(_.values(data.data.changes), 'name');
    };

    this.getMessageToPublish = function(data) {
        if (!data || !data.data || !data.data.action) {
            return;
        }

        var action = data.data.action;


        var actionMap = {
            Updated: Rally.Message.objectUpdate,
            Created: Rally.Message.objectCreate,
            Recycled: Rally.Message.objectDestroy
        };

        return actionMap[action];
    };

    this.getArgsForMessage = function(message, record, changedFields, cmp) {
        if(message === Rally.Message.objectUpdate || message === Rally.Message.objectCreate) {
            return [message, record, changedFields, cmp];
        }
        return [message, record, cmp, []];
    };

    this.publishObjectChanged = function(data, cmp) {
        var message = this.getMessageToPublish(data);
        var me = this;
        if(message) {
            this.buildRecord(data, function(record) {
                    var changedFields = me.getChangedFields(data);
                    var args = me.getArgsForMessage(message, record, changedFields, cmp);
                    var mb = Rally.environment.getMessageBus();
                    mb.publish.apply(mb, args);
                });
        }
    };

    this.connectTo = function(uuids) {
        var connection = new ReconnectingWebSocket(this.ENDPOINT);
        var me = this;
        connection.onopen = function() {
            _.each(uuids, function(uuid) {
                connection.send(me.getSubscribeMessageByUuid(uuid));
            });
        };
        connection.onerror = function(e) {
        };

        return connection;
    };
}


