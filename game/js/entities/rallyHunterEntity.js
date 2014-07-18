// Can be controlled via keyboard/mouse
// hunts the RallyShip that flies across the top
// More random movement pattern

game.RallyHunterEntity = me.ObjectEntity.extend({

    // constructor
    init: function(x, y, settings) {
        // call the constructor
        this.parent(x, y, settings);
        this.gravity = 0.0;
        this.setVelocity(game.SPEED + 2, game.SPEED + 2);
        
        this.type = game.RALLY_HUNTER;
        
        this.targets = [];
        this.stepNum = 0;
        this.steps = 0;
        this.shots = 0;
        this.numSteps = 0;
        this.team = settings.team || null;
        var hunterShip = this;
        this.ship = this;
        this.update = function(dt) {
            return hunterShip.normalMovement(dt);
        }
    },

    // update position
    normalMovement: function(dt) {
        // Accept keyboard input

        if (me.input.isKeyPressed('up') && this.pos.y > game.WINDOW_HEIGHT - this.height * 2) {
            this.vel.y -= this.accel.y * me.timer.tick;
            this.vel.x = 0;
        } else if (me.input.isKeyPressed('down') && this.pos.y < game.WINDOW_HEIGHT - this.height) {
            this.vel.y += this.accel.y * me.timer.tick;
            this.vel.x = 0;
        } else if (me.input.isKeyPressed('left')) {
            this.vel.x -= this.accel.x * me.timer.tick;
            this.vel.y = 0;
        } else if (me.input.isKeyPressed('right')) {
            this.vel.x += this.accel.x * me.timer.tick;
            this.vel.y = 0;
        } else {
            this.vel.x = 0;
            this.vel.y = 0;
        }

        if (game.canShoot[this.team] && me.input.isKeyPressed('shoot')) {
            this.shoot();
        }
        
        this.updateMovement();
        return true;
        // TODO is the rally ship on the screen?

    },

    /**
     * Shoots a laser!  The player can only have 1 shot outstanding at a time
     */
    shoot: function() {
        var x = this.pos.x + this.width / 2;
        var teamShip = this;
        var shot = me.pool.pull("bullet", x, this.pos.y, {
            height: 16,
            image: "bullet",
            name: "shot",
            spriteheight: 16,
            spritewidth: 16,
            width: 16,
            shootDown: false,
            teamShip: teamShip
        });
        me.audio.play("shoot");
        game.canShoot[this.team] = false;
        me.game.world.addChild(shot, Number.POSITIVE_INFINITY);
    },

    /**
     * Adds the given target to the players list of targets
     * @param target the ship object to target
     */
    addTarget: function(target) {
        // TODO temporary to fix extra ships on the screen
        if (target.type == game.ENEMY_ENTITY_SUPER) {
            var playerShip = this;
            // add all remaining ships as targets first
            _.each(game.OID_MAP, function(element, index, list) {
                if (element.displayed) {
                    if (element.ship) {
                        playerShip.targets.push(element.ship);
                    }
                }
            });
            this.targets.push(target);

            // sort the queue by entity type
            this.targets = _.sortBy(this.targets, function(ship) {
                return ship.type;
            });
            this.indicateTarget();
        } else {
            // keep track of a queue of targets
            this.targets.push(target);
        }

    },

    indicateTarget: function() {
        var flicker = 200;
        // indicate to the user that they have a new target!
        var tween;
        tween = new me.Tween(this.renderable)
            .to({
                alpha: .2
            }, flicker);

        var tween2 = new me.Tween(this.renderable)
            .to({
                alpha: 1
            }, flicker);

        // Also animate the top target
        var targetTween;
        targetTween = new me.Tween(this.targets[0].renderable)
            .to({
                alpha: .2
            }, flicker);
        var targetTween2 = new me.Tween(this.targets[0].renderable)
            .to({
                alpha: 1
            }, flicker);

        targetTween.chain(targetTween2);
        targetTween.start();
        tween.chain(tween2);
        tween.start();
        this.targets[0].setVulnerable(true);

        this.update = function(dt) {
            // Is there a target to destroy?
            if (this.targets.length !== 0) {
                // navigate to the target and shoot!
                if (this.shots >= game.shootingAttemps || this.numSteps >= 400) {
                    this.shots = 0;
                    this.numSteps = 0;
                    this.targets.shift();
                    return true;
                }

                var myPos = (this.pos.x + this.width / 2);
                var targetPos = (this.targets[0].pos.x + this.targets[0].width / 2);
                var move = this.accel.x * me.timer.tick;
                this.numSteps++;
                if (Math.abs(myPos - targetPos) > move + 1 && game.canShoot[this.team]) {
                    if (myPos > targetPos) {
                        this.vel.x -= move;
                    } else {
                        this.vel.x += move;
                    }
                } else if (game.canShoot[this.team]) {
                    this.vel.x = 0;
                    this.targets[0].setVulnerable(true);
                    this.shots++;
                    this.shoot();
                } else {
                    this.vel.x = 0;
                }

                this.updateMovement();
                return true;
            }
            return true;
        }
        
    },

    /**
     * Removes the target that was destroyed if it matches the players top target
     * @param target the target to remove
     */
    removeTarget: function(target) {
        this.shots = 0;
        this.numSteps = 0;
        game.cleanupOld();
        var destroyed = this.targets.shift(); // shifts the array 1 position to the left
        this.removePotentialTarget(target); // TODO inefficient
        var hunterShip = this;

        if (destroyed && destroyed.type && destroyed.type == game.ENEMY_ENTITY_SUPER) { // completed the initiative!
            game.END_SCROLLER = game.INITIATIVE_SHIP.record.get('Name') + " COMPLETED";

            game.VICTORY_ANIMATIONS = {
                SUPER: new Point(destroyed.pos.x + destroyed.width / 2, destroyed.pos.y + destroyed.height / 2),
                LARGE: [new Point(Math.random() * (game.WINDOW_WIDTH - 50), Math.random() * (game.WINDOW_HEIGHT - 50))],
                MEDIUM: [new Point(Math.random() * (game.WINDOW_WIDTH - 50), Math.random() * (game.WINDOW_HEIGHT - 50))],
                SMALL: [new Point(Math.random() * (game.WINDOW_WIDTH - 50), Math.random() * (game.WINDOW_HEIGHT - 50))]
            }

            me.state.change(me.state.VICTORY);
        }

        if (this.targets.length > 0) {
            this.update = function(dt) {
                hunterShip.normalMovement(dt);
            }
            this.indicateTarget();
        }
    },

    removePotentialTarget: function(target) {
        var oid = target.objectID;
        var index = -1;
        for (var i = 0; i < this.targets.length; i++) {
            if (oid == this.targets[i].objectID) {
                index = i;
                break;
            }
        }

        if (index != -1) {
            this.targets.splice(index, 1);
        }
    },

    setDelay: function(delay) {
        this.delay = delay;
    },

    sortTargetsByDate: function() {
        this.targets = _.sortBy(this.targets, function(target) {
            return target.date ? new Date(target.date).getTime() : -1;
        });
    }
});
