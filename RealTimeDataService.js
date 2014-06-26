module.factory('RealtimeService', function () {
        var realtime = new Realtime();
        return {
            connect: function(uuids, dataHandler) {
                Ext.Array.each(uuids, function(id) {
                    var websocket = realtime.connectTo(id);
                    console.log(realtime);        
                    websocket.onmessage = Ext.bind(function(e) {
                            var data = JSON.parse(e.data);
                            //                        console.log('realtime message', data);
                            realtime.publishObjectChanged(data, this);
                            if (data.type) { // events (update, create, etc have a type (delete = recycled)
                                // TODO handle these cases in the game realm
                                // update - only need to handle this if something is reparented
                                // recycled - ship flies off
                                
                                console.log(data.data.action + "", data);



                                Ext.create('Rally.data.wsapi.Store', {
                                    model: 'PortfolioItem/Initiative',
                                    filters: [
                                        {
                                          property: "_refObjectUUID",
                                          operator: "=",
                                          value: GLOBAL._refObjectUUID
                                        }
                                    ]
                                }).load({
                                    scope: this,
                                    callback: function(records, operation, success) {
                                        console.log('for ' + GLOBAL._refObjectUUID + ' got', records);
                                        callbackData(organizedData);
                                    }
                                });  
                                dataHandler();

                                // switch(data.data.action) {
                                //     case 'recycled':
                                //         break;
                                //     case 'updated':
                                        
                                //         break;
                                //     default: break;
                                // }
                            }
                    }, this);
                });
            }
        }
});
