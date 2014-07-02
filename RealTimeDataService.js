module.factory('RealtimeService', function () {
        var realtime = new Realtime();
        var oidUUID = '06841c63-ebce-4b6f-a2fc-8fd4ed0776ce';
        var typeUUID = '7d92c78a-8273-4784-99c5-c9187dc4fe8c';
        //var formattedId = '55c5512a-1518-4944-8597-3eb91875e8d1';

        return {
            connect: function(uuids) {
                var websocket = realtime.connectTo(uuids);
                console.log(realtime);
                game.realtimeHandler = new RealtimeDataHandler();   
                websocket.onmessage = Ext.bind(function(e) {
                    var data = JSON.parse(e.data);
                    console.log(data);

                    // TODO if realtime connection error, display connection state to user?

                    realtime.publishObjectChanged(data, this);

                    game.realtimeHandler.handleRealtimeMessage(data);
                    
                }, this);
            }
        };
});
