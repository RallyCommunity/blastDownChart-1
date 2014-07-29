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
            if ((game.OID_MAP[this.objectID] && !game.OID_MAP[this.objectID].targeted)) {

                game.POSITION_MANAGER.addAvailablePosition(this.spritewidth, this.startingX, this.startingY);

                game.removeOidFromMap(this.objectID, true);
                if (this.renderable) {
                    if (this.tween) {
                        this.tween.stop();
                    }
                    (new me.Tween(this.renderable))
                        .to({
                            alpha: 0
                        }, 3000)
                        .onComplete((function() {               
                            me.game.world.removeChild(this);
                        }).bind(this))
                        .start();
                }
            } else if (game.OID_MAP[this.objectID] && game.TEAM_SHIPS[game.OID_MAP[this.objectID].targeted]) {
                game.removeOidFromMap(this.objectID, true);   
            }
        };

    },

    mouseDown: function() {
        if (me.input.keyStatus('enter')) {
            var x = me.input.mouse.pos.x;
            var y = me.input.mouse.pos.y;

            var offset = $('#screen').offset();

            if (x > this.pos.x && x < this.pos.x + this.width && y > this.pos.y && y < this.pos.y + this.height) {
                
                this.tween = new me.Tween(this.renderable)
                    .to({
                        alpha: 0.2
                    }, 500);

                var tween2 = new me.Tween(this.renderable)
                    .to({
                        alpha: 1
                    }, 500);

                this.tween.chain(tween2);
                this.tween.start();
                $('.workItemDetail').remove();

                var list = "<li><strong>FormattedID:</strong> " + this.record.get("FormattedID") + "</a>" + "</li>" +
                    "<li><strong>Name:</strong> " + this.record.get("Name") + "</li>";

                var feat = this.record.get('Feature');
                if (feat && game.OID_MAP[feat]) {
                    if (game.OID_MAP[feat].ship) {
                        list += "<li><strong>Feature:</strong> " + game.OID_MAP[feat].ship.record.get('Name') + "</li>";
                    } else if (game.OID_MAP[feat].record) {
                        list += "<li><strong>Feature:</strong> " + game.OID_MAP[feat].record.get('Name') + "</li>";
                    }
                }
                    
                // TODO top and left positions
                var info = $("<div class='workItemDetail'><div class='closeInfo button'>close</div><ul class='detailList'>" +
                    list + "</ul></div>").css({top: $('#screen').offset().top, left: 1024, position:'absolute'});

                $('body').append(info);
                $('.workItemDetail').fadeIn();
                $('.closeInfo').click(function(){
                    $('.workItemDetail').remove();
                });
            }
        }
    },

    update: function(dt) {
        this.mouseDown();

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


        if (this.type == game.ENEMY_ENTITY_SUPER) {
            this.normalMovement.call(this, dt);
            if (this.vel.x !== 0) {
                // update object animation
                this.parent(200);
            }
            return true;
        }

        if (!this.isInSync) {
            if (this.numSteps % this.numPerMove === 0) { // increase this to make the game more choppy
                this.vel.x = 0;
            }
            if (game.aligned) {
                this.isInSync = true;
                this.numSteps = 0;
            }
            return true;
        }

        this.normalMovement.call(this, dt);
        if (this.vel.x !== 0) {
            // update object animation
            this.parent(200);
        }
        return true;
    },

    normalMovement: function(dt) {
        if (this.numSteps > 6 * this.numPerMove) {
            this.numSteps = 0;
            this.moveRight = true;
            game.aligned = true;
        } else {
            game.aligned = false;
        }

        if (this.numSteps !== 0 && this.numSteps % this.numPerMove === 0) {
            if (this.moveRight) {
                this.vel.x += this.accel.x * me.timer.tick;
            } else {
                this.vel.x -= this.accel.x * me.timer.tick;
            }
        } else {
            if (this.numSteps / this.numPerMove > 3) {
                this.moveRight = false;
            }
            this.vel.x = 0;
        }

        this.updateMovement();

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
