game.Ship = me.ObjectEntity.extend({

    // pass the correct image, width/height and x, y for any type of ship that moves in the same pattern
    init: function(x, y, settings) {
        // call the constructor
        this.parent(x, -settings.height + 1, settings);

        // set the movement speed
        this.gravity = 0.0;
        this.setVelocity(0, 0);

        this.numSteps = 0;                  // how many steps have I gone - used to determine direction
        this.moveRight = true;              // which direction to move
        this.collidable = true;             // Can be hit by bullet entities
        this.objectID = settings.objectID;  // ObjectID used for ship destruction and removal
        if (settings.formattedId) {
            this.formattedId = settings.formattedId;
        }
        
        this.isVulnerable = false;          // can this ship be destroyed
        this.delay = settings.delay;        // Delay before moving to my y position
        this.goToY = y;                     // final y position
        this.setupComplete = false;         // I am in position

        // wait for the others to get setup
        this.waitFor = settings.waitFor;
    },

    // ship behavior
    update: function() {
        this.waitFor--;
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

        // wait for the others to get setup
        if (this.waitFor > 0) {
            return true;
        } else {
            this.waitFor = 0; // dont let it wrap around
        }

        // ships randomly shoot at the player if they are not being targeted
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

        // movement pattern
        if (this.numSteps % 3 == 0) {
            if (this.numSteps % (192) == 0) {
                this.moveRight = !this.moveRight;
                this.numSteps = 0;
            }

            if (this.moveRight) {
                if (this.formattedId) {
                    var label = me.pool.pull("label", this.pos.x, this.pos.y, {
                        formattedId: this.formattedId,
                        height: this.height,
                        width: this.width
                    });
                    me.game.world.addChild(label, Number.POSITIVE_INFINITY);
                }
                this.pos.x -= 1;
            } else {
                this.pos.x += 1;
            }
        }
        this.numSteps++;
    },

    /**
     * Sets whether or not this ship is vulnerable to attack
     * @param vulnerability true if this ship can be destroyed, else false
     */
    setVulnerable: function(vulnerability) {
        this.isVulnerable = vulnerability;
    },

    /**
     * Returns whether or not this ship is vulnerable to attack
     * @return true if this ship can be destroyed, else false
     */
    isDestructable: function() {
        return this.isVulnerable;
    },

    flashShields: function() {
        // TODO
    }
});
