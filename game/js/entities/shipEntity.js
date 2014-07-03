game.Ship = me.ObjectEntity.extend({

    // pass the correct image, width/height and x, y for any type of ship that moves in the same pattern
    init: function(x, y, settings) {
        // call the constructor
        this.parent(x, -settings.height + 1, settings);

        this.startingX = x;
        this.startingY = y;

        // set the movement speed
        this.gravity = 0.0;
        this.setVelocity(0, 0);

        this.numSteps = 0;                  // how many steps have I gone - used to determine direction
        this.moveRight = true;              // which direction to move
        this.collidable = true;             // Can be hit by bullet entities
        this.objectID = settings.objectID;  // ObjectID used for ship destruction and removal

        this.formattedId = settings.formattedId;
        this.featureId = settings.featureId;
        
        this.isVulnerable = false;          // can this ship be destroyed
        this.delay = settings.delay;        // Delay before moving to my y position
        this.goToY = y;                     // final y position
        this.setupComplete = false;         // I am in position


        this.programmaticallyAdded = settings.programmaticallyAdded || false;
        this.date = settings.date;
        // wait for the others to get setup
        this.waitFor = settings.waitFor;

        this.flyOff = function() {
            this.update = function() {
                this.pos.y++;
                if (this.pos.y >= game.WINDOW_HEIGHT - 1) {
                    delete game.OID_MAP[this.objectID];
                    me.game.world.removeChild(this);
                }
            }
        }
    },

    // ship behavior
    // Called many times to refresh the ships on the screen
    // to optimize performance, minimize the cost of calling this
    update: function() {
        // count every set of the process
        this.waitFor--;
        // fly in from the top
        if (!this.setupComplete && this.delay <= 0) {
            // move in to position
            
            this.pos.y++;
            if (this.pos.y == this.goToY) {
                this.setupComplete = true;
            }
            return true;
        } else if (!this.setupComplete) {
            // wait!
            this.delay--;
            return true;
        }

        if (this.programmaticallyAdded) {
            var initiative = me.game.world.getChildByProp('type', game.ENEMY_ENTITY_SUPER);
            if (initiative.length == 1 && initiative[0].numSteps == 1 && !initiative[0].moveRight) {
                // wait for the movement mattern to line ups
                this.setupComplete = true;
                this.programmaticallyAdded = false;
                this.numSteps = 1;
                this.pos.x += 1;
                this.moveRight = initiative[0].moveRight;
                this.update = function() {
                   this.normalMovement();
                }
            }
            return true;
        }

        // show the label
        if (game.SHOW_LABEL && this.formattedId) {
            var label = me.pool.pull("label", this.pos.x, this.pos.y, {
                formattedId: this.formattedId,
                height: this.height,
                width: this.width
            });
            me.game.world.addChild(label, Number.POSITIVE_INFINITY);
            this.formattedId = false; // dont draw it again
        }

        // wait for the others to get setup
        if (this.waitFor > 0) {
            return true;
        } else {
            this.waitFor = 0; // dont let it wrap around
        }

        if (game.SHOW_LABEL) {
            game.SHOW_LABEL = false;
        }

        this.update = function() {
           this.normalMovement();
        }
    },

    // Use this function to eliminate unnecessary checks for ship entities
    // optimization
    normalMovement: function() {
        // ships randomly shoot at the player if they are not being targeted
        // optimization => lots of random number generation each time!
        // if (!this.isVulnerable && Math.floor(Math.random() * game.FIRE_PROBABILITY) === 0) {
        //     var x = this.pos.x + this.width / 2;
        //     var shot = me.pool.pull("bullet", x, this.pos.y, {
        //         height: 16,
        //         image: "bullet",
        //         name: "shot",
        //         spriteheight: 16,
        //         spritewidth: 16,
        //         width: 16,
        //         shootDown: true
        //     });
        //     this.shootLeft = !this.shootLeft;
        //     me.game.world.addChild(shot, Number.POSITIVE_INFINITY);
        // }

        // movement pattern
        if (this.numSteps % 3 === 0) {
            if (this.numSteps % ((game.WINDOW_WIDTH - game.farRight) * 3) === 0) {
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
