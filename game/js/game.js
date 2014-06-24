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
            $('#completeFeature').hide();
        });

        // Start the game.
        me.state.change(me.state.MENU);
    }
};
