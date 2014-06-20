game.ExplosionEntity = me.ObjectEntity.extend({

	init: function(x, y, settings) {
        // call the constructor
        this.parent(x, y, settings);
        this.gravity = 0.0;
        // set the movement speed
        this.setVelocity(0, 0);

        this.numSteps = 0;
        this.collidable = false;
        this.type = game.EXPLOSION;
    },

    update: function() {
      this.numSteps++;
      if (this.numSteps > 3) {
          me.game.world.removeChild(this);
      }
    }
});
