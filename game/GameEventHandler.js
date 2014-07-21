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
    var consoleLog = true;

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

    $(listenTo).on("Project", null, null, function(event, data) {
        if (!game.PROJECT_MAPPING[data.record.get('ObjectID')]) {
            game.PROJECT_MAPPING[data.record.get('ObjectID')] = data.record.get('Name');
        }
    });

    $(listenTo).on("RealtimeConnection-Status", null, null, function(event, data) {
        var status = data && data.status && data.status == 200 ? 'Connected' : 'Disconnected';
        game.log.updateStatus(status);
    });

    this.stopEvents = function() {
        clearInterval(timer);
        timer = null;
        var scope = angular.element($("#root")).scope();
        scope.disconnectRealtime();
    };

    this.resetSpeed = function() {
        clearInterval(timer);
        timer = null;
        this.playThrough();
    };

    this.playThrough = function() {
        if (!timer) {
            timer = setInterval(function() {
                var object = dequeue();
                if (object && object.event && object.event.type) {
                    var func = handler[object.event.type.replace('/','').replace('-', '_')];
                    if (object.data && object.data.record && game.endDate && moment(object.data.record.get('_ValidFrom')).isAfter(game.endDate)) {
                        console.log("CLEARING INTERVAL OF GAME EVENT HANDLER");
                        clearInterval(timer);
                        game.historyFinished();
                        return;
                    }
                    if (func) {
                        func(object.data);
                    } else {
                        console.log("no func", func);
                    }
                }
            }, 200 / game.SPEED);
        }
    };

    var doLogging = function(str) {
        console.log(str);
    }

    this.PortfolioItemInitiative_Created = function(data) {
        doLogging("Initiative-Created");
        game.shipScreen.addInitiative(data.record, data.oid, data.date);
    };

    this.PortfolioItemFeature_Created = function(data) {
        doLogging("Feature-Created");
        game.shipScreen.addFeature(data.record, data.oid, data.date);
    };

    this.UserStory_Created = function(data) {
        doLogging("UserStory-Created");
        game.shipScreen.addStory(data.record, data.oid, data.date);
    };

    this.Task_Created = function(data) {
        doLogging("Initiative-Created");
        game.shipScreen.addTask(data.record, data.oid, data.date);
    };

    this.PortfolioItemInitiative_Updated = function(data) {
        doLogging("Initiative-Updated");
        game.shipScreen.updateInitiative(data.record, data.oid, data.date);
    };

    this.PortfolioItemFeature_Updated = function(data) {
        doLogging("Feature-Updated");
        game.shipScreen.updateFeature(data.record, data.oid, data.date);
    };

    this.UserStory_Updated = function(data) {
        doLogging("UserStory-Updated");
        game.shipScreen.updateStory(data.record, data.oid, data.date);
    };

    this.Task_Updated = function(data) {
        doLogging("Task-Updated");
        game.shipScreen.updateTask(data.record, data.oid, data.date);
    };

    this.PortfolioItemInitiative_Recycled = function(data) {
        doLogging("Initiative-Recycled");
        game.shipScreen.recycleShip(data.oid, data.date);
    };

    this.PortfolioItemFeature_Recycled = function(data) {
        doLogging("Feature-Recycled");
        game.shipScreen.recycleShip(data.oid, data.date);
    };

    this.UserStory_Recycled = function(data) {
        doLogging("UserStory-Recycled");
        game.shipScreen.recycleShip(data.oid, data.date);
    };

    this.Task_Recycled = function(data) {
        doLogging("Task-Recycled");
        game.shipScreen.recycleShip(data.oid, data.date);
    };
}