/* Game namespace */
var game = {
    audioOn: false, // TODO turn back on. turn sounds off for debugging so I can listen to music :)
    play: true,

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

    ENEMY_ENTITY_SMALL:  96, // small enemy type
    ENEMY_ENTITY_MEDIUM: 97, // "medium enemy type",     ENEMY_ENTITY_LARGE:  98, // large enemy type
    ENEMY_ENTITY_SUPER:  99, // super enemy type
    RALLY_SHIP_ENTITY: 91,
    EXPLOSION_TYPE: 17,

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

    OID_MAP: {
        recycled: {},
        completed: {}
    }, // map OID -> record/ship

    AVAILABLE_POSITIONS: {},

    TEAM_SHIPS: {},

    // Image asset sizes
    MOTHERSHIP: {
        width: 256,
        height: 64
    },

    SPECIAL_TEAM: 1,

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
        me.audio.init("wav"); // TODO other formats

        // Set a callback to run when loading is complete.
        me.loader.onload = this.loaded.bind(this);

        // Load the resources.
        me.loader.preload(game.resources);

        $('.closePopup').click(function(){
            game.closeHowItWorks();
        });

        // $('.closeInfo').click(function(){
        //     $(this).closest('.workItemDetail').remove();
        // });

        // $('canvas').click(function(e) {
        //     e.preventDefault();
        //     var offset = $(this).offset();
        //     var x = e.clientX - offset.left;
        //     var y = event.y - offset.top;
        //     console.log("searching", x, y);
        //     var ship = _.find(game.OID_MAP, function(value, key) {
        //         if (value.ship) {
        //             var left = value.ship.pos.x;
        //             var right = left + value.ship.width;
        //             var top = value.ship.pos.y;
        //             var bottom = top + value.ship.height;
        //             console.log(left, right, top, bottom);
        //             if (x > left && x < right && y > top && y < bottom) {
        //                 return value;
        //             }
        //         }
        //     });

        //     if (ship) {
        //         $('body').remove('.workItemDetail');
        //         console.log(ship);
        //         var info = $("<div class='workItemDetail'><div class='closeInfo button'>close</div><h1>" + ship.ship.record.get("Name") + "</h1></div>").css({top: y, left: x, position:'absolute'});
        //         $('body').append(info);

        //         $('.closeInfo').click(function(){
        //             $('body').remove('.workItemDetail');
        //         });
        //     }
        // });

        // Initialize melonJS and display a loading screen.
        me.state.change(me.state.LOADING);


    },

    showHowItWorks: function() {
        $('#howItWorks').toggleClass('hidden');
        $('#overlay').toggleClass('hidden');
        if (game.POSITION_MANAGER) {
            game.togglePlayPause();
        }
    },

    closeHowItWorks: function() {
        $('#howItWorks').toggleClass('hidden');
        $('#overlay').toggleClass('hidden');
        if (!game.play) {
            game.resume();
        }
    },


    toggleMute: function() {
        this.audioOn = !this.audioOn;
    },

    togglePlayPause: function() {
        this.play = !this.play;
        if (!this.play) {
            // pause the game
            game.pause();
        } else {
            game.resume();
        }
    },

    resume: function() {
        // unmask, restart updates, play through queue of events
        game.angularScope.eventHandler.playThrough();

        // restart the enemy ships
        _.each(game.OID_MAP, function(value, key) {
            if (value.ship) {
                value.ship.update = value.cachedUpdate;
            }
        });

        // restart the player ships
        _.each(game.TEAM_SHIPS, function(value, key) {
            value.update = value.cachedUpdate;
        });

        // stop listening for clicks
        $('canvas').click(function(e) {});

        this.startRallyShip();
    },

    pause: function() {
        // stop updates, mask screen, stop going through queue of events
        game.angularScope.eventHandler.stopEvents();
        _.each(game.OID_MAP, function(value, key) {
            if (value.ship) {
                value.cachedUpdate = value.ship.update;
                value.ship.update = function(dt) {
                    return true;
                }
            }
        });

        // stop the player ships
        _.each(game.TEAM_SHIPS, function(value, key) {
            value.cachedUpdate = value.update;
            value.update = function(dt) {
                return true;
            }
        });

        // stop the rally ship
        this.stopRallyShip();
    },

    startRallyShip: function() {
        if (!game.rallyShipInterval) {
            if (game.rallyShipOnScreen) {
                game.rallyShipOnScreen.update = game.rallyShipOnScreen.cachedUpdate;
            }
            game.rallyShipInterval = setInterval(function() {
                if (!game.rallyShipOnScreen) {
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
            }
        }
        clearInterval(game.rallyShipInterval);
        game.rallyShipInterval = null;
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
    },



    historyFinished: function() {
        if (game.endDate) {
            console.log("Initiative was completed!");
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

    // Pre: game.OID_MAP[oid] exists
    // getRecord: function(oid) {
    //     if (game.OID_MAP[oid].ship) {
    //         record = game.OID_MAP[oid].ship.record;
    //     } else {    
    //         record = game.OID_MAP.record;
    //     }
    // },

    removeOidFromMap: function(oid, recycled) {
        if (game.OID_MAP[oid]) {
            //var record = this.getRecord(oid);
            //recycled ? game.OID_MAP.recycled[oid] = record : game.OID_MAP.completed[oid] = record;
            delete game.OID_MAP[oid];
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
