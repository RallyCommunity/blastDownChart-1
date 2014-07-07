/**
 * Sets up event listeners to listen for new data
 * The data could come from the lbapi or the realtime service
 * so it is important to buffer the events coming in until
 * the front-end can catch up
 */
var GameEventHandler = function(realtime) {
    var listenTo = 'body';

    var eventQueue = [];

    var enqueue = function(event, item) {
        eventQueue.push({
            event: event,
            data: item 
        });
    }

    var dequeue = function() {
        if (eventQueue.length > 0) {
            return eventQueue.shift();
        }
        return null;
    }

    // $(listenTo).on("Task-Updated Task-Recycled Task-Created UserStory-Updated UserStory-Recycled UserStory-Created PortfolioItem/Feature-Updated PortfolioItem/Feature-Recycled PortfolioItem/Feature-Created PortfolioItem/Initiative-Updated PortfolioItem/Initiative-Recycled PortfolioItem/Initiative-Created",
    //     null, null, function(event, data) {
    //         enqueue(event, data);
    // });

    // var timer = setInterval(function() {
    //     var object = dequeue();
    //     if (object) {
    //         console.log("timeout", object);
    //     } else {
    //         console.log(eventQueue);
    //         // TODO clear the timeout and just listen for events in realtime?
    //         clearInterval(timer);
    //     }
    // }, 1000);

    // /**
    //  * Listen to all task related changes
    //  *
    //  */
    // $(listenTo).on("Task-Updated", null, null, function(event, data) {
    //     console.log("Task-Updated", data);
    //     /*
    //     if (data && data.record && data.oid) {
    //         game.updateItem(data.oid, data.record);
    //     }*/
    // }); 

    // $(listenTo).on("Task-Recycled", null, null, function(event, data) {
    //     console.log("Task-Recycled", data);
    //     // if (data && data.oid) {
    //     //     game.removeItem(data.oid);
    //     // }
    // });

    $(listenTo).on("Task-Created", null, null, function(event, data) {
        console.log("Task-Created", data);
        game.shipScreen.addTask(data.record);
        // if (data && data.record && data.oid) {
        //     game.createItem(data.oid, data.record);
        // }
    });

    // /**
    //  * Listen to all story related changes
    //  *
    //  */
    // $(listenTo).on("UserStory-Updated", null, null, function(event, data) {
    //     console.log("UserStory-Updated", data);
    //     // if (data && data.record && data.oid) {
    //     //     game.updateItem(data.oid, data.record);
    //     // }
    // }); 

    // $(listenTo).on("UserStory-Recycled", null, null, function(event, data) {
    //     console.log("UserStory-Recycled", data);
    //     // if (data && data.oid) {
    //     //     game.removeItem(data.oid);
    //     // }
    // });

    $(listenTo).on("UserStory-Created", null, null, function(event, data) {
        console.log("UserStory-Created", data);
        game.shipScreen.addStory(data.record);
        // if (data && data.record && data.oid) {
        //     game.createItem(data.oid, data.record);
        // }
    });

    // /**
    //  * Listen to all Feature related changes
    //  *
    //  */
    // $(listenTo).on("PortfolioItem/Feature-Updated", null, null, function(event, data) {
    //     console.log("PortfolioItem/Feature-Updated", data);
    //     // if (data && data.record && data.oid) {
    //     //     game.updateItem(data.oid, data.record);
    //     // }
    // }); 

    // $(listenTo).on("PortfolioItem/Feature-Recycled", null, null, function(event, data) {
    //     console.log("PortfolioItem/Feature-Recycled", data);
    //     // if (data && data.oid) {
    //     //     game.removeItem(data.oid);
    //     // }
    // });

    $(listenTo).on("PortfolioItem/Feature-Created", null, null, function(event, data) {
        console.log("PortfolioItem/Feature-Created", data);
        game.shipScreen.addFeature(data.record);
        // if (data && data.record && data.oid) {
        //     game.createItem(data.oid, data.record);
        // }
    });

    // /**
    //  * Listen to all Initiative related changes
    //  *
    //  */
    // $(listenTo).on("PortfolioItem/Initiative-Updated", null, null, function(event, data) {
    //     console.log("PortfolioItem/Initiative-Updated", data);
    //     // if (data && data.record && data.oid) {
    //     //     game.updateItem(data.oid, data.record);
    //     // }
    // }); 

    // $(listenTo).on("PortfolioItem/Initiative-Recycled", null, null, function(event, data) {
    //     console.log("PortfolioItem/Initiative-Recycled", data);
    //     // if (data && data.oid) {
    //     //     game.removeItem(data.oid);
    //     // }
    // });

    $(listenTo).on("PortfolioItem/Initiative-Created", null, null, function(event, data) {
        console.log("PortfolioItem/Initiative-Created", data);
        game.shipScreen.addInitiative(data.record);
        // if (data && data.record && data.oid) {
        //     game.createItem(data.oid, data.record);
        // }
    });

    // /**
    //  * Check on the realtime connection
    //  */
    // $(listenTo).on("RealtimeConnection-Status", null, null, function(event, data) {
    //     if (data && data.status && data.status != 200) {
    //         // handle error in connection
    //         // in an idempotent manner! realtime tries to reconnect and could just loop on the same error
    //         // TODO game.realtimeConnectionError();
    //     }
    // });
}