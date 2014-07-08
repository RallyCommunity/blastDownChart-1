game.Ship = me.ObjectEntity.extend({

    // pass the correct image, width/height and x, y for any type of ship that moves in the same pattern
    init: function(x, y, settings) {
        // call the constructor
        this.parent(x, 1 - settings.height, settings);

        this.startingX = x;
        this.startingY = y;

        // set the movement speed
        this.gravity = 0.0;
        this.setVelocity(0, 0);

        this.type = settings.type;

        this.numSteps = 0;                  // how many steps have I gone - used to determine direction
        this.moveRight = true;              // which direction to move
        this.collidable = true;             // Can be hit by bullet entities
        this.objectID = settings.objectID;  // ObjectID used for ship destruction and removal
        this.record = settings.record;
        this.date = settings.date;
        
        this.isVulnerable = false;          // can this ship be destroyed
        this.goToY = y;                     // final y position
        this.setupComplete = false;         // I am in position

        /**
         * Returns whether or not this ship is vulnerable to attack
         * @return true if this ship can be destroyed, else false
         */
        this.isDestructable =  function() {
            return this.isVulnerable;
        };


        //this.programmaticallyAdded = settings.programmaticallyAdded || false;
        //this.date = settings.date;
        // wait for the others to get setup
        //this.waitFor = settings.waitFor;

        this.flyOff = function() {
            var right = Math.floor(Math.random() * 2);
            this.update = function() {
                this.pos.y--;
                if (right == 0) {
                    this.pos.x--;
                } else {
                    this.pos.x++;
                }
                
                if (this.pos.y <= 1 - this.height) {
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
        // fly in from the top
        if (!this.setupComplete) {
            // move in to position
            this.pos.y++;
            if (this.pos.y == this.goToY) {
                this.setupComplete = true;
            }
            return true;
        }

        if (this.type == game.ENEMY_ENTITY_SUPER) {
            this.update = function() {
               this.normalMovement();
            }
        }

        if (game.INITIATIVE_SHIP && game.INITIATIVE_SHIP.numSteps == 1 && !game.INITIATIVE_SHIP.moveRight) {
            // wait for the movement mattern to line ups
            this.setupComplete = true;
            this.numSteps = 1;
            this.pos.x += 1;
            this.moveRight = game.INITIATIVE_SHIP.moveRight;
            this.update = function() {
               this.normalMovement();
            }
        }

        return true;
    },

    // Use this function to eliminate unnecessary checks for ship entities
    // optimization
    normalMovement: function() {
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
        this.z = Number.POSITIVE_INFINITY;
    },

    flashShields: function() {
        // TODO
    }
});
