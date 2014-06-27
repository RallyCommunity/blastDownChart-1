module.factory('RealtimeService', function () {
        var realtime = new Realtime();
        var oidUUID = '06841c63-ebce-4b6f-a2fc-8fd4ed0776ce';
        var typeUUID = '7d92c78a-8273-4784-99c5-c9187dc4fe8c';
        return {
            connect: function(uuids) {
                var websocket = realtime.connectTo(uuids);
                console.log(realtime);        
                websocket.onmessage = Ext.bind(function(e) {
                    var data = JSON.parse(e.data);

                    realtime.publishObjectChanged(data, this);
                    if (data.type && data.type == "event" && data.data && data.data.action) {
                        // TODO handle these cases in the game realm

                        // TODO Pigeon does not always send back the correct events.  Here, we will handle 2 simple events
                        //      Create - User Story created
                        //      Recycle - User Story recycled
                        // A defect has been filed to make sure that these events are propagating correctly
                        // Here's to hoping that it gets fixed sometime soon.
                        if (data.data.action == "Created" && data.data.state && data.data.state[typeUUID] && data.data.state[typeUUID].value == "UserStory") {
                            game.addStory(data.data.state[oidUUID].value); // send OID to game side
                        } else if (data.data.action == "Recycled" && data.data.changes && data.data.changes[typeUUID] && data.data.state[typeUUID].old_value == "UserStory") {
                            game.removeStory(data.data.changes[oidUUID].old_value);
                        } else {
                            // ignore all other cases for now
                        }
                    }
                }, this);
            }
        };
});
