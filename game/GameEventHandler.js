/**
 * Sets up event listeners to listen for new data
 * The data could come from the lbapi or the realtime service
 * so it is important to buffer the events coming in until
 * the front-end can catch up
 */
var GameEventHandler = function(realtime) {
    var listenTo = 'body';
    var eventQueue = [];
    var handler = this;
    var timer = null;

    var dequeue = function() {
        if (eventQueue.length > 0) {
            return eventQueue.shift();
        }
        return null;
    }

    $(listenTo).on("Task-Updated Task-Recycled Task-Created UserStory-Updated UserStory-Recycled UserStory-Created PortfolioItem/Feature-Updated PortfolioItem/Feature-Recycled PortfolioItem/Feature-Created PortfolioItem/Initiative-Updated PortfolioItem/Initiative-Recycled PortfolioItem/Initiative-Created",
            null, null, function(event, data) {
        eventQueue.push({
            event: event,
            data: data 
        });
    });

    this.playThrough = function() {
        if (!timer) {
            timer = setInterval(function() {
                var object = dequeue();
                if (object && object.event && object.event.type) {
                    var func = handler[object.event.type.replace('/','').replace('-', '_')];
                    if (func) {
                        func(object.data);
                    }
                } else {
                    // clearInterval(timer);
                    // timer = null;
                } // TODO else
            }, 50);
        }
    }

    this.PortfolioItemInitiative_Created = function(data) {
        game.shipScreen.addInitiative(data.record, data.oid, data.date);
    }

    this.PortfolioItemFeature_Created = function(data) {
        game.shipScreen.addFeature(data.record, data.oid, data.date);
    }

    this.UserStory_Created = function(data) {
        game.shipScreen.addStory(data.record, data.oid, data.date);
    }

    this.Task_Created = function(data) {
        game.shipScreen.addTask(data.record, data.oid, data.date);
    }

    this.PortfolioItemInitiative_Updated = function(data) {
        game.shipScreen.updateInitiative(data.record, data.oid, data.date);
    }

    this.PortfolioItemFeature_Updated = function(data) {
        game.shipScreen.updateFeature(data.record, data.oid, data.date);
    }

    this.UserStory_Updated = function(data) {
        game.shipScreen.updateStory(data.record, data.oid, data.date);
    }

    this.Task_Updated = function(data) {
        game.shipScreen.updateTask(data.record, data.oid, data.date);
    }

    this.PortfolioItemInitiative_Recycled = function(data) {
        game.shipScreen.recycleShip(data.oid, data.date);
    }

    this.PortfolioItemFeature_Recycled = function(data) {
        game.shipScreen.recycleShip(data.oid, data.date);
    }

    this.UserStory_Recycled = function(data) {
        game.shipScreen.recycleShip(data.oid, data.date);
    }

    this.Task_Recycled = function(data) {
        game.shipScreen.recycleShip(data.oid, data.date);
    }
}