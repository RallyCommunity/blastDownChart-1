game.PlayerEntity = me.ObjectEntity.extend({

    // constructor
    init: function(x, y, settings) {
        // call the constructor
        this.parent(x, y, settings);
        this.gravity = 0.0;
        this.setVelocity(game.SPEED + 2, 0);
        
        this.type = game.TEAM_SHIP;
        
        this.targets = [];
        this.stepNum = 0;
        this.steps = 0;
        this.shots = 0;
        this.numSteps = 0;
        this.team = settings.team || null;
    },

    // update position
    update: function(dt) {

        // Is there a target to destroy?
        if (this.targets.length !== 0) {
            if (this.shots >= game.shootingAttempts - 1 && game.OID_MAP[this.targets[0].objectID] && game.OID_MAP[this.targets[0].objectID].ship) {
                if (this.secondEffort) {
                    this.secondEffort = false;
                    this.shots = 0;
                    this.numSteps = 0;
                    this.targets.shift();
                    return true;
                } else {
                    this.secondEffort = true;
                    this.pos.x = (game.OID_MAP[this.targets[0].objectID].ship.pos.x + (game.OID_MAP[this.targets[0].objectID].ship.width / 2)) - (this.width / 2);
                    this.shots = game.shootingAttempts - 3;
                    this.updateMovement();
                    return true;
                }
            }
            if (!game.OID_MAP[this.targets[0].objectID] || !game.OID_MAP[this.targets[0].objectID].ship || this.numSteps >= (1700 / game.SPEED)) {
                // move on to the next targets
                this.shots = 0;
                this.numSteps = 0;
                this.targets.shift();
                return true;
            }

            // navigate to the target and shoot!
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

        // Player movement pattern
        // 0 --------->
        // 1 <---------
        // 2 ------------------->
        // 3           <---------
        // 4           --------->
        // 5 <-------------------
        // repeat

        if (this.stepNum === 0) {
            if (this.pos.x > game.WINDOW_WIDTH / 2) {
                this.stepNum++;
            }

            // move right halfway
            this.vel.x += this.accel.x * me.timer.tick;
        } else if (this.stepNum == 1) {
            if (this.pos.x < 32) {
                this.stepNum++;
            }
            // move to left edge
            this.vel.x -= this.accel.x * me.timer.tick;
        } else if (this.stepNum == 2) {
            if (this.pos.x > game.WINDOW_WIDTH - 64) {
                this.stepNum++;
            }
            // move all the way across (right)
            this.vel.x += this.accel.x * me.timer.tick;
        } else if (this.stepNum == 3) {
            if (this.pos.x < game.WINDOW_WIDTH / 2) {
                this.stepNum++;
            }
            // half way across to the left
            this.vel.x -= this.accel.x * me.timer.tick;
        } else if (this.stepNum == 4) {
            if (this.pos.x > game.WINDOW_WIDTH - 64) {
                this.stepNum++;
            }
            // back to the right side
            this.vel.x += this.accel.x * me.timer.tick;
        } else if (this.stepNum == 5) {
            if (this.pos.x < 32) {
                this.stepNum = 0;
            }
            // move all the way across the screen (left)
            this.vel.x -= this.accel.x * me.timer.tick;
        } else {
            this.stepNum = 0;
            this.vel.x = 0;
        }

        // check & update player movement
        this.updateMovement();

        // update animation if necessary
        if (this.vel.x !== 0 || this.vel.y !== 0) {
            // update object animation
            this.parent(dt);
            return true;
        }
        return true;
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
        if (game.audioOn) {
            me.audio.play("shoot");
        }
        game.canShoot[this.team] = false;
        me.game.world.addChild(shot, Number.POSITIVE_INFINITY);
    },

    /**
     * Adds the given target to the players list of targets
     * @param target the ship object to target
     */
    addTarget: function(target) {
        if (!game.OID_MAP[target.objectID] || !game.OID_MAP[target.objectID].targeted) {
            var projectName = game.PROJECT_MAPPING[target.record.get('Project')];
            var pointsEarned = target.record.get('PlanEstimate');
            var time = moment(target.date).format("MM-DD-YY HH:mm", 'completed');
            game.log.addCompletedItem(target.record, projectName, pointsEarned, time);
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
            } else {
                // keep track of a queue of targets
                this.targets.push(target);
            }
            if (game.OID_MAP[target.objectID]) {
                game.OID_MAP[target.objectID].targeted = this.team || true;
            } else {
                game.OID_MAP[target.objectID] = {
                    targeted: this.team || true,
                    ship: target
                };
            }
        } else {
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
        this.removePotentialTarget(target);
        var hunterShip = this;

        if (destroyed && destroyed.type && destroyed.type == game.ENEMY_ENTITY_SUPER) { // completed the initiative!
            game.angularScope.eventHandler.stopEvents();
            game.END_SCROLLER = game.INITIATIVE_SHIP.record.get('Name') + " COMPLETED";

            game.VICTORY_ANIMATIONS = {
                SUPER: new Point(destroyed.pos.x + destroyed.width / 2, destroyed.pos.y + destroyed.height / 2),
                LARGE: [],
                MEDIUM: [],
                SMALL: []
            };

            me.state.change(me.state.VICTORY);
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
