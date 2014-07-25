game.RallyShipEntity = me.ObjectEntity.extend({

    // constructor
    init: function(x, y, settings) {
        // call the constructor
        this.parent(x, y, settings);
        this.gravity = 0.0;
        this.setVelocity(game.SPEED, 0);
        
        this.type = game.RALLY_SHIP_ENTITY;
    },

    update: function() {
        // did we hit the top wall?
        if (this.pos.x > game.WINDOW_WIDTH - 10) {
            me.game.world.removeChild(this);
            game.rallyShipOnScreen = null;
        }
        this.pos.x += game.SPEED;
        return true;
    }
});
