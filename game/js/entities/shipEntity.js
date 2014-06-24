game.Ship = me.ObjectEntity.extend({
    // constructor
    // pass the correct image, width/height and x, y for any type of ship that moves in the same pattern
    init: function(x, y, settings) {
        // call the constructor
        this.parent(x, -settings.height + 1, settings);
        this.gravity = 0.0;
        // set the movement speed
        this.setVelocity(0, 0);

        this.numSteps = 0;
        this.moveRight = true;
        this.collidable = true;
        this.objectID = settings.objectID;
        this.isVulnerable = false;
        this.delay = settings.delay;
        this.goToY = y;
        this.setupComplete = false;
    },

    update: function() {
        if (!this.setupComplete && this.delay <= 0) {
            this.pos.y++;
            if (this.pos.y == this.goToY) {
                this.setupComplete = true;
            }
            return true;
        } else if (!this.setupComplete) {
            this.delay--;
            return true;
        }

        // TODO change the simple movement pattern (ships fly in when created and go to their spot?)

        // ships randomly shoot at the player if you are not being targeted
        if (!this.isVulnerable && Math.floor(Math.random() * game.FIRE_PROBABILITY) == 0) {
            var x = this.pos.x + this.width / 2;
            var shot = me.pool.pull("bullet", x, this.pos.y, {
                height: 16,
                image: "bullet",
                name: "shot",
                spriteheight: 16,
                spritewidth: 16,
                width: 16,
                shootDown: true
            });
            this.shootLeft = !this.shootLeft;
            me.game.world.addChild(shot, Number.POSITIVE_INFINITY);
        }

        if (this.numSteps % 3 == 0) {
            if (this.numSteps % (96 * 2) == 0) {
                this.moveRight = !this.moveRight;
                this.numSteps = 0;
            }

            if (this.moveRight) {
                this.pos.x -= 1;
            } else {
                this.pos.x += 1;
            }
        }
        this.numSteps++;
    },

    setVulnerable: function(vulnerability) {
        this.isVulnerable = vulnerability;
    },

    isDestructable: function() {
        return this.isVulnerable;
    },

    flashShields: function() {
        // TODO
    }
});
