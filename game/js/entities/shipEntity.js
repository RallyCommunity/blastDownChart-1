game.Ship = me.ObjectEntity.extend({

    // pass the correct image, width/height and x, y for any type of ship that moves in the same pattern
    init: function(x, y, settings) {
        // call the constructor
        this.parent(x, -settings.height + 1, settings);

        this.startingX = x;
        this.startingY = y;

        // formattedId: data.initiative.FormattedID,
            // type: game.ENEMY_ENTITY_SUPER,
            // delay: MOTHERSHIP_DELAY,
            // waitFor: TOTAL_DELAY,
            // date: initDate,

        // set the movement speed
        this.gravity = 0.0;
        this.setVelocity(0, 0);

        this.numSteps = 0;                  // how many steps have I gone - used to determine direction
        this.moveRight = true;              // which direction to move
        this.collidable = true;             // Can be hit by bullet entities
        this.objectID = settings.objectID;  // ObjectID used for ship destruction and removal

        // this.formattedId = settings.formattedId;
        // this.featureId = settings.featureId;
        
        this.isVulnerable = false;          // can this ship be destroyed
        //this.delay = settings.delay;        // Delay before moving to my y position
        this.goToY = y;                     // final y position
        this.setupComplete = false;         // I am in position


        //this.programmaticallyAdded = settings.programmaticallyAdded || false;
        //this.date = settings.date;
        // wait for the others to get setup
        //this.waitFor = settings.waitFor;

        // this.flyOff = function() {
        //     this.update = function() {
        //         this.pos.y++;
        //         if (this.pos.y >= game.WINDOW_HEIGHT - 1) {
        //             delete game.OID_MAP[this.objectID];
        //             me.game.world.removeChild(this);
        //         }
        //     }
        // }
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

        this.update = function() {
           this.normalMovement();
        }
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
