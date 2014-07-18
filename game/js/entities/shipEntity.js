game.Ship = me.ObjectEntity.extend({

    // pass the correct image, width/height and x, y for any type of ship that moves in the same pattern
    init: function(x, y, settings) {
        // call the constructor
        settings.color = "red";
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

        this.featureOid = settings.featureOid || null;
        //console.log("featureOid", this.featureOid);

        this.color = "red";
        
        this.isVulnerable = false;          // can this ship be destroyed
        this.goToY = y;                     // final y position
        this.setupComplete = false;         // I am in position
        this.alpha = 1;

        /**
         * Returns whether or not this ship is vulnerable to attack
         * @return true if this ship can be destroyed, else false
         */
        this.isDestructable =  function() {
            return this.isVulnerable;
        };
    },


    // TODO
    draw: function(context) {
        context.save();
        this.parent(context);       
        context.globalCompositeOperation = "source-in";

        // context.fillStyle="green";
        // context.fillRect(this.pos.x, this.pos.y, this.width, this.height);

        context.globalCompositeOperation = "source-over";
        context.restore();
    },

    flyOff : function() {
        // fade off the screen instead of flying off
        // have to remove it from data structures immediately in case they are restored
        game.POSITION_MANAGER.addAvailablePosition(this.width, this.startingX, this.startingY);
        delete game.OID_MAP[this.objectID];
        var teamShip = game.getExistingTeam(this.featureOid);
        if (teamShip) {
            teamShip.removePotentialTarget(this);
        }
        
        (new me.Tween(this.renderable))
            .to({
                alpha: 0
            }, 3000)
            .onComplete((function() {               
                me.game.world.removeChild(this);
            }).bind(this))
            .start();

    },

    // ship behavior
    // Called many times to refresh the ships on the screen
    // to optimize performance, minimize the cost of calling this
    update: function() {
        // fly in from the top
        this.numSteps++;
        if (!this.setupComplete) {
            // move in to position
            if (this.numSteps % Math.floor((50 / game.SPEED)) === 0) { // TODO increase this to make the game more choppy
                this.pos.y += 10;
            }
            
            if (this.pos.y >= this.goToY) {
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
        if (this.numSteps % Math.floor((100 / game.SPEED)) === 0) {
            if (this.numSteps % ((game.WINDOW_WIDTH - game.farRight)) === 0) {
                this.moveRight = !this.moveRight;
                this.numSteps = 0;
            }

            if (this.moveRight) {
                this.pos.x -= 5;
            } else {
                this.pos.x += 5;
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
        me.game.world.moveToBottom(this);
        me.game.world.moveUp(this); // move it above the backgrounds
    }
});
