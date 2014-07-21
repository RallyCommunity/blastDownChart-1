/* Game namespace */
var game = {
    audioOn: false, // turn sounds off for debugging so I can listen to music :)

    TEAM_SHIP_COLORS: [{name: "white", hex: "#FFF"}, // white
                        {name: "red", hex: "#ED1C24"}, // rally red
                        {name: "blue", hex: "#00A9E0"}], // cyan

    TEAM_SHIP_COLOR_INDEX: 0,  // mod this by the length of the colors array, and choose the correct color for your team ship

    SPEED: 5, // Adjust this to adjust the speed of everything

    // TODO new colors!
    // #FAD200 - yellow
    // #FF8200 - orange
    // #DA1884 - pink
    // #7832A5 - purple
    // #005EB8 - dark blue
    // #00B398 - teal
    // #8DC63F - green

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
    RALLY_SHIP: 91,

    SHOW_LABEL: true,

    RALLY_HUNTER: 55,

    shootingAttempts: 10,

    TEAM_SHIP: 88,     // player type
    BULLET: 77,     // bullet type
    EXPLOSION: 66,  // explosion type

    // boolean - can the player shoot?
    canShoot: {},

    // probability that enemy ships will shoot
    FIRE_PROBABILITY: 3000,

    PENDING_REMOVE: [],

    OID_MAP : {}, // map OID -> record/ship

    AVAILABLE_POSITIONS: {},

    TEAM_SHIPS: {},

    // Image asset sizes
    MOTHERSHIP: {
        width: 320,
        height: 160
    },

    SPECIAL_TEAM: 1,

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
        addCompletedItem: function(record, projectName, pointsEarned, time) {
            if (projectName && pointsEarned) {
                game.angularScope.addLogItem(record.get('Name') + " - completed by " + projectName + " for +" + pointsEarned, time, 'completed');
            } else if (projectName) {
                game.angularScope.addLogItem(record.get('Name') + " - completed by " + projectName, time, 'completed');
            } else {
                game.angularScope.addLogItem(record.get('Name') + " - completed", time, 'completed');
            }
        },

        addItem: function(logEvent, date, className) {
            game.angularScope.addLogItem(logEvent, date, className);
        },
        updateStatus: function(status) {
            game.angularScope.updateStatus(status);
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
            if (!game.PROJECT_MAPPING[team]) {
                return false;
            }
            game.angularScope.addTeamColor(game.PROJECT_MAPPING[team], color);
            return true;
        },

        getTeamColor: function(teamOid) {
            return game.angularScope.getTeamColor(game.PROJECT_MAPPING[teamOid]);
        }
    },

    // Run on page load.
    "onload" : function () {
        game.LABEL_POSITONS = [
            new Point(0, game.WINDOW_HEIGHT - 164),
            new Point(0, game.WINDOW_HEIGHT - 140),
            new Point(0, game.WINDOW_HEIGHT - 116),
            new Point(0, game.WINDOW_HEIGHT - 92),
            new Point(0, game.WINDOW_HEIGHT - 68),
        ];

        game.LABEL_INDEX = 0;

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
        me.audio.init("wav"); // TODO other formats

        // Set a callback to run when loading is complete.
        me.loader.onload = this.loaded.bind(this);

        // Load the resources.
        me.loader.preload(game.resources);


        game.redRectangle = this.getImageFromSvg('<?xml version="1.0" encoding="utf-8"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1 Tiny//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11-tiny.dtd" [<!ENTITY ns_flows "http://ns.adobe.com/Flows/1.0/"><!ENTITY ns_extend "http://ns.adobe.com/Extensibility/1.0/"><!ENTITY ns_ai "http://ns.adobe.com/AdobeIllustrator/10.0/"><!ENTITY ns_graphs "http://ns.adobe.com/Graphs/1.0/">]><svg version="1.1" baseProfile="tiny" id="Layer_1" xmlns:x="&ns_extend;" xmlns:i="&ns_ai;" xmlns:graph="&ns_graphs;"xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:a="http://ns.adobe.com/AdobeSVGViewerExtensions/3.0/"x="0px" y="0px" width="42px" height="42px" viewBox="-0.5 0.5 42 42" xml:space="preserve"><path d="M0.5,4.5v33h40v-33H0.5z M3.5,7.5h34v27h-34V7.5z" style="stroke: red; stroke-width: 2"/></svg>');
        game.blueRectangle = this.getImageFromSvg('<?xml version="1.0" encoding="utf-8"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1 Tiny//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11-tiny.dtd" [<!ENTITY ns_flows "http://ns.adobe.com/Flows/1.0/"><!ENTITY ns_extend "http://ns.adobe.com/Extensibility/1.0/"><!ENTITY ns_ai "http://ns.adobe.com/AdobeIllustrator/10.0/"><!ENTITY ns_graphs "http://ns.adobe.com/Graphs/1.0/">]><svg version="1.1" baseProfile="tiny" id="Layer_1" xmlns:x="&ns_extend;" xmlns:i="&ns_ai;" xmlns:graph="&ns_graphs;"xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:a="http://ns.adobe.com/AdobeSVGViewerExtensions/3.0/"x="0px" y="0px" width="42px" height="42px" viewBox="-0.5 0.5 42 42" xml:space="preserve"><path d="M0.5,4.5v33h40v-33H0.5z M3.5,7.5h34v27h-34V7.5z" style="stroke: blue; stroke-width: 2"/></svg>');
        // Initialize melonJS and display a loading screen.
        me.state.change(me.state.LOADING);
    },

    getImageFromSvg : function(rawSVG) {
        var svg = new Blob([rawSVG], {type:"image/svg+xml;charset=utf-8"});
        var domURL = self.URL || self.webkitURL || self;
        var url = domURL.createObjectURL(svg);

        /// create Image
        var img = new Image;

        img.src = url;
        return img;
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
        me.pool.register("rallyShip", game.RallyShipEntity);
        me.pool.register("rallyHunter", game.RallyHunterEntity);

        // Setup keyboard listeners
        me.input.bindKey(me.input.KEY.LEFT,  "left");
        me.input.bindKey(me.input.KEY.RIGHT, "right");
        me.input.bindKey(me.input.KEY.UP,  "up");
        me.input.bindKey(me.input.KEY.DOWN, "down");
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

        $('#speed').change(function() {
            game.setSpeed($(this).val());
        });

        Ext.getBody().unmask();
    },



    historyFinished: function() {
        game.isHistoryFinished = true;
        if (game.endDate) {
            console.log("Initiative was completed!");
            var obj = game.OID_MAP[game.historyFinishedData.oid];
            if (obj && obj.ship) {
                var ship = obj.ship;
                obj.targeted = true;
                var teamShip = game.getExistingTeam(obj.ship.record.get('Project'));
                if (teamShip) {
                    ship.team = obj.ship.record.get('Project');
                    teamShip.addTarget(ship);
                }
            }
        }
    },

    // speed
    setSpeed: function(speed) {
        game.SPEED = speed % 11;

        _.each(game.TEAM_SHIPS, function(ship) {
            ship.setVelocity(game.SPEED, 0);
        });
        game.angularScope.eventHandler.resetSpeed();
    },

    getTeam: function(teamOid) {
        var team = game.TEAM_SHIPS[teamOid];

        if (!team) {   
            var color = game.TEAM_SHIP_COLORS[game.TEAM_SHIP_COLOR_INDEX % game.TEAM_SHIP_COLORS.length];
            
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
            if (game.scoreboard.addTeamColor(teamOid, color.hex)) {
                game.TEAM_SHIP_COLOR_INDEX++;
                game.canShoot[teamOid] = true;

                me.game.world.addChild(team, Number.POSITIVE_INFINITY);
                game.TEAM_SHIPS[teamOid] = team;
            } else {
                return game.TEAM_SHIPS[1];
            }
        }
        return team;
    },

    getExistingTeam: function(teamOid) {
        return game.TEAM_SHIPS[teamOid] || game.TEAM_SHIPS[game.SPECIAL_TEAM];
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
