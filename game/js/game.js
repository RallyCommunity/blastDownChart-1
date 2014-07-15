/* Game namespace */
var game = {

    TEAM_SHIP_COLORS: [{name: "white", hex: "#FFFFFF"},
                        {name: "red", hex: "#FF0000"},
                        {name: "blue", hex: "#0000FF"}],
    TEAM_SHIP_COLOR_INDEX: 0,  // mod this by the length of the colors array, and choose the correct color for your team ship


    // ["blue", "red", "lime", "yellow", "orange", "pink", "purple", "teal"],
    FEATURE_SHIP_COLORS: ["teal", "purple", "pink", "orange", "yellow", "lime", "red", "blue"],
    FEATURE_SHIP_COLOR_INDEX: 0,
    featureColorMap: {},

    // size of the game canvas
    WINDOW_WIDTH: 1024,
    WINDOW_HEIGHT: 512,

    PADDING: 8,
    WIDTH: 1000,

    ENEMY_ENTITY_SMALL:  96, // small enemy type
    ENEMY_ENTITY_MEDIUM: 97, // medium enemy type
    ENEMY_ENTITY_LARGE:  98, // large enemy type
    ENEMY_ENTITY_SUPER:  99, // super enemy type

    SHOW_LABEL: true,

    TEAM_SHIP: 88,     // player type
    BULLET: 77,     // bullet type
    EXPLOSION: 66,  // explosion type

    // boolean - can the player shoot?
    canShoot: {},

    // probability that enemy ships will shoot
    FIRE_PROBABILITY: 3000,

    PENDING_REMOVE: [],

    OID_MAP : {}, // map OID -> {displayed: boolean, formattedId: string}

    AVAILABLE_POSITIONS: {},

    TEAM_SHIPS: {},

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
        addItem: function(logEvent, date, className) {
            angular.element($("#root")).scope().addLogItem(logEvent, date, className);
        },
        updateStatus: function(status) {
            angular.element($("#root")).scope().updateStatus(status);
        }
    },

    PROJECT_MAPPING: {},

    PENDING_SCORES: {},

    scoreboard : {
        addPoints: function(team, points) {
            if (game.PROJECT_MAPPING[team]) {
                if (!points) {
                    points = 0;
                }
                game.angularScope.addPoints(game.PROJECT_MAPPING[team], parseInt(points, 10));
            } else {
                if (!game.PROJECT_MAPPING[team]) {
                    //console.error('Not in the map');
                }
            }
        },
        initPoints: function(team) {
            if (game.PROJECT_MAPPING[team]) {
                game.angularScope.initPoints(game.PROJECT_MAPPING[team]);
                return true;
            } else {
                return false;
            }
        },
        addTeamColor: function(team, color) {
            game.angularScope.addTeamColor(game.PROJECT_MAPPING[team], color);
        }
    },

    // Run on page load.
    "onload" : function () {
        // Initialize the video.
        me.sys.fps = 50;
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
    },

    reveal: function() {
        // Reveal the game
        $($('.rally-app')[0]).hide();
        $('#root').show();
        $('body').removeClass('x-body');

        $('html').removeClass('x-viewport');
        $('#screen > canvas').focus();
        Ext.getBody().unmask();
    },

    getTeam: function(teamOid) {
        var team = game.TEAM_SHIPS[teamOid];

        if (!team) {   
            var color = game.TEAM_SHIP_COLORS[game.TEAM_SHIP_COLOR_INDEX % game.TEAM_SHIP_COLORS.length];
            game.TEAM_SHIP_COLOR_INDEX++;
            // create a new one
            team = me.pool.pull("mainPlayer", 64, game.WINDOW_HEIGHT - 64, {
                image: "player_" + color.name,
                spriteheight: 64,
                spritewidth: 32,
                width: 32,
                height: 64,
                z: Number.POSITIVE_INFINITY,
                type: game.PLAYER,
                team: teamOid
            });

            // let angular know what color you assigned to this ship
            game.scoreboard.addTeamColor(teamOid, color.hex);
            game.canShoot[teamOid] = true;


            me.game.world.addChild(team, Number.POSITIVE_INFINITY);
            game.TEAM_SHIPS[teamOid] = team;
            console.log('team created', team);
        }
        return team;
    },

    getExistingTeam: function(teamOid) {
        return game.TEAM_SHIPS[teamOid];
    },

    addAvailablePosition: function(ship) {
        switch(ship.type) {
            case game.ENEMY_ENTITY_SMALL:
                    game.AVAILABLE_POSITIONS.tasks.push(new Point(ship.startingX, ship.startingY));
                    if (game.AVAILABLE_POSITIONS.pendingTasks.length > 1) {
                        var pendingOid = game.AVAILABLE_POSITIONS.pendingTasks[0];
                        if (game.OID_MAP[pendingOid]) {
                            game.shipScreen.addTask(game.OID_MAP[pendingOid].record, pendingOid, game.OID_MAP[pendingOid].date);
                            game.AVAILABLE_POSITIONS.pendingTasks.shift();
                        }
                    }
                    
                    break;
            case game.ENEMY_ENTITY_MEDIUM:
                    if (game.AVAILABLE_POSITIONS.pendingStories.length > 0) {
                        var pendingObj = false;
                        while (!pendingObj) {
                            var oid = game.AVAILABLE_POSITIONS.pendingStories.shift();
                            if (!oid) {
                                break;
                            }
                            pendingObj = game.OID_MAP[oid];
                            if (pendingObj && !pendingObj.displayed) {
                                game.shipScreen.addEnemy(pendingObj.record, oid, pendingObj.date, "medium", game.ENEMY_ENTITY_MEDIUM, game.STORY_SHIP.height, game.STORY_SHIP.width, ship.startingX, ship.startingY);
                                return;
                            }
                        }
                        
                    }
                    game.AVAILABLE_POSITIONS.stories.push(new Point(ship.startingX, ship.startingY));
                    break;
            case game.ENEMY_ENTITY_LARGE:
                    game.AVAILABLE_POSITIONS.features.push(new Point(ship.startingX, ship.startingY));
                    if (game.AVAILABLE_POSITIONS.pendingFeatures.length > 1) {
                        var pendingOid = game.AVAILABLE_POSITIONS.pendingFeatures[0];
                        if (game.OID_MAP[pendingOid]) {
                            game.shipScreen.addFeature(game.OID_MAP[pendingOid].record, pendingOid, game.OID_MAP[pendingOid].date);
                            game.AVAILABLE_POSITIONS.pendingFeatures.shift();
                        }
                    }
                    break;
            default:
                    console.log("default", ship, ship.type);
        }
    },

    /**
     * Cleanup animations
     */
    cleanup: function() {
        _.each(game.PENDING_REMOVE, function(remove) {
            me.game.world.removeChild(remove);
        });

        game.PENDING_REMOVE = [];
    },

    cleanupOld: function() {
        for (var i = 0; i < game.PENDING_REMOVE.length - 2; i++) {
            me.game.world.removeChild(game.PENDING_REMOVE.shift());
        }
    }
};
