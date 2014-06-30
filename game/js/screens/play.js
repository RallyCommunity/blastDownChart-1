game.PlayScreen = me.ScreenObject.extend({
    /**
     *  action to perform on state change
     */
    onResetEvent: function() {

        // Just load the level on page load
        // when data comes back fron the service, then show the ships, etc.
        me.levelDirector.loadLevel("area51");

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
        // subscribe to the realtime data service
        var playScreen = this;

        var realtime = new Realtime();

        var data;
        var scope = angular.element($("#root")).scope();
        data = scope.organizedData;
        console.log('orangizedData', data);

        var PADDING = 32;
        var WIDTH = game.WINDOW_WIDTH - (PADDING * 2);

        var MAX_FEATURE_ROWS = 2;
        var MAX_STORY_ROWS = 3;
        var MAX_TASK_ROWS = 4;

        // Image asset sizes
        var MOTHERSHIP = {
            width: 320,
            height: 160
        };

        var FEATURE_SHIP = {
            width: 64,
            height: 64
        };

        var STORY_SHIP = {
            width: 32,
            height: 32
        };

        var TASK_SHIP = {
            width: 16,
            height: 16
        };

        // Delay to fly onto the screen
        var TASK_DELAY = 0;
        var STORY_DELAY = MAX_TASK_ROWS * TASK_SHIP.height;
        var FEATURE_DELAY = STORY_DELAY + MAX_STORY_ROWS * STORY_SHIP.height;
        var MOTHERSHIP_DELAY = FEATURE_DELAY + MAX_FEATURE_ROWS * FEATURE_SHIP.height;
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
        // draw the mothership
        var mothership = me.pool.pull("enemyShip", WIDTH / 2 - MOTHERSHIP.width / 2, PADDING, {
            height: MOTHERSHIP.height,
            image: "xlarge",
            name: "[INITIATIVE] " + data.initiative.Name,
            spriteheight: MOTHERSHIP.height,
            spritewidth: MOTHERSHIP.width,
            width: MOTHERSHIP.width,
            objectID: data.initiative.ObjectID,
            z: zAxis,
            formattedId: data.initiative.FormattedID,
            type: game.ENEMY_ENTITY_SUPER,
            delay: MOTHERSHIP_DELAY,
            waitFor: TOTAL_DELAY
        });

        me.game.world.addChild(mothership, zAxis);
        zAxis++;
        var features = _.toArray(data.features);
        var numFeatures = features.length;
        var featuresPerLine = Math.floor(WIDTH / FEATURE_SHIP.width);
        var featureLines = Math.floor(numFeatures / featuresPerLine) + 1;
        var sectionWidth = numFeatures > featuresPerLine ? WIDTH/featuresPerLine : WIDTH / numFeatures;

        var maxFeatures = featureLines > MAX_FEATURE_ROWS ? MAX_FEATURE_ROWS * featuresPerLine : numFeatures;

        // draw all the features
        for (var i = 0; i < maxFeatures; i++) {
            var pos = i % featuresPerLine;
            var xPosition = (pos * sectionWidth) + ((sectionWidth) / 2) - (FEATURE_SHIP.width / 2);
            var yPosition = PADDING + MOTHERSHIP.height + Math.floor(i / featuresPerLine) * FEATURE_SHIP.height;

            game.OID_MAP[features[i].feature.ObjectID] = {
                displayed: true,
                formattedId: playScreen.getFormattedId(features[i].feature._UnformattedID, features[i].feature._TypeHierarchy),
                column: i % featuresPerLine
            };

            var featureShip = me.pool.pull("enemyShip", xPosition, yPosition, {
                height: FEATURE_SHIP.height,
                image: "large",
                name: "[FEATURE] - " + features[i].feature.Name,
                spriteheight: FEATURE_SHIP.height,
                spritewidth: FEATURE_SHIP.width,
                width: FEATURE_SHIP.width,
                objectID: features[i].feature.ObjectID,
                formattedId: playScreen.getFormattedId(features[i].feature._UnformattedID, features[i].feature._TypeHierarchy),
                z: zAxis,
                type: game.ENEMY_ENTITY_LARGE,
                delay: FEATURE_DELAY,
                waitFor: TOTAL_DELAY
            });

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
            var storiesPerLine = Math.floor(sectionWidth / STORY_SHIP.width);
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
                storyY = PADDING + MOTHERSHIP.height + FEATURE_SHIP.height * Math.min(featureLines, MAX_FEATURE_ROWS) + Math.floor(j / storiesPerLine) * (STORY_SHIP.height);
                //storyX = (i * sectionWidth) + (j % storiesPerLine) * ((sectionWidth) / (storiesOnThisLine + 1)) + sectionWidth / (storiesOnThisLine + 1) - (STORY_SHIP.width / 2);
                storyX = (i * sectionWidth) + (j % storiesPerLine) * STORY_SHIP.width;
                game.OID_MAP[stories[j].artifact.ObjectID] = {
                    displayed: true,
                    formattedId: playScreen.getFormattedId(stories[j].artifact._UnformattedID, stories[j].artifact._TypeHierarchy)
                };

                var storyShip = me.pool.pull("enemyShip", storyX, storyY, {
                    height: STORY_SHIP.height,
                    image: "medium",
                    name: "[STORY/DEFECT] - " + stories[j].artifact.Name,
                    spriteheight: STORY_SHIP.height,
                    spritewidth: STORY_SHIP.width,
                    width: STORY_SHIP.width,
                    objectID: stories[j].artifact.ObjectID,
                    featureId: stories[j].featureId,
                    //formattedId: playScreen.getFormattedId(stories[j].artifact._UnformattedID, stories[j].artifact._TypeHierarchy),
                    z: zAxis,
                    health: 2,
                    type: game.ENEMY_ENTITY_MEDIUM,
                    delay: STORY_DELAY,
                    waitFor: TOTAL_DELAY
                });

                me.game.world.addChild(storyShip, zAxis++);

                // add the tasks together
                _.each(stories[j].children, function(oneTask) {
                    oneTask.featureId = stories[j].featureId;
                    Ext.Array.push(tasks, oneTask);
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
                y = PADDING + MOTHERSHIP.height + FEATURE_SHIP.height * Math.min(featureLines, MAX_FEATURE_ROWS) + Math.floor(extra / storiesPerLine) * (STORY_SHIP.height);

                x = (i * sectionWidth) + (extra % storiesPerLine) * STORY_SHIP.width;

                game.AVAILABLE_POSITIONS[i % featuresPerLine].storyPositions.push(new Point(x, y));
            }

            // add the stories not shown to the map
            this.addExtraToMap(maxStories, stories, 'artifact', 'pendingStories');


            // for proper task vertical alignment
            if (numStories % storiesPerLine === 0) {
                storyLines -= 1;
            }

            var numTasks = tasks.length;
            var tasksPerLine = Math.floor(sectionWidth / TASK_SHIP.width);
            var taskLines = Math.floor(numTasks / tasksPerLine) + 1;
            var maxTasks = taskLines > MAX_TASK_ROWS ? MAX_TASK_ROWS * tasksPerLine : numTasks;

            // draw all of the tasks
            for (var k = 0; k < maxTasks; k++) {
                var taskX, taskY;
                var tasksOnThisLine = tasksPerLine;
                if (Math.floor(k / tasksPerLine + 1) == taskLines) {
                    tasksOnThisLine = numTasks % tasksPerLine;
                }

                taskY = PADDING + MOTHERSHIP.height + Math.min(storyLines, MAX_STORY_ROWS) * STORY_SHIP.height + Math.min(featureLines, MAX_FEATURE_ROWS) * FEATURE_SHIP.height + Math.floor(k / tasksPerLine) * (TASK_SHIP.height);
                taskX = (i * sectionWidth) + (k % tasksPerLine) * TASK_SHIP.width;
                //taskX = (i * sectionWidth) + (k % tasksPerLine) * ((sectionWidth) / (tasksOnThisLine + 1)) + sectionWidth / (tasksOnThisLine + 1) - (TASK_SHIP.width / 2);
                game.shootMe = tasks[k].ObjectID;
                console.log("formatted id", playScreen.getFormattedId(tasks[k]._UnformattedID, tasks[k]._TypeHierarchy));

                game.OID_MAP[tasks[k].ObjectID] = {
                    displayed: true,
                    formattedId: playScreen.getFormattedId(tasks[k]._UnformattedID, tasks[k]._TypeHierarchy)
                };

                var taskShip = me.pool.pull("enemyShip", taskX, taskY, {
                    height: TASK_SHIP.height,
                    image: "small",
                    name: "[TASK] - " + tasks[k].Name,
                    spriteheight: TASK_SHIP.height,
                    spritewidth: TASK_SHIP.width,
                    width: TASK_SHIP.width,
                    objectID: tasks[k].ObjectID,
                    //formattedId: playScreen.getFormattedId(tasks[k]._UnformattedID, tasks[k]._TypeHierarchy),
                    z: zAxis,
                    health: 2,
                    type: game.ENEMY_ENTITY_SMALL,
                    delay: TASK_DELAY,
                    featureId: tasks[k].featureId,
                    waitFor: TOTAL_DELAY
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

                y = PADDING + MOTHERSHIP.height + Math.min(storyLines, MAX_STORY_ROWS) * STORY_SHIP.height + Math.min(featureLines, MAX_FEATURE_ROWS) * FEATURE_SHIP.height + Math.floor(extra / tasksPerLine) * (TASK_SHIP.height);
                x = (i * sectionWidth) + (extra % tasksPerLine) * TASK_SHIP.width;
                
                game.AVAILABLE_POSITIONS[i % featuresPerLine].taskPositions.push(new Point(x, y));
            }

            // add the tasks that are not shown to the map
            this.addExtraToMap(maxTasks, tasks, null, 'pendingTasks');
        }

        // currently cannot add a feature

        // add the features that are not shown to the map
        this.addExtraToMap(maxFeatures, features, 'feature');

        // add our HUD to the game world
        this.HUD = new game.HUD.Container();
        me.game.world.addChild(this.HUD);


        var players = me.game.world.getChildByProp('type', game.PLAYER);
        var player;
        if (players.length == 1) {
            player = players[0];
            player.setDelay(TOTAL_DELAY);

            // destroy all completed items
            // TODO then add in anything if there is more room?
            _.each(data.closedStories, function(story) {
                var destroy = me.game.world.getChildByProp('objectID', story.artifact.ObjectID);
                if (destroy && destroy.length == 1) {
                    destroy[0].setVulnerable(true);
                    player.addTarget(destroy[0]);
                }
            });
        }

        console.log("available", game.AVAILABLE_POSITIONS);
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
            var destroy = me.game.world.getChildByProp('objectID', index);
            me.game.world.removeChild(destroy);
        });

        me.game.world.removeChild(this.HUD);
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
