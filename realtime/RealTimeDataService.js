module.factory('RealtimeService', function () {
        var realtime = new Realtime();
        var realtimeHandler = new RealtimeDataHandler();

        return {
            connect: function(uuids) {
                var websocket = realtime.connectTo(uuids);
                console.log(realtime);

                websocket.onmessage = Ext.bind(function(e) {
                    var data = JSON.parse(e.data);
                    realtime.publishObjectChanged(data, this);

                    realtimeHandler.handleRealtimeMessage(data);
                }, this);
            }
        };
});
