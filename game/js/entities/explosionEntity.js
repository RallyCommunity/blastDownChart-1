game.ExplosionEntity = me.ObjectEntity.extend({

    // constructor
    init: function(x, y, settings) {
        // call the constructor
        this.parent(x, y, settings);
        this.gravity = 0.0;
        this.setVelocity(0, 0);
        
        this.type = game.EXPLOSION_TYPE;
        this.numSteps = 0;
    },

    update: function(dt) {
        this.numSteps++;
        if (this.numSteps == 17) {
            me.game.world.removeChild(this);
        } else if (this.numSteps == 8) {
            this.parent(100);
        }
        return true;
    }
});
