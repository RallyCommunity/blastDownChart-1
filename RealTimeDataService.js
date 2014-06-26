module.factory('RealtimeService', function ($q) {
        var realtime = new Realtime();
        return {
            connect: function(uuids) {
                Ext.Array.each(uuids, function(id) {
                    var websocket = realtime.connectTo(id);
                    console.log(realtime);        
                    websocket.onmessage = Ext.bind(function(e) {
                            var data = JSON.parse(e.data);
                            console.log('realtime message', data);
                            realtime.publishObjectChanged(data, this);
                            if (data.type) { // events (update, create, etc have a type (delete = recycled)
                                // TODO handle these cases in the game realm
                            }
                    }, this);
                });
            }
        }
});
