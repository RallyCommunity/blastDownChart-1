module.factory('RealtimeService', function () {
        var realtime = new Realtime();
        var oidUUID = '06841c63-ebce-4b6f-a2fc-8fd4ed0776ce';
        var typeUUID = '7d92c78a-8273-4784-99c5-c9187dc4fe8c';
        //var formattedId = '55c5512a-1518-4944-8597-3eb91875e8d1';

        return {
            connect: function(uuids) {
                var websocket = realtime.connectTo(uuids);
                console.log(realtime);        
                websocket.onmessage = Ext.bind(function(e) {
                    var data = JSON.parse(e.data);
                    console.log(data);

                    // TODO if realtime connection error, display connection state to user?

                    realtime.publishObjectChanged(data, this);
                    if (data.type && data.type == "event" && data.data && data.data.action) {
                        // TODO Pigeon does not always send back the correct events.  Here, we will handle 2 simple events
                        //      Create - User Story created
                        //      Recycle - User Story recycled
                        // A defect has been filed to make sure that these events are propagating correctly
                        // Here's to hoping that it gets fixed sometime soon.

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
                    }
                }, this);
            }
        };
});
