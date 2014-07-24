game.RallyShipEntity = me.ObjectEntity.extend({

    // constructor
    init: function(x, y, settings) {
        // call the constructor
        this.parent(x, y, settings);
        this.gravity = 0.0;
        this.setVelocity(game.SPEED, 0);
        
        this.type = game.RALLY_SHIP_ENTITY;
    },

    draw: function(context, rect) {
        this.parent(context, rect);

    },

    update: function() {
        // did we hit the top wall?
        if (this.pos.x > game.WINDOW_WIDTH) {
            me.game.world.removeChild(this);
        }
        this.pos.x += game.SPEED;
        return true;
    }
});
