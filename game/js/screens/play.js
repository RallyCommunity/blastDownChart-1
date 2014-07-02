game.PlayScreen = me.ScreenObject.extend({
    /**
     *  action to perform on state change
     */
    onResetEvent: function() {

        // Just load the level on page load
        // when data comes back fron the service, then show the ships, etc.
        me.levelDirector.loadLevel("area51");

        this.showLegend();

        this.setupShips();
    },


    /*
     * Set up the enemy ships and scoreboard like this:
     TEAM1: 3     Team2: 5     Team3: 7

                [=========]                 Initiative
        X--X X--X X--X X--X X--X X--X       Features
        [][] [][] []   [][] [][]   []       Stories/Defects
        + ++ + ++ +      ++ +               Tasks
          ++   +
    */
    setupShips: function() {
        var today = moment();
        var completedTasks = [];

        var playScreen = this;

        var realtime = new Realtime();

        var data;
        var scope = angular.element($("#root")).scope();
        data = scope.organizedData;
        console.log('orangizedData', data);

        var PADDING = 8;
        var WIDTH = game.WINDOW_WIDTH - (PADDING * 2);

        var MAX_FEATURE_ROWS = 2;
        var MAX_STORY_ROWS = 3;
        var MAX_TASK_ROWS = 4;

        // Delay to fly onto the screen
        var TASK_DELAY = 0;
        var STORY_DELAY = MAX_TASK_ROWS * game.TASK_SHIP.height;
        var FEATURE_DELAY = STORY_DELAY + MAX_STORY_ROWS * game.STORY_SHIP.height;
        var MOTHERSHIP_DELAY = FEATURE_DELAY + MAX_FEATURE_ROWS * game.FEATURE_SHIP.height;
        var TOTAL_DELAY = STORY_DELAY + FEATURE_DELAY + MOTHERSHIP_DELAY - 32 + 256;

        // reset the score
        game.data.score = data.teamsPoints;

        var zAxis = 8;

        // TODO remove me!  temporary, for button click destruction demo
        game.shootMe = data.initiative.ObjectID;


        game.OID_MAP[data.initiative.ObjectID] = {
            displayed: true,
            formattedId: data.initiative.FormattedID
        };

        var initiativeComplete = null;

        var initiativeDateString = data.initiative.ActualEndDate;
        var initDate;
        if (initiativeDateString) {
            initDate = moment(initiativeDateString);
        } else {
            initDate = moment();
        }

        console.log('WIDTH / 2 - game.MOTHERSHIP.width / 2', WIDTH / 2 - game.MOTHERSHIP.width / 2);
        // draw the mothership
        var mothership = me.pool.pull("enemyShip", WIDTH / 2 - game.MOTHERSHIP.width / 2, PADDING, {
            height: game.MOTHERSHIP.height,
            image: "xlarge",
            name: "[INITIATIVE] " + data.initiative.Name,
            spriteheight: game.MOTHERSHIP.height,
            spritewidth: game.MOTHERSHIP.width,
            width: game.MOTHERSHIP.width,
            objectID: data.initiative.ObjectID,
            z: zAxis,
            formattedId: data.initiative.FormattedID,
            type: game.ENEMY_ENTITY_SUPER,
            delay: MOTHERSHIP_DELAY,
            waitFor: TOTAL_DELAY,
            date: initDate
        });

        if (today.isAfter(initDate)) {
            initiativeComplete = mothership;
        }

        game.initiative = data.initiative

        me.game.world.addChild(mothership, zAxis);
        zAxis++;
        var features = _.toArray(data.features);
        var numFeatures = features.length;
        var featuresPerLine = Math.floor(WIDTH / game.FEATURE_SHIP.width);
        var featureLines = Math.floor(numFeatures / featuresPerLine) + 1;
        var sectionWidth = numFeatures > featuresPerLine ? WIDTH/featuresPerLine : WIDTH / numFeatures;
        var completedFeatures = [];
        var maxFeatures = featureLines > MAX_FEATURE_ROWS ? MAX_FEATURE_ROWS * featuresPerLine : numFeatures;

        game.farRight = WIDTH;

        console.log("width, WINDOW_WIDTH", WIDTH, game.WINDOW_WIDTH);


        var players = me.game.world.getChildByProp('type', game.PLAYER);
        if (players.length == 1) {
            game.PLAYER_SHIP = players[0];
        } else {
            console.error("no player"); // should never happen
        }

        // draw all the features
        for (var i = 0; i < maxFeatures; i++) {
            var pos = i % featuresPerLine;
            var xPosition = (pos * sectionWidth) + ((sectionWidth) / 2) - (game.FEATURE_SHIP.width / 2);
            var yPosition = PADDING + game.MOTHERSHIP.height + Math.floor(i / featuresPerLine) * game.FEATURE_SHIP.height;
            console.log('x', xPosition);
            game.OID_MAP[features[i].feature.ObjectID] = {
                displayed: true,
                formattedId: playScreen.getFormattedId(features[i].feature._UnformattedID, features[i].feature._TypeHierarchy),
                column: i % featuresPerLine
            };

            var featureDateString = features[i].feature.ActualEndDate;
            var featureDate = moment(featureDateString);

            var featureShip = me.pool.pull("enemyShip", xPosition, yPosition, {
                height: game.FEATURE_SHIP.height,
                image: "large",
                name: "[FEATURE] - " + features[i].feature.Name,
                spriteheight: game.FEATURE_SHIP.height,
                spritewidth: game.FEATURE_SHIP.width,
                width: game.FEATURE_SHIP.width,
                objectID: features[i].feature.ObjectID,
                formattedId: playScreen.getFormattedId(features[i].feature._UnformattedID, features[i].feature._TypeHierarchy),
                z: zAxis,
                type: game.ENEMY_ENTITY_LARGE,
                delay: FEATURE_DELAY,
                waitFor: TOTAL_DELAY,
                date: new Date(featureDate)
            });

            if (featureDateString && today.isAfter(featureDate)) {
                completedFeatures.push(featureShip);
            }

            console.log("today and feature date", today, featureDate, today.isAfter(featureDate));

            me.game.world.addChild(featureShip, zAxis++);

            // aggregate all of the stories to draw by column, so if we are wrapping around, dont try to draw them again, just continue!
            if (i >= featuresPerLine) {
                continue;
            }
            game.AVAILABLE_POSITIONS[i % featuresPerLine] = {};

            var stories = features[i].children;

            _.each(stories, function(story) {
                story.featureId = features[i].feature.ObjectID
            });
            
            // aggregate all of the stories in this area
            for (var rows = 1; rows < featureLines; rows++) {
                var arr = features[rows * featuresPerLine + i];
                if (arr) {
                    arr = arr.children;
                } else {
                    break;
                }
                for (var el = 0; el < arr.length; el++) {
                    el.featureId = features[rows * featuresPerLine + i].feature.ObjectID;
                    Ext.Array.push(stories, arr[el]); 
                }
            }

            // for proper task vertical alignment
            if (numFeatures % featuresPerLine === 0) {
                featureLines -= 1;
            }

            var numStories = stories.length;
            var storiesPerLine = Math.floor(sectionWidth / game.STORY_SHIP.width);
            var storyLines = Math.floor(numStories / storiesPerLine) + 1;

            var tasks = [];

            var maxStories = storyLines > MAX_STORY_ROWS ? MAX_STORY_ROWS * storiesPerLine : numStories;

            // draw all of the stories
            for (var j = 0; j < maxStories; j++) {
                var storyX, storyY;
                var storiesOnThisLine = storiesPerLine;
                if (Math.floor(j / storiesPerLine + 1) == storyLines) {
                    storiesOnThisLine = numStories % storiesPerLine;
                }
                storyY = PADDING + game.MOTHERSHIP.height + game.FEATURE_SHIP.height * Math.min(featureLines, MAX_FEATURE_ROWS) + Math.floor(j / storiesPerLine) * (game.STORY_SHIP.height);
                //storyX = (i * sectionWidth) + (j % storiesPerLine) * ((sectionWidth) / (storiesOnThisLine + 1)) + sectionWidth / (storiesOnThisLine + 1) - (game.STORY_SHIP.width / 2);
                storyX = (i * sectionWidth) + (j % storiesPerLine) * game.STORY_SHIP.width;
                game.OID_MAP[stories[j].artifact.ObjectID] = {
                    displayed: true,
                    formattedId: playScreen.getFormattedId(stories[j].artifact._UnformattedID, stories[j].artifact._TypeHierarchy)
                };

                var useDate = stories[j].artifact.AcceptedDate || stories[j].artifact.InProgressDate || stories[j].artifact.CreationDate || stories[j].artifact._SnapshotDate;

                var storyShip = me.pool.pull("enemyShip", storyX, storyY, {
                    height: game.STORY_SHIP.height,
                    image: "medium",
                    name: "[STORY/DEFECT] - " + stories[j].artifact.Name,
                    spriteheight: game.STORY_SHIP.height,
                    spritewidth: game.STORY_SHIP.width,
                    width: game.STORY_SHIP.width,
                    objectID: stories[j].artifact.ObjectID,
                    featureId: stories[j].featureId,
                    //formattedId: playScreen.getFormattedId(stories[j].artifact._UnformattedID, stories[j].artifact._TypeHierarchy),
                    z: zAxis,
                    health: 2,
                    type: game.ENEMY_ENTITY_MEDIUM,
                    delay: STORY_DELAY,
                    waitFor: TOTAL_DELAY,
                    date: new Date(useDate) // TODO what date to use?
                });

                me.game.world.addChild(storyShip, zAxis++);

                // add the tasks together
                _.each(stories[j].children, function(oneTask) {
                    oneTask.featureId = stories[j].featureId;
                    Ext.Array.push(tasks, oneTask);
                });

                _.each(stories[j].completedTasks, function(oneTask) {
                    oneTask.featureId = stories[j].featureId;
                    Ext.Array.push(tasks, oneTask);
                    Ext.Array.push(completedTasks, oneTask);
                });
            }
            game.AVAILABLE_POSITIONS[i % featuresPerLine].storyPositions = [];
            game.AVAILABLE_POSITIONS[i % featuresPerLine].pendingStories = [];
            for (var extra = maxStories; extra < MAX_STORY_ROWS * storiesPerLine; extra++) {
                var x, y;
                var storiesOnThisLine = storiesPerLine;
                if (Math.floor(extra / storiesPerLine + 1) == storyLines) {
                    storiesOnThisLine = numStories % storiesPerLine;
                }
                y = PADDING + game.MOTHERSHIP.height + game.FEATURE_SHIP.height * Math.min(featureLines, MAX_FEATURE_ROWS) + Math.floor(extra / storiesPerLine) * (game.STORY_SHIP.height);

                x = (i * sectionWidth) + (extra % storiesPerLine) * game.STORY_SHIP.width;

                game.AVAILABLE_POSITIONS[i % featuresPerLine].storyPositions.push(new Point(x, y));
            }

            for (var x = maxStories; x < numStories; x++) {
                _.each(stories[x].children, function(oneTask) {
                    oneTask.featureId = stories[x].featureId;
                    Ext.Array.push(tasks, oneTask);
                });

                _.each(stories[x].completedTasks, function(oneTask) {
                    oneTask.featureId = stories[x].featureId;
                    Ext.Array.push(tasks, oneTask);
                    Ext.Array.push(completedTasks, oneTask);
                });
            }

            // add the stories not shown to the map
            this.addExtraToMap(maxStories, stories, 'artifact', 'pendingStories');

            // for proper task vertical alignment
            if (numStories % storiesPerLine === 0) {
                storyLines -= 1;
            }

            var numTasks = tasks.length;
            var tasksPerLine = Math.floor(sectionWidth / game.TASK_SHIP.width);
            var taskLines = Math.floor(numTasks / tasksPerLine) + 1;
            var maxTasks = taskLines > MAX_TASK_ROWS ? MAX_TASK_ROWS * tasksPerLine : numTasks;

            // draw all of the tasks
            for (var k = 0; k < maxTasks; k++) {
                var taskX, taskY;
                var tasksOnThisLine = tasksPerLine;
                if (Math.floor(k / tasksPerLine + 1) == taskLines) {
                    tasksOnThisLine = numTasks % tasksPerLine;
                }

                taskY = PADDING + game.MOTHERSHIP.height + Math.min(storyLines, MAX_STORY_ROWS) * game.STORY_SHIP.height + Math.min(featureLines, MAX_FEATURE_ROWS) * game.FEATURE_SHIP.height + Math.floor(k / tasksPerLine) * (game.TASK_SHIP.height);
                taskX = (i * sectionWidth) + (k % tasksPerLine) * game.TASK_SHIP.width;
                //taskX = (i * sectionWidth) + (k % tasksPerLine) * ((sectionWidth) / (tasksOnThisLine + 1)) + sectionWidth / (tasksOnThisLine + 1) - (game.TASK_SHIP.width / 2);
                game.shootMe = tasks[k].ObjectID;

                game.OID_MAP[tasks[k].ObjectID] = {
                    displayed: true,
                    formattedId: playScreen.getFormattedId(tasks[k]._UnformattedID, tasks[k]._TypeHierarchy)
                };

                var taskShip = me.pool.pull("enemyShip", taskX, taskY, {
                    height: game.TASK_SHIP.height,
                    image: "small",
                    name: "[TASK] - " + tasks[k].Name,
                    spriteheight: game.TASK_SHIP.height,
                    spritewidth: game.TASK_SHIP.width,
                    width: game.TASK_SHIP.width,
                    objectID: tasks[k].ObjectID,
                    z: zAxis,
                    health: 2,
                    type: game.ENEMY_ENTITY_SMALL,
                    delay: TASK_DELAY,
                    featureId: tasks[k].featureId,
                    waitFor: TOTAL_DELAY,
                    date: new Date(tasks[k]._SnapshotDate) // TODO what date to use?
                });

                me.game.world.addChild(taskShip, zAxis++);
            }

            game.AVAILABLE_POSITIONS[i % featuresPerLine].taskPositions = [];
            game.AVAILABLE_POSITIONS[i % featuresPerLine].pendingTasks = [];
            for (var extra = maxTasks; extra < MAX_TASK_ROWS * tasksPerLine; extra++) {
                var x, y;
                var tasksOnThisLine = tasksPerLine;
                if (Math.floor(extra / tasksPerLine + 1) == taskLines) {
                    tasksOnThisLine = numTasks % tasksPerLine;
                }

                y = PADDING + game.MOTHERSHIP.height + Math.min(storyLines, MAX_STORY_ROWS) * game.STORY_SHIP.height + Math.min(featureLines, MAX_FEATURE_ROWS) * game.FEATURE_SHIP.height + Math.floor(extra / tasksPerLine) * (game.TASK_SHIP.height);
                x = (i * sectionWidth) + (extra % tasksPerLine) * game.TASK_SHIP.width;
                
                game.AVAILABLE_POSITIONS[i % featuresPerLine].taskPositions.push(new Point(x, y));
            }

            // add the tasks that are not shown to the map
            this.addExtraToMap(maxTasks, tasks, null, 'pendingTasks');
        }

        // currently cannot add a feature

        // add the features that are not shown to the map
        this.addExtraToMap(maxFeatures, features, 'feature');

        // add our HUD to the game world
        // this.HUD = new game.HUD.Container();
        // me.game.world.addChild(this.HUD);


        if (game.PLAYER_SHIP) {

            game.PLAYER_SHIP.setDelay(TOTAL_DELAY);

            // destroy all completed items
            console.log("shoot down completed tasks", completedTasks);
            _.each(completedTasks, function(task) {
                console.log(task);
                var destroy = me.game.world.getChildByProp('objectID', task.ObjectID);
                if (destroy && destroy.length == 1) {
                    console.log("destroy ", destroy);
                    
                    game.PLAYER_SHIP.addTarget(destroy[0]);
                }
            });

            
            _.each(data.closedStories, function(story) {
                var destroy = me.game.world.getChildByProp('objectID', story.artifact.ObjectID); // TODO dont get by id
                if (destroy && destroy.length == 1) {
                    
                    game.PLAYER_SHIP.addTarget(destroy[0]);
                }
            });

            _.each(completedFeatures, function(feature) {
                game.PLAYER_SHIP.addTarget(feature);
            });

            game.PLAYER_SHIP.sortTargetsByDate();

            if (initiativeComplete) {
                game.PLAYER_SHIP.addTarget(initiativeComplete);
            }
        }

        console.log("available", game.AVAILABLE_POSITIONS);
    },


    showLegend: function() {
        function changeShip(num) {
            var ships = $('.shipContainer');
            if (num >= ships.length) {
                num = 0;
            }

            $(ships[num]).fadeIn().delay(5000).fadeOut(function() {
                 changeShip(num + 1);
             });
        }
        $('.shipContainer.logo').hide();
        changeShip(1);
    },

    /**
     * Adds the given values to the OID_MAP as not shown
     * @param start the starting index in the values array
     * @param values the array of items to add
     * @param property the property offset of the object in the array to access ObjectID (if any)
     */
    addExtraToMap: function(start, values, property, pendingProperty) {
        // add all not shown tasks OIDs to the map
        console.log(start, values, property, pendingProperty);
        var meScreen = this;
        for (var extra = start; extra < values.length; extra++) {
            if (property) {
                game.OID_MAP[values[extra][property].ObjectID] = {
                    displayed: false,
                    formattedId: meScreen.getFormattedId(values[extra][property]._UnformattedID, values[extra][property]._TypeHierarchy)
                };

                if (pendingProperty && values[extra].featureId) {
                    console.log("pending property", pendingProperty);
                    values[extra][property].featureId = values[extra].featureId;
                    game.AVAILABLE_POSITIONS[game.OID_MAP[values[extra].featureId].column][pendingProperty].push(values[extra][property]);
                }

            } else {
                game.OID_MAP[values[extra].ObjectID] = {
                    displayed: false,
                    formattedId: meScreen.getFormattedId(values[extra]._UnformattedID, values[extra]._TypeHierarchy)
                };

                if (pendingProperty && values[extra].featureId) {
                    console.log("pending property", pendingProperty);
                    game.AVAILABLE_POSITIONS[game.OID_MAP[values[extra].featureId].column][pendingProperty].push(values[extra]);
                }
            }


        }
    },


    /**
     *  action to perform when leaving this screen (state change)
     */
    onDestroyEvent: function() {
        // TODO remove all ships?

        _.each(game.OID_MAP, function(element, index, list) {
            console.log(element, index, list);
            if (element.displayed) {
                var destroy = me.game.world.getChildByProp('objectID', index);
                if (destroy && destroy.length > 0) {
                    destroy = destroy[0];
                    var offset;
                    switch (destroy.type) {
                        case game.ENEMY_ENTITY_LARGE:
                            offset = 'LARGE';
                            break;

                        case game.ENEMY_ENTITY_MEDIUM:
                            offset = 'MEDIUM'; 
                            break;
                        default: offset = 'SMALL';
                    }
                    game.VICTORY_ANIMATIONS[offset].push(new Point(destroy.pos.x + destroy.width / 2, destroy.pos.y + destroy.height / 2));

                    me.game.world.removeChild(destroy);
                    // TODO animate destruction of remaining ships?
                }
            }
        });
    },

    /**
     * Determines and returns the formatted id
     * @param unformattedID the unformattedID of the object
     * @param typeHierarchy the typeHierarchy array of the object
     * @return the corresponding FormattedId
     */
    getFormattedId: function(unformattedID, typeHierarchy) {
        var ret = "";
        typeHierarchy = typeHierarchy[typeHierarchy.length - 1].toLowerCase();
        if (typeHierarchy === "hierarchicalrequirement") {
            ret += "US";
        } else if (typeHierarchy === "defect") {
            ret += "DE";
        } else if (typeHierarchy === "portfolioitem/feature") {
            ret += "F";
        } else if (typeHierarchy == "task") {
            ret += "T";
        } else {
            console.log("not found", typeHierarchy);
        }
        ret += unformattedID;
        return ret;
    }
});
