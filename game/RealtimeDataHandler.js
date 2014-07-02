function RealtimeDataHandler() {
    this.queue = [];
    var oidUUID = '06841c63-ebce-4b6f-a2fc-8fd4ed0776ce';
    var typeUUID = '7d92c78a-8273-4784-99c5-c9187dc4fe8c';
    this.handleRealtimeMessage = function(data) {
        console.log("got a message");
        if (game.SHOW_LABEL || this.queue.length > 0) { // setup not complete yet and we want to handle events in orders
            // queue and return
            console.log("Queueing", data, game.SHOW_LABEL, this.queue.length);
            this.queue.push(data);
            return;
        }
        handle(data);
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

            // TODO question do we get events "in order" (is that guaranteed?)
            var offset;
            var secondOffset;
            if (data.data.state && data.data.state[typeUUID]) {
                offset = 'state';
                secondOffset = 'value';
            } else if (data.data.changes && data.data.changes[typeUUID]) {
                offset = 'changes';
                secondOffset = 'old_value';
            } else {
                console.error('neither matched');
                return;
            }

            console.log("interpreting", data.data[offset][typeUUID].value);
            switch(data.data[offset][typeUUID][secondOffset]) {
                case "UserStory"    :
                                        handleUserStory(data, offset, secondOffset);
                                        break;
                case "Defect"         :
                                        handleDefect(data, offset, secondOffset);
                                        break;
                case "Task"         :
                                        handleTask(data, offset, secondOffset);
                                        break;
                case "Feature"      :
                                        handleFeature(data, offset, secondOffset);
                                        break;
                case "Initiative"   :
                                        handleInitiative(data, offset, secondOffset);
                                        break;
                default: // ignore
            }
        } // handle other cases?
    }

    var handleUserStory = function(data, prop, prop2) {
        if (data.data.action == "Created") {
            console.info('Add Story');
            game.addStory(data.data[prop][oidUUID][prop2], 'HierarchicalRequirement');
            return;
        } else if (data.data.action == "Recycled") {
            console.info('Remove Story');
            game.removeStory(data.data[prop][oidUUID][prop2], 'HierarchicalRequirement');
            return;
        } else if (data.data.action == "Updated") {

            return;
        }// ignore all other cases for now
    }

    var handleDefect = function(data) {
        // same cases as a story, just going to use a different model for queries
        if (data.data.action == "Created") {
            console.info('Add Defect');
            game.addWorkItem(data.data[prop][oidUUID][prop2], 'Defect'); // send OID to game side
            return;
        } else if (data.data.action == "Recycled") {
            console.info('Remove Defect');
            game.addWorkItem(data.data[prop][oidUUID][prop2], 'Defect');
            return;
        } else if (data.data.action == "Updated") {
            // completed?
            // points changed?
            return;
        }// ignore all other cases for now
    }

    var handleTask = function(data, prop, prop2) {
        console.log('handle task');
        if (data.data.action == "Created") {
            console.info('Add Task');
            game.addTask(data.data[prop][oidUUID][prop2]); // send OID to game side
            return;
        } else if (data.data.action == "Recycled") {
            console.info('Remove Task');
            game.removeTask(data.data[prop][oidUUID][prop2]);
            return;
        } else if (data.data.action == "Updated") {
            // completed?
            // points changed?
            return;
        } // ignore all other cases for now
    }

    var handleFeature = function(data) {
        // the only events for an feature that are of value
        // if it is updated to be completed
        if (data.data.action == "Updated") {
            // completed?
        }
    }


    var handleInitiative = function(data) {
        // the only events for an initiative that are of value
        // if it is updated to be completed
        if (data.data.action == "Updated") {
            // completed?
        }
    }
}