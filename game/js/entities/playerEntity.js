game.PlayerEntity = me.ObjectEntity.extend({

	// constructor
	init: function(x, y, settings) {
        // call the constructor
        this.parent(x, y, settings);
        this.gravity = 0.0;
        this.type = game.PLAYER;
        this.movesUntilShoot = 0;
        // set the default horizontal & vertical speed (accel vector)
        this.setVelocity(5, 0);
        this.shootLeft = false;
    },

    // update position
    update: function(dt) {
        if (me.input.isKeyPressed('left')) {
            //this.flipX(true);
            this.vel.x -= this.accel.x * me.timer.tick;
        } else if (me.input.isKeyPressed('right')) {
            //this.flipX(false);
            this.vel.x += this.accel.x * me.timer.tick;
        } else {
            this.vel.x = 0;
        }
        this.movesUntilShoot--;

        if (this.movesUntilShoot < 0 && me.input.isKeyPressed('shoot')) {
            var x = this.shootLeft ? this.pos.x : this.pos.x + 16;
    	    	var shot = me.pool.pull("bullet", x, this.pos.y, {
                height: 16,
                image: "bullet",
                name: "shot",
                spriteheight: 16,
                spritewidth: 16,
                width: 16
            });
            this.movesUntilShoot = 15; // 10 updates befre you can shoot again
            this.shootLeft = !this.shootLeft;
            me.game.world.addChild(shot, Number.POSITIVE_INFINITY);
    	}

        // check & update player movement
        this.updateMovement();

        // update animation if necessary
        if (this.vel.x != 0 || this.vel.y != 0) {
            // update object animation
            this.parent(dt);
            return true;
        }
        return true;
    }

});
