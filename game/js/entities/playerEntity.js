game.PlayerEntity = me.ObjectEntity.extend({

    // constructor
    init: function(x, y, settings) {
        // call the constructor
        this.parent(x, y, settings);
        this.gravity = 0.0;
        this.setVelocity(5, 0);
        
        this.type = game.PLAYER;
        
        this.targets = [];
        this.shootingOffset = 10;
        this.stepNum = 0;
    },

    // update position
    update: function(dt) {
        if (this.targets.length != 0) {
            // there is a target to shoot at!
            // line em up and shoot em down
            var myPos = (this.pos.x + this.shootingOffset);
            var targetPos = (this.targets[0].pos.x + this.targets[0].width / 2);
            if (Math.abs(myPos - targetPos) > 3 && game.canShoot) {
                if (myPos > targetPos) {
                    this.vel.x -= this.accel.x * me.timer.tick;
                } else {
                    this.vel.x += this.accel.x * me.timer.tick;
                }
            } else if (game.canShoot) {
                this.vel.x = 0;
                this.shoot();
            } else {
                this.vel.x = 0;
            }

            this.updateMovement();
            return true;
        }

        if (me.input.isKeyPressed('left')) {
            this.vel.x -= this.accel.x * me.timer.tick;
        } else if (me.input.isKeyPressed('right')) {
            this.vel.x += this.accel.x * me.timer.tick;
        } else {
            this.vel.x = 0;
        }

        if (game.canShoot && me.input.isKeyPressed('shoot')) {
            this.shoot();
        }

        // player movement pattern

        if (this.stepNum % 3 == 0) {

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
    },

    /**
     * Shoots a laser!  The player can only have 1 shot outstanding at a time
     */
    shoot: function() {
        var x = this.pos.x + this.shootingOffset;
        var shot = me.pool.pull("bullet", x, this.pos.y, {
            height: 16,
            image: "bullet",
            name: "shot",
            spriteheight: 16,
            spritewidth: 16,
            width: 16,
            shootDown: false
        });
        game.canShoot = false;
        me.game.world.addChild(shot, Number.POSITIVE_INFINITY);
    },

    /**
     * Adds the given target to the players list of targets
     * @param target the ship object to target
     */
    addTarget: function(target) {
        // keep track of a queue of targets
        Ext.Array.push(this.targets, target);
    },

    /**
     * Removes the target that was destroyed if it matches the players top target
     * @param target the target to remove
     */
    removeTarget: function(target) {
        if (this.targets.length > 0 && this.targets[0].objectID == target.objectID) {
            this.targets.shift(); // shifts the array 1 position to the left
        }
    }
});
