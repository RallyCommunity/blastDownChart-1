// TODO destroy a given feature/story/task that is not on the screen
// TODO repopulate the screen after a few have been destroyed - fly off, fly back on again?
/* Game namespace */
var game = {

    // size of the game canvas
    WINDOW_WIDTH: 1024,
    WINDOW_HEIGHT: 512,

    ENEMY_ENTITY_SMALL:  96, // small enemy type
    ENEMY_ENTITY_MEDIUM: 97, // medium enemy type
    ENEMY_ENTITY_LARGE:  98, // large enemy type
    ENEMY_ENTITY_SUPER:  99, // super enemy type

    SHOW_LABEL: true,

    PLAYER: 88,     // player type
    BULLET: 77,     // bullet type
    EXPLOSION: 66,  // explosion type

    // boolean - can the player shoot?
    canShoot: true,

    // probability that enemy ships will shoot
    FIRE_PROBABILITY: 3000,

    PENDING_REMOVE: [],

    OID_MAP : {}, // map OID -> boolean (true if displayed on the screen, else false)

    FEATURE_COLUMN: {},

    AVAILABLE_POSITIONS: {},

    PLAYER_SHIP: null,

    // Image asset sizes
    MOTHERSHIP: {
        width: 320,
        height: 160
    },

    FEATURE_SHIP: {
        width: 64,
        height: 64
    },

    STORY_SHIP: {
        width: 32,
        height: 32
    },

    TASK_SHIP: {
        width: 16,
        height: 16
    },

    // track the score
    data : {
        // score
        score : {}
    },

    log : {
        addItem: function(logEvent, date) {
            angular.element($("#root")).scope().addLogItem(logEvent, date);
        }
    },

    // Run on page load.
    "onload" : function () {
        // Initialize the video.
        me.sys.fps = 45;
        me.sys.pauseOnBlur = false;
        if (!me.video.init("screen", game.WINDOW_WIDTH, game.WINDOW_HEIGHT, true, 'auto')) {
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
        me.state.set(me.state.VICTORY, new game.VictoryScreen());

        me.pool.register("mainPlayer", game.PlayerEntity);
        me.pool.register("bullet", game.BulletEntity);
        me.pool.register("enemyShip", game.Ship);
        me.pool.register("explosion", game.ExplosionEntity);
        me.pool.register("label", game.LabelEntity);

        // Setup keyboard listeners
        me.input.bindKey(me.input.KEY.LEFT,  "left");
        me.input.bindKey(me.input.KEY.RIGHT, "right");
        me.input.bindKey(me.input.KEY.SPACE, "shoot");



        me.state.change(me.state.MENU);

        // Reveal the game
        $($('.rally-app')[0]).hide();
        $('#root').show();
        $('body').removeClass('x-body');

        $('html').removeClass('x-viewport');
        $('#screen > canvas').focus();
        Ext.getBody().unmask();
    },

    getWorkItem: function(oid, workModel, callback) {
        Ext.create('Rally.data.WsapiDataStore', {
            model   : workModel,
            fetch   : ['Name','Feature','Feature.ObjectID'],
            filters : [{
                property : 'ObjectID',
                value    : oid
            }],
            context: {
                workspace: Rally.util.Ref.getRelativeUri(),

                //all projects
                project: null
            }
        }).load({
            callback : function(records, operation, success) {
                console.log(records);
                var story     = records[0];
                var feature   = story.get('Feature');
                console.log("story, feature", story, feature);
                callback(story, feature);
            }
        });
    },

    addWorkItem: function(oid, workModel) {
        this.getWorkItem(oid, workModel, function(story, feature) {
            game.displayStory(oid, story, feature);
        });
    },

    removeShip: function(oid) {
        // removing a ship
        var item = game.OID_MAP[oid];
        if (item && item.displayed) {
            var pendingRemove = me.game.world.getChildByProp('objectID', oid);
            game.itemFlyOff(oid, pendingRemove);
        } else if (item && item.queueColumn) {
            var arr = game.AVAILABLE_POSITIONS[item.queueColumn].pendingStories;
            if (arr) {
                arr.filter(function(shipData) {
                    return oid != shipData.ObjectID;
                });
                delete game.OID_MAP[oid];
                game.log.addItem(item.formattedId + " recycled");
            }
        } else if (item) {
            // not currently displayed, just remove it from the map and log it
            delete game.OID_MAP[oid];
            game.log.addItem(item.formattedId + " recycled");
        }
    },

    itemFlyOff: function(oid, pendingRemove) {
        if (pendingRemove && pendingRemove.length > 0 && game.OID_MAP[pendingRemove[0].featureId] && game.AVAILABLE_POSITIONS[game.OID_MAP[pendingRemove[0].featureId].column]) {
            var positions = game.AVAILABLE_POSITIONS[game.OID_MAP[pendingRemove[0].featureId].column].storyPositions;
            if (positions) {
                positions.unshift(new Point(pendingRemove[0].startingX, pendingRemove[0].startingY));
                pendingRemove[0].flyOff();
                game.log.addItem(pendingRemove[0].formattedId + " recycled");
            }
        }
    },

    getTask: function(oid, callback) {
        Ext.create('Rally.data.WsapiDataStore', {
            model   : 'Task',
            fetch   : ['WorkProduct','Name','Feature','Feature.ObjectID'],
            filters : [{
                property : 'ObjectID',
                value    : oid
            }],
            context: {
                workspace: Rally.util.Ref.getRelativeUri(),

                //all projects
                project: null
            }
        }).load({
            callback : function(records, operation, success) {
                console.log("LOOKUP " + oid, records, operation, success);
                if (records.length > 0) {
                    var task      = records[0];
                    var userStory = task.get('WorkProduct');
                    if (userStory) {
                        var feature   = userStory.Feature;

                        console.log(task, userStory, feature);
                        callback(task, userStory, feature);
                    }
                }
            }
        });
    },

    addTask: function(oid) {
        this.getTask(oid, function(task, story, feature) {
            game.displayTask(oid, task, story, feature);
        });
    },

    displayStory: function(oid, story, feature) {
        console.log(oid, story, feature);
        var id = this.getIdFromFeature(feature);
        
        console.log(id, game.OID_MAP[id]);
        if (id && game.OID_MAP[id] && game.AVAILABLE_POSITIONS[game.OID_MAP[id].column]) {
            var positions = game.AVAILABLE_POSITIONS[game.OID_MAP[id].column].storyPositions;
            if (positions && positions.length > 0) {
                var position = game.AVAILABLE_POSITIONS[game.OID_MAP[id].column].storyPositions.shift();
                console.log("putting story ship at position", position);
                game.OID_MAP[oid] = {
                    displayed: true,
                    formattedId: story.data.FormattedID
                }
                // create a new ship entitiy!
                var STORY_SHIP = {
                    width: 32,
                    height: 32
                };

                var storyShip = me.pool.pull("enemyShip", position.x, position.y, {
                    height: game.STORY_SHIP.height,
                    image: "medium",
                    name: "[STORY/DEFECT] - " + story.data.Name,
                    spriteheight: game.STORY_SHIP.height,
                    spritewidth: game.STORY_SHIP.width,
                    width: game.STORY_SHIP.width,
                    objectID: story.data.ObjectID,
                    z: 10,
                    health: 2,
                    type: game.ENEMY_ENTITY_MEDIUM,
                    delay: 0,
                    programmaticallyAdded: true,
                    featureId: id,
                    waitFor: 0
                });

                me.game.world.addChild(storyShip, 10);
                console.log('added storyship', storyShip);
                game.log.addItem(story.data.Name + ":: ADDED");
            } else {
                game.OID_MAP[oid] = {
                    displayed: false,
                    formattedId: story.data.FormattedID,
                    queueColumn: game.OID_MAP[id].column
                }

                game.AVAILABLE_POSITIONS[game.OID_MAP[id].column].pendingStories.push(story.data);
            }
        }
    },

    displayTask: function(oid, task, story, feature) {
        var id = this.getIdFromFeature(feature);

        if (id && game.OID_MAP[id] && game.AVAILABLE_POSITIONS[game.OID_MAP[id].column]) {
            var positions = game.AVAILABLE_POSITIONS[game.OID_MAP[id].column].taskPositions;
            if (positions && positions.length > 0) {
                var position = game.AVAILABLE_POSITIONS[game.OID_MAP[id].column].taskPositions.shift();
                console.log("putting story ship at position", position);
                game.OID_MAP[oid] = {
                    displayed: true,
                    formattedId: task.data.FormattedID
                }

                var taskShip = me.pool.pull("enemyShip", position.x, position.y, {
                    height: game.TASK_SHIP.height,
                    image: "small",
                    name: "[TASK] - " + task.data.Name,
                    spriteheight: game.TASK_SHIP.height,
                    spritewidth: game.TASK_SHIP.width,
                    width: game.TASK_SHIP.width,
                    objectID: task.data.ObjectID,
                    z: Number.POSITIVE_INFINITY,
                    formattedId: task.data.FormattedID,
                    health: 2,
                    type: game.ENEMY_ENTITY_SMALL,
                    delay: 0,
                    featureId: id,
                    programmaticallyAdded: true,
                    waitFor: 0
                });

                me.game.world.addChild(taskShip, Number.POSITIVE_INFINITY);
                console.log('added task', taskShip);
                game.log.addItem(task.data.Name + ":: ADDED");
            } else {
                game.OID_MAP[oid] = {
                    displayed: false,
                    formattedId: "N/A"
                }
            }
        }
    },

    cleanup: function() {
        console.log("pending", game.PENDING_REMOVE);
        _.each(game.PENDING_REMOVE, function(remove) {
            me.game.world.removeChild(remove);
        });

        game.PENDING_REMOVE = [];
    },

    cleanupOld: function() {
        console.log("pending", game.PENDING_REMOVE);
        for (var i = 0; i < game.PENDING_REMOVE.length - 2; i++) {
            me.game.world.removeChild(game.PENDING_REMOVE.shift());
        }
    },

    // TODO hacky!  Another query and then callback instead?
    getIdFromFeature: function(feature) {
        if (feature && feature._ref) {
            var parts = feature._ref.split("/");
            console.log(feature._ref, parts);
            if (parts && parts.length > 0) {
                return parseInt(parts[parts.length - 1]);
            }
        }
        return null;
    },

    completeItem: function(oid) {
        if (game.OID_MAP[oid]) {
            if (game.OID_MAP[oid].displayed) {
                var destroy = me.game.world.getChildByProp('objectID', oid);
                if (destroy.length == 1) {
                    var players = me.game.world.getChildByProp('type', game.PLAYER);
                    if (players.length == 1) {
                        destroy[0].setVulnerable(true);
                        players[0].addTarget(destroy[0]);
                    }
                }
            } else {
                // not displayed - do nothing for now
            }
        }
    }

};
