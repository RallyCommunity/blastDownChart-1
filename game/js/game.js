// TODO destroy a given feature/story/task that is not on the screen
// TODO repopulate the screen after a few have been destroyed - fly off, fly back on again?
/* Game namespace */
var game = {

    // size of the game canvas
    WINDOW_WIDTH: 960,
    WINDOW_HEIGHT: 640,

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
    FIRE_PROBABILITY: 2000,

    OID_MAP : {}, // map OID -> boolean (true if displayed on the screen, else false)

    // track the score
    data : {
        // score
        score : {}
    },

    log : {
        addItem: function(logEvent) {
            angular.element($("#root")).scope().addLogItem(logEvent);
        }
    },

    // Run on page load.
    "onload" : function () {
        // Initialize the video.
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

        me.pool.register("mainPlayer", game.PlayerEntity);
        me.pool.register("bullet", game.BulletEntity);
        me.pool.register("enemyShip", game.Ship);
        me.pool.register("explosion", game.ExplosionEntity);
        me.pool.register("label", game.LabelEntity);

        // Setup keyboard listeners
        me.input.bindKey(me.input.KEY.LEFT,  "left");
        me.input.bindKey(me.input.KEY.RIGHT, "right");
        me.input.bindKey(me.input.KEY.SPACE, "shoot");

        // TODO - eventually this will not be controlled by a button - realtime data
        $("#completeFeature").click(function() {
            // TODO if you dont find the OID in the game, then it might not be present.  Kill another one??
            // TODO will you be able to shoot down a task? They are so small and they are moving!

            var destroy = me.game.world.getChildByProp('objectID', game.shootMe);
            if (destroy.length == 1) {
                var players = me.game.world.getChildByProp('type', game.PLAYER);
                if (players.length == 1) {
                    destroy[0].setVulnerable(true);
                    players[0].addTarget(destroy[0]);
                }
            }
            $('#completeFeature').hide();
        });

        me.state.change(me.state.MENU);

        // Reveal the game
        $($('.rally-app')[0]).hide();
        $('#root').show();
        $('body').removeClass('x-body');
        $('html').removeClass('x-viewport');
        Ext.getBody().unmask();
    },

    addStory: function(oid) {
        // TODO gather more info
        Ext.create('Rally.data.WsapiDataStore', {
            model: 'User Story',
            fetch: ['Parent', 'ObjectID'],
            filters: [
                {
                    property: 'ObjectID',
                    operator: '=',
                    value: oid
                }
            ]
        }).load({
            scope: this,
            callback: function(records, operation, success) {
                console.log(records);
                game.log.addItem(oid + " created");
            }
        });
        
    },

    removeStory: function(oid) {
        var item = game.OID_MAP[oid];
        if (item && game.OID_MAP[oid].displayed) {
            // currently displayed - have it fly off
            var pendingRemove = me.game.world.getChildByProp('objectID', oid);
            if (pendingRemove) {
                pendingRemove.flyOff();
            }
            game.log.addItem(item.formattedId + " recycled");
        } else if (item) {
            // not currently displayed, just remove it from the map and log it
            delete game.OID_MAP[oid];
            game.log.addItem(item.formattedId + " recycled");
        }
    }
};
