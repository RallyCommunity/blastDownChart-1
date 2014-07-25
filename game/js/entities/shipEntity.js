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
        this.setVelocity(6, 0);

        this.type = settings.type;

        this.numSteps = 0;                  // how many steps have I gone - used to determine direction
        this.moveRight = true;              // which direction to move
        this.collidable = true;             // Can be hit by bullet entities
        this.objectID = settings.objectID;  // ObjectID used for ship destruction and removal
        this.record = settings.record;
        this.date = settings.date;

        this.featureOid = settings.featureOid || null;

        this.color = "red";
        
        this.isVulnerable = false;          // can this ship be destroyed
        this.goToY = y;                     // final y position
        this.setupComplete = false;         // I am in position
        this.alpha = 1;
        this.parent = this.parent;

        this.animateSprite = settings.animateSprite;
        this.flip = true;
        this.spritewidth = settings.spritewidth;
        this.isInSync = false;
        this.numPerMove = 30;

        /**
         * Returns whether or not this ship is vulnerable to attack
         * @return true if this ship can be destroyed, else false
         */
        this.isDestructable = function() {
            return this.isVulnerable;
        };

        this.flyOff = function() {
            // fade off the screen instead of flying off
            // have to remove it from data structures immediately in case they are restored
            game.log.addItem(this.record.get('Name') + " recycled", this.date, 'recycled');
            if (!(game.OID_MAP[this.objectID] && game.OID_MAP[this.objectID].targeted)) {

                game.POSITION_MANAGER.addAvailablePosition(this.spritewidth, this.startingX, this.startingY);

                game.removeOidFromMap(this.objectID, true);
                if (this.renderable) {
                    (new me.Tween(this.renderable))
                        .to({
                            alpha: 0
                        }, 3000)
                        .onComplete((function() {               
                            me.game.world.removeChild(this);
                        }).bind(this))
                        .start();
                }
            } // else it is currently targeted, dont fade.  Just log that it was recycled.
        };

    },

    // // TODO
    // draw: function(context) {
    //     context.save();
          
    //     //context.clearRect(this.pos.x, this.pos.y, this.spritewidth, this.height); 
    //     this.parent(context);    
    //     context.globalCompositeOperation = "source-in";

    //     context.fillStyle="green";
    //     context.fillRect(this.pos.x, this.pos.y, this.spritewidth, this.height);

    //     context.globalCompositeOperation = "source-over";
    //     context.restore();
    // },

    update: function(dt) {
        this.numSteps++;
        if (!this.setupComplete) {
            // move in to position
            if (this.numSteps % Math.floor((50 / game.SPEED)) === 0) { // TODO increase this to make the game more choppy
                this.pos.y += 10;
            }
            
            if (this.pos.y >= this.goToY) {
                this.setupComplete = true;
                this.numSteps = 0;
            }
            return true;
        }

        var normalMovement = function(dt, theShip) {
            if (theShip.numSteps > 6 * theShip.numPerMove) {
                theShip.numSteps = 0;
                theShip.moveRight = true;
                game.aligned = true;
            } else {
                game.aligned = false;
            }

            if (theShip.numSteps != 0 && theShip.numSteps % theShip.numPerMove == 0) {
                if (theShip.moveRight) {
                    theShip.vel.x += theShip.accel.x * me.timer.tick;
                } else {
                    theShip.vel.x -= theShip.accel.x * me.timer.tick;
                }
            } else {
                if (theShip.numSteps / theShip.numPerMove > 3) {
                    theShip.moveRight = false;
                }
                theShip.vel.x = 0;
            }

            theShip.updateMovement();
            if (theShip.vel.x != 0) {
                // update object animation
                theShip.parent(200);
                return true;
            }
            return true;
        };


        if (this.type == game.ENEMY_ENTITY_SUPER) {
            return normalMovement(dt, this);
        }

        if (!this.isInSync) {
            if (this.numSteps % this.numPerMove === 0) { // TODO increase this to make the game more choppy
                this.vel.x = 0;
            }
            if (game.aligned) {
                //console.log("now in sync", game.INITIATIVE_SHIP, game.INITIATIVE_SHIP.numSteps);
                this.isInSync = true;
                this.numSteps = 0;
            }
            return true;
        }

        return normalMovement(dt, this);
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
