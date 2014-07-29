/* Game namespace */
var game = {
    audioOn: true,
    play: true, // state of the game: playing or paused?

    TEAM_SHIP_COLORS: [ {name: "red", hex: "#ED1C24"},  // rally red
                        {name: "blue", hex: "#00A9E0"}, // cyan
                        {name: "grey", hex: "#C0C0C0"},
                        {name: "darkgold", hex: "#CF871B"},
                        {name: "darkgreen", hex: "#1E7C00"},
                        {name: "purplelt", hex: "#D7CCE5"},
                        {name: "cyanlt", hex: "#BFE9F5"},
                        {name: "white", hex: "#FFFFFF" }], 

    TEAM_SHIP_COLOR_INDEX: 0,  // mod this by the length of the colors array, and choose the correct color for your team ship

    SPEED: 5, // Adjust this to adjust the speed of everything

    // size of the game canvas
    WINDOW_WIDTH: 1024,
    WINDOW_HEIGHT: 512,

    PADDING: 64,
    WIDTH: 960,

    ENEMY_ENTITY_SMALL:  96,    // small enemy type
    ENEMY_ENTITY_MEDIUM: 97,    // medium enemy type
    ENEMY_ENTITY_LARGE:  98,    // large enemy type
    ENEMY_ENTITY_SUPER:  99,    // super enemy type
    RALLY_SHIP_ENTITY: 91,
    EXPLOSION_TYPE: 17,
    TEAM_SHIP: 88,              // player type
    BULLET: 77,                 // bullet type
    RALLY_HUNTER: 55,

    shootingAttempts: 5,

    // boolean - can the player shoot?
    canShoot: {},

    // probability that enemy ships will shoot
    FIRE_PROBABILITY: 3000,

    PENDING_REMOVE: [],

    OID_MAP: {
    }, // map OID -> record/ship

    AVAILABLE_POSITIONS: {},

    TEAM_SHIPS: {},

    // Image asset sizes
    MOTHERSHIP: {
        width: 256,
        height: 64
    },

    FEATURE_SHIP: {
        width: 64,
        height: 32
    },

    STORY_SHIP: {
        width: 32,
        height: 32
    },

    TASK_SHIP: {
        width: 16,
        height: 16
    },

    RALLY_SHIP: {
        width: 128,
        height: 64
    },

    // Rally Hunter Entity
    SPECIAL_TEAM: 1,

    // track the score
    data : {
        // score
        score : {}
    },

    log : {
        addCompletedItem: function(record, projectName, pointsEarned, time) {
            if (projectName && pointsEarned) {
                game.angularScope.addLogItem(record.get('Name') + " - completed by " + projectName + " (" + pointsEarned + " points)", time, 'completed');
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
            new Point(0, game.WINDOW_HEIGHT - 188),
            new Point(0, game.WINDOW_HEIGHT - 164),
            new Point(0, game.WINDOW_HEIGHT - 140),
            new Point(0, game.WINDOW_HEIGHT - 116),
            new Point(0, game.WINDOW_HEIGHT - 92),
            new Point(0, game.WINDOW_HEIGHT - 68)
        ];

        game.ALL_ENTITY_TYPES = [this.ENEMY_ENTITY_SMALL, this.ENEMY_ENTITY_MEDIUM, this.ENEMY_ENTITY_LARGE, this.ENEMY_ENTITY_SUPER,
                                    this.RALLY_SHIP_ENTITY, this.EXPLOSION_TYPE, this.RALLY_HUNTER, this.TEAM_SHIP, this.BULLET];

        game.LABEL_INDEX = 0;

        // Initialize the video.
        me.sys.fps = 45;
        me.sys.pauseOnBlur = false;
        if (!me.video.init("screen", game.WINDOW_WIDTH, game.WINDOW_HEIGHT, true)) {
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
        me.audio.init("wav");

        // Set a callback to run when loading is complete.
        me.loader.onload = this.loaded.bind(this);

        // Load the resources.
        me.loader.preload(game.resources);

        $('.closePopup').click(function(){
            game.closeHowItWorks();
        });

        // Initialize melonJS and display a loading screen.
        me.state.change(me.state.LOADING);


    },

    toggleScoreboard: function() {
        $('.dataColumn').toggleClass('hidden');
        $('.scoreboardToggleOption').toggleClass('hidden');
        $('.dataColumnHeader').toggleClass('hidden');
    },

    showHowItWorks: function() {
        $('#howItWorks').toggleClass('hidden');
        $('#overlay').toggleClass('hidden');
        if (game.POSITION_MANAGER && game.play) {
            game.togglePlayPause();
        }
    },

    closeHowItWorks: function() {
        $('#howItWorks').toggleClass('hidden');
        $('#overlay').toggleClass('hidden');
        if (!game.play) {
            game.togglePlayPause();
        }
    },


    toggleMute: function() {
        $('#muteIcon').toggleClass('hidden');
        $('#speakerIcon').toggleClass('hidden');
        this.audioOn = !this.audioOn;
    },

    togglePlayPause: function() {
        if (game.POSITION_MANAGER) {
            this.play = !this.play;

            if (!this.play) {
                // pause the game
                game.pause();
            } else {

                game.resume();
            }
        }
    },

    resume: function() {
        $('#playIcon').addClass('hidden');
        $('#pauseIcon').removeClass('hidden');
        // unmask, restart updates, play through queue of events
        game.angularScope.eventHandler.playThrough();

        _.each(this.ALL_ENTITY_TYPES, function(entity) {
            game.resumeEntity(entity);
        });

        this.startRallyShip();
    },

    pauseEntity: function(type) {
        var displayed = me.game.world.getChildByProp('type', type);

        if (displayed) {
            _.each(displayed, function(oneItem) {
                if (oneItem.update) {
                    oneItem.cachedUpdate = oneItem.update;
                    oneItem.update = function(dt) {
                        if (this.mouseDown) {
                            this.mouseDown();
                        }
                        return true;
                    };
                }
            });
        }
    },

    resumeEntity: function(type) {
        var displayed = me.game.world.getChildByProp('type', type);

        if (displayed) {
            _.each(displayed, function(oneItem) {
                if (oneItem.cachedUpdate) {
                    oneItem.update = oneItem.cachedUpdate;
                }
            });
        }
    },

    pause: function() {
        $('#playIcon').removeClass('hidden');
        $('#pauseIcon').addClass('hidden');
        // stop updates, mask screen, stop going through queue of events
        game.angularScope.eventHandler.pauseEvents();

        _.each(this.ALL_ENTITY_TYPES, function(entity) {
            game.pauseEntity(entity);
        });
    },

    startRallyShip: function() {
        if (!game.rallyShipInterval) {
            if (game.rallyShipOnScreen) {
                game.rallyShipOnScreen.update = game.rallyShipOnScreen.cachedUpdate;
            }
            game.rallyShipInterval = setInterval(function() {
                if (!game.rallyShipOnScreen && game.play) {
                    game.rallyShipOnScreen = me.pool.pull("rallyShip", -game.RALLY_SHIP.width + 1, 1, {
                        height: game.RALLY_SHIP.height,
                        image: 'rallyShip',
                        spriteheight: game.RALLY_SHIP.height,
                        spritewidth: game.RALLY_SHIP.width,
                        width: game.RALLY_SHIP.width,
                        z: Number.POSITIVE_INFINITY
                    });

                    me.game.world.addChild(game.rallyShipOnScreen, Number.POSITIVE_INFINITY);
                }
            }, 10000);
        }

    },

    stopRallyShip: function() {
        if (game.rallyShipOnScreen) {
            game.rallyShipOnScreen.cachedUpdate = game.rallyShipOnScreen.update;
            game.rallyShipOnScreen.update = function(dt) {
                return true;
            };
        }
        clearInterval(game.rallyShipInterval);
        game.rallyShipInterval = null;
    },

    // Run on game resources loaded.
    "loaded" : function () {
        me.input.registerPointerEvent("pointerdown", me.game.viewport, function (event) {
            me.event.publish("pointerdown", [ event ]);
        });

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
        game.showHowItWorks();
        $("html, body").animate({scrollTop: 10}); // so click handlers work properly - strange quirk
    },

    historyFinished: function() {
        if (game.endDate) {
            var obj = game.OID_MAP[game.historyFinishedData.oid];
            if (obj && obj.ship) {
                var ship = obj.ship;
                var teamShip = game.getExistingTeam(obj.ship.record.get('Project'));
                if (teamShip) {
                    ship.team = obj.ship.record.get('Project');
                    teamShip.addTarget(ship);
                }
            }
        }
    },


    removeOidFromMap: function(oid, recycle) {
        if (game.OID_MAP[oid]) {
            delete game.OID_MAP[oid];
        }
    },

    // speed
    setSpeed: function(speed) {
        game.SPEED = speed % 11;

        if (game.play) {
            _.each(game.TEAM_SHIPS, function(ship) {
                ship.setVelocity(game.SPEED, 0);
            });
            game.angularScope.eventHandler.resetSpeed();
        }
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
                type: game.TEAM_SHIP,
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
