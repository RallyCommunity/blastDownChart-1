function RealtimeDataHandler() {
    this.queue = [];

    this.handleRealtimeMessage = function(data) {
        if (game.SHOW_LABEL || this.queue.length > 0) { // setup not complete yet and we want to handle events in orders
            // queue and return
            this.queue.push(data);
            return;
        }
        handle(this);
    }

    this.handlePendingReatimeMessages = function() {
        while (this.queue.length != 0) {
            handle(this.queue.shift());
        }
    }

    var handle = function(data) {
        if (data.type && data.type == "event" && data.data && data.data.action) {
            // TODO Pigeon does not always send back the correct events.  Here, we will handle 2 simple events
            //      Create - User Story created
            //      Recycle - User Story recycled
            // A defect has been filed to make sure that these events are propagating correctly
            // Here's to hoping that it gets fixed sometime soon.

            // TODO question do we get events "in order" (is that guaranteed?)
            // TODO revisit conditions for event relevance
            // TODO refactor

            // User Stories
            if (data.data.action == "Created" && data.data.state && data.data.state[typeUUID] && data.data.state[typeUUID].value == "UserStory") {
                console.info('Add Story');
                game.addStory(data.data.state[oidUUID].value); // send OID to game side
                return;
            } else if (data.data.action == "Recycled" && data.data.changes && data.data.changes[typeUUID] && data.data.changes[typeUUID].old_value == "UserStory") {
                console.info('Remove Story');
                game.removeStory(data.data.changes[oidUUID].old_value);
                return;
            } // ignore all other cases for now

            // Tasks
            if (data.data.action == "Created" && data.data.state && data.data.state[typeUUID] && data.data.state[typeUUID].value == "Task") {
                console.info('Add Task');
                game.addTask(data.data.state[oidUUID].value);
            } else if (data.data.action == "Recycled" && data.data.changes && data.data.changes[typeUUID] && data.data.changes[typeUUID].old_value == "Task") {
                console.info('Remove Task');
                game.removeTask(data.data.changes[oidUUID].old_value);
                return;
            } // ignore all other cases for now

            // User Story gets updated and marked as complete
            // state == "Completed" || state == "Accepted" || state == "Released"
            // points get updated on the story

            // Task gets updated and marked as complete

            // Feature gets updated and marked as complete

            // initiative gets updated and marked as complete
        }
    }
}