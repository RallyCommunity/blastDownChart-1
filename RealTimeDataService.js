module.factory('Realtime', function ($q) {
        var deferred = $q.defer();
        var websocket = connect();

        return {

            websocket.onmessage = Ext.bind(function(e) {
                    var data = JSON.parse(e.data);
                    deferred.resolve(e);
            });

            return deferred.promise;
        };

});
