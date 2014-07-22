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

        this.color = "red";
        
        this.isVulnerable = false;          // can this ship be destroyed
        this.goToY = y;                     // final y position
        this.setupComplete = false;         // I am in position
        this.alpha = 1;

        this.animateSprite = settings.animateSprite;
        this.flip = true;
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
                game.POSITION_MANAGER.addAvailablePosition(this.width, this.startingX, this.startingY);
                delete game.OID_MAP[this.objectID];
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
          
    //     //context.clearRect(this.pos.x, this.pos.y, this.width, this.height); 
    //     this.parent(context);    
    //     context.globalCompositeOperation = "source-in";

    //     context.fillStyle="green";
    //     context.fillRect(this.pos.x, this.pos.y, this.width, this.height);

    //     context.globalCompositeOperation = "source-over";
    //     context.restore();
    // },


    // draw: function(context, rect) {
    //     this.parent(context, rect);

    //     var image = this.renderable.image;
    //     var tempCanvas = document.createElement('canvas');
    //     var tempContext = tempCanvas.getContext('2d');

    //     tempContext.drawImage(image, 0, 0);
    //     context.clearRect(this.pos.x, this.pos.y, image.width, image.height);
    //     var imgd = tempContext.getImageData(0, 0, image.width, image.height);

    //     // var imgd = context.getImageData(this.pos.x, this.pos.y, this.width, this.height);
    //     var pix = imgd.data;
    //     var uniqueColor = [0,0,255]; // Blue for an example, can change this value to be anything.

    //     // Loops through all of the pixels and modifies the components.
    //     for (var i = 0, n = pix.length; i <n; i += 4) {
    //         if (pix[i + 3] != 0) {
    //             pix[i] = uniqueColor[0];   // Red component
    //             pix[i+1] = uniqueColor[1]; // Green component
    //             pix[i+2] = uniqueColor[2]; // Blue component
    //         }
              
    //           //pix[i+3] is the transparency.
    //     }

    //     context.putImageData(imgd, this.pos.x, this.pos.y);
    //     context.restore();
    // },

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
               return this.normalMovement();
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
            if (this.animateSprite) {
                if (this.flip) {
                    this.flipX(true);
                } else {
                    this.flipX(false);
                }

                this.flip = !this.flip;
            }

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
        return true;
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
