var GameEventHandler = function(realtime) {
    var listenTo = '#root';
    if (realtime && _.isFunction(realtime)) {
        realtime.setEventTrigger(listenTo);
    } else {
        listenTo = 'body'; // default to listen to events on the body
    }

    /**
     * Listen to all task related changes
     *
     */
    $(listenTo).on("Task-Updated", null, null, function(event, data) {
        if (data && data.record && data.oid) {
            game.updateItem(data.oid, data.record);
        }
    }); 

    $(listenTo).on("Task-Recycled", null, null, function(event, data) {
        if (data && data.oid) {
            game.removeItem(data.oid);
        }
    });

    $(listenTo).on("Task-Created", null, null, function(event, data) {
        if (data && data.record && data.oid) {
            game.createItem(data.oid, data.record);
        }
    });

    /**
     * Listen to all story related changes
     *
     */
    $(listenTo).on("UserStory-Updated", null, null, function(event, data) {
        if (data && data.record && data.oid) {
            game.updateItem(data.oid, data.record);
        }
    }); 

    $(listenTo).on("UserStory-Recycled", null, null, function(event, data) {
        if (data && data.oid) {
            game.removeItem(data.oid);
        }
    });

    $(listenTo).on("UserStory-Created", null, null, function(event, data) {
        if (data && data.record && data.oid) {
            game.createItem(data.oid, data.record);
        }
    });

    /**
     * Check on the realtime connection
     */
    $(listenTo).on("RealtimeConnection-Status", null, null, function(event, data) {
        if (data && data.status && data.status != 200) {
            // handle error in connection
            // in an idempotent manner! realtime tries to reconnect and could just loop on the same error
            // TODO game.realtimeConnectionError();
        }
    });
}