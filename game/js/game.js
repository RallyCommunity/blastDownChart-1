// TODO need to track what features/stories/tasks are displayed on the screen
// TODO destroy a given feature/story/task
// TODO destroy a given feature/story/task that is not on the screen
// TODO repopulate the screen after a few have been destroyed - fly off, fly back on again?
// TODO animate the ships flying in at the beginning?
/* Game namespace */
var game = {

    // size of the game canvas
    WINDOW_WIDTH: 960,
    WINDOW_HEIGHT: 640,

    ENEMY_ENTITY_SMALL:  96, // small enemy type
    ENEMY_ENTITY_MEDIUM: 97, // medium enemy type
    ENEMY_ENTITY_LARGE:  98, // large enemy type
    ENEMY_ENTITY_SUPER:  99, // super enemy type

    PLAYER: 88, // player type
    BULLET: 77, // bullet type
    EXPLOSION: 66, // explosion type

    // boolean - can the player shoot?
    canShoot: true,

    // probability that enemy ships will shoot
    FIRE_PROBABILITY: 2000,


    // track the score
    data : {
        // score
        score : {}
    },


    // Run on page load.
    "onload" : function () {
        // Initialize the video.
        if (!me.video.init("screen", 960, 640, true, 'auto')) {
            alert("Your browser does not support HTML5 canvas.");
            return;
        }

        // add "#debug" to the URL to enable the debug Panel
        if (document.location.hash === "#debug") {
            window.onReady(function () {
                me.plugin.register.defer(this, debugPanel, "debug");
            });
        }

        // Initialize the audio.
        me.audio.init("mp3,ogg");

        // Set a callback to run when loading is complete.
        me.loader.onload = this.loaded.bind(this);

        // Load the resources.
        me.loader.preload(game.resources);

        // Initialize melonJS and display a loading screen.
        me.state.change(me.state.LOADING);
    },

    // Run on game resources loaded.
    "loaded" : function () {
        me.state.set(me.state.MENU, new game.TitleScreen());
        me.state.set(me.state.PLAY, new game.PlayScreen());

        me.pool.register("mainPlayer", game.PlayerEntity);
        me.pool.register("bullet", game.BulletEntity);
        me.pool.register("enemyShip", game.Ship);
        me.pool.register("explosion", game.ExplosionEntity);

        // TODO temporary enabling keyboard
        me.input.bindKey(me.input.KEY.LEFT,  "left");
        me.input.bindKey(me.input.KEY.RIGHT, "right");
        me.input.bindKey(me.input.KEY.SPACE, "shoot");

        $("#completeFeature").click(function() {
            console.log("clicked");
            var destroy = me.game.world.getChildByProp('objectID', game.shootMe);
            if (destroy.length == 1) {
                //me.game.world.removeChild(destroy[0]);
                var players = me.game.world.getChildByProp('type', game.PLAYER);
                if (players.length == 1) {
                    destroy[0].setVulnerable(true);
                    players[0].addTarget(destroy[0]);
                }
            }
        });

        // Start the game.
        me.state.change(me.state.PLAY);
    },

    setupShips: function(data) {
        var PADDING = 32;
        var WIDTH = game.WINDOW_WIDTH - (PADDING * 2);

        var MAX_FEATURE_ROWS = 2;
        var MAX_STORY_ROWS = 3;
        var MAX_TASK_ROWS = 4;

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
        // reset the score
        game.data.score = data.teamsPoints;

        var zAxis = 8;

        // TODO keep track of all of these for removal purposes?
        // - Solution: store the objectID on each ship
        // -           search using me.game.world.getChildByProp('objectID', id);
        // -           find its location and go shoot at it! (calcualte where it will be and where you have to shoot?)
        

        /*
         * destroy ObjectID:
         // TODO will you be able to shoot down a task? They are so small and they are moving!
         // features on the left: 12845746805
         // feature below initiative: 12845862527
         // initiative: 12767115539
            var destroy = me.game.world.getChildByProp('objectID', 12767115539);
            if (destroy.length == 1) {
                //me.game.world.removeChild(destroy[0]);
                var players = me.game.world.getChildByProp('type', game.PLAYER);
                if (players.length == 1) {
                    destroy[0].setVulnerable(true);
                    players[0].addTarget(destroy[0]);
                }
            }
         */

         game.shootMe = data.initiative.ObjectID;

        // draw the mothership
        var mothership = me.pool.pull("enemyShip", WIDTH / 2 - MOTHERSHIP.width / 2, 32, {
            height: MOTHERSHIP.height,
            image: "xlarge",
            name: "[INITIATIVE] " + data.initiative.Name,
            spriteheight: MOTHERSHIP.height,
            spritewidth: MOTHERSHIP.width,
            width: MOTHERSHIP.width,
            objectID: data.initiative.ObjectID,
            z: zAxis,
            type: game.ENEMY_ENTITY_SUPER
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
            var yPosition = 32 + 160 + Math.floor(i / featuresPerLine) * FEATURE_SHIP.height;

            var featureShip = me.pool.pull("enemyShip", xPosition, yPosition, {
                height: FEATURE_SHIP.height,
                image: "large",
                name: "[FEATURE] - " + features[i].feature.Name,
                spriteheight: FEATURE_SHIP.height,
                spritewidth: FEATURE_SHIP.width,
                width: FEATURE_SHIP.width,
                objectID: features[i].feature.ObjectID,
                z: zAxis,
                type: game.ENEMY_ENTITY_LARGE
            });

            game.shootMe = features[i].feature.ObjectID;

            me.game.world.addChild(featureShip, zAxis++);

            if (i >= featuresPerLine) {
                continue;
            }

            var stories = features[i].children;
            
            // aggregate all of the stories in this area
            for (var rows = 1; rows < featureLines; rows++) {
                var arr = features[rows * featuresPerLine + i];
                if (arr) {
                    arr = arr.children;
                } else {
                    break;
                }
                for (var el = 0; el < arr.length; el++) {
                    Ext.Array.push(stories, arr[el]); 
                }
            }

            // for proper task vertical alignment
            if (numFeatures % featuresPerLine == 0) {
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
                storyY = 32 + 160 + FEATURE_SHIP.height * Math.min(featureLines, MAX_FEATURE_ROWS) + Math.floor(j / storiesPerLine) * (STORY_SHIP.height);

                storyX = (i * sectionWidth) + (j % storiesPerLine) * ((sectionWidth) / (storiesOnThisLine + 1)) + sectionWidth / (storiesOnThisLine + 1) - (STORY_SHIP.width / 2);
                var storyShip = me.pool.pull("enemyShip", storyX, storyY, {
                    height: STORY_SHIP.height,
                    image: "medium",
                    name: "[STORY/DEFECT] - " + stories[j].artifact.Name,
                    spriteheight: STORY_SHIP.height,
                    spritewidth: STORY_SHIP.width,
                    width: STORY_SHIP.width,
                    objectID: stories[j].artifact.ObjectID,
                    z: zAxis,
                    health: 2,
                    type: game.ENEMY_ENTITY_MEDIUM
                });

                me.game.world.addChild(storyShip, zAxis++);

                // add the tasks together
                _.each(stories[j].children, function(oneTask) {
                    Ext.Array.push(tasks, oneTask);
                });
            }

            // for proper task vertical alignment
            if (numStories % storiesPerLine == 0) {
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
                // TODO test
                taskY = 32 + 160 + Math.min(storyLines, MAX_STORY_ROWS) * STORY_SHIP.height + Math.min(featureLines, MAX_FEATURE_ROWS) * FEATURE_SHIP.height + Math.floor(k / tasksPerLine) * (TASK_SHIP.height);
                taskX = (i * sectionWidth) + (k % tasksPerLine) * ((sectionWidth) / (tasksOnThisLine + 1)) + sectionWidth / (tasksOnThisLine + 1) - (TASK_SHIP.width / 2);

                var taskShip = me.pool.pull("enemyShip", taskX, taskY, {
                    height: TASK_SHIP.height,
                    image: "small",
                    name: "[TASK] - " + tasks[k].Name,
                    spriteheight: TASK_SHIP.height,
                    spritewidth: TASK_SHIP.width,
                    width: TASK_SHIP.width,
                    objectID: tasks[k].ObjectID,
                    z: zAxis,
                    health: 2,
                    type: game.ENEMY_ENTITY_SMALL
                });

                me.game.world.addChild(taskShip, zAxis++);
            }
        }

        // add our HUD to the game world
        this.HUD = new game.HUD.Container();
        me.game.world.addChild(this.HUD);
    }
};
