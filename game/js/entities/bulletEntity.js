game.BulletEntity = me.ObjectEntity.extend({

	// constructor
	init: function(x, y, settings) {
        // call the constructor
        this.parent(x, y, settings);
        this.gravity = 0.0;
        // set the movement speed
        this.setVelocity(0, 8);
        this.type = game.BULLET;
    },

	update: function() {
        // did we hit the top wall?
        if (this.pos.y < 16) {
            me.game.world.removeChild(this);
        }

        // did we hit an enemy?
        var res = me.game.world.collide(this);
        if (res) {
            if (res.obj.type == game.ENEMY_ENTITY) {
                me.game.world.removeChild(this);
                
                var explosion = me.pool.pull("explosion", res.obj.pos.x, res.obj.pos.y, {
                    image: "explosion",
                    width: 32,
                    height: 32,
                    spritewidth: 32,
                    spriteheight: 32,
                    name: "explosion-" + res.obj.name
                });
                me.game.world.addChild(explosion, res.obj.z + 1);
                console.log('Destroyed: ' + res.obj.name);
                me.game.world.removeChild(res.obj);
            }
        }

        // keep going
        this.vel.y -= this.accel.y * me.timer.tick;
        this.updateMovement();
        return true;
      }
});
