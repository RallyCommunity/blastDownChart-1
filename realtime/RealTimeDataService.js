module.factory('RealtimeService', function () {
        var realtime = new Realtime();
        var realtimeHandler = new RealtimeDataHandler();
        var websocket;
        return {
            disconnect: function() {
                if (websocket) {
                    websocket.close();
                }
            },

            connect: function(uuids) {
                websocket = realtime.connectTo(uuids);

                websocket.onmessage = Ext.bind(function(e) {
                    var data = JSON.parse(e.data);
                    realtime.publishObjectChanged(data, this);

                    realtimeHandler.handleRealtimeMessage(data);
                }, this);
            }
        };
});
