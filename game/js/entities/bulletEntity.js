game.BulletEntity = me.ObjectEntity.extend({

    // constructor
    init: function(x, y, settings) {
        // call the constructor
        settings.width = 8;
        settings.height = 8;
        settings.spritewidth = 8;
        settings.spriteheight = 8;
        this.parent(x, y, settings);
        this.gravity = 0.0;

        if (!this.shootDown) {
            this.setVelocity(0, game.SPEED + 5);
        } else {
            this.setVelocity(0, game.SPEED);
        }
        
        
        this.teamShip = settings.teamShip;
        if (!settings.teamShip) {
            //console.error('no team ship provided', settings);
        }

        this.type = game.BULLET;

        this.shootDown = settings.shootDown; // true if the bullet was shot by an enemy, false if shot by the player
    },

    update: function() {
        // did we hit the top wall?
        if (this.pos.y < 16 && !this.shootDown) {
            game.canShoot[this.teamShip.team] = true;
            me.game.world.removeChild(this);
        } else if (this.pos.y > game.WINDOW_HEIGHT - 16) {
            me.game.world.removeChild(this);
        }

        // did we hit an enemy?
        var res = me.game.world.collide(this);
        if (res && res.obj) {

            // was it the special ship hitting the rally ship?
            if (res.obj.type == game.RALLY_SHIP_ENTITY && this.teamShip.team == game.SPECIAL_TEAM) {
                me.game.world.removeChild(this);
                me.game.world.removeChild(res.obj);
                var img = me.loader.getImage('explosionLarge');

                game.rallyShipOnScreen = null;

                game.canShoot[this.teamShip.team] = true;

                var xRange = res.obj.width;
                var yRange = res.obj.height;

                this.addExplosions(2, 3, xRange, yRange, new Point(res.obj.pos.x, res.obj.pos.y));

                if (game.audioOn) {
                    me.audio.play("explode");
                }

                return;
            }

            var image = null;
            var height = 0;
            var width = 0;
            var duplicate = false;
            var superDestroyed;
            if (res.obj.type == game.ENEMY_ENTITY_MEDIUM || res.obj.type == game.ENEMY_ENTITY_SUPER) {
                image = "explosionLarge";
                height = 32;
                width = 32;
            } else if (res.obj.type == game.ENEMY_ENTITY_LARGE) {
                image = "explosionLarge";
                duplicate = true;
            } else if (res.obj.type == game.ENEMY_ENTITY_SMALL) {
                image = "explosionSmall";
                height = 16;   
                width = 16;
            } else if (res.obj.type == game.ENEMY_ENTITY_SUPER) {
                image = "explosionLarge";

            }

            // Did the player shoot someone destructable?
            if (image && !this.shootDown && res.obj.isDestructable && res.obj.isDestructable()) {
                game.canShoot[this.teamShip.team] = true;
                me.game.world.removeChild(this);


                if (res.obj.type == game.ENEMY_ENTITY_SUPER) {
                    this.addExplosions(4, 5, res.obj.width / 2, res.obj.height, new Point(res.obj.pos.x, res.obj.pos.y));
                } else {

                    var x = res.obj.pos.x;
                    var y = res.obj.pos.y;

                    if (duplicate) {
                        x += 32;
                        y += 16;
                    }

                    var explosion = me.pool.pull("explosion", x,  y, {
                        image: image,
                        spriteheight: height,
                        spritewidth: width,
                        width: width,
                        height: height,
                        z: Number.POSITIVE_INFINITY
                    });

                    me.game.world.addChild(explosion, Number.POSITIVE_INFINITY);

                    if (duplicate) {
                        me.game.world.addChild(me.pool.pull("explosion", x + width, y, {
                            image: image,
                            spriteheight: height,
                            spritewidth: width,
                            width: width,
                            height: height,
                            z: Number.POSITIVE_INFINITY
                        }), Number.POSITIVE_INFINITY);
                    }
                }
                
                if (game.OID_MAP[res.obj.objectID]) {
                    // this slot is now open - but only if it still exists in the oid map (could have been recycled first)
                    game.POSITION_MANAGER.addAvailablePosition(res.obj.width, res.obj.startingX, res.obj.startingY);
                    game.removeOidFromMap(res.obj.objectID, false);
                }

                if (game.audioOn) {
                    me.audio.play("explode");
                }

                game.scoreboard.addPoints(res.obj.record.get('Project'), res.obj.record.get('PlanEstimate'));

                var teamColor = game.scoreboard.getTeamColor(res.obj.record.get('Project'));

                this.teamShip.removeTarget(res.obj);

                me.game.world.removeChild(res.obj);
               
                var labelText = res.obj.record.get('FormattedID') + ": " + res.obj.record.get('Name');
                if (res.obj.type == game.ENEMY_ENTITY_LARGE && game.lastLabel != labelText) {
                    var labelPosition = game.LABEL_POSITONS[game.LABEL_INDEX++];
                    if (game.LABEL_INDEX >= game.LABEL_POSITONS.length) {
                        game.LABEL_INDEX = 0;
                    }
                    var label = me.pool.pull("label", labelPosition.x, labelPosition.y, {
                        height: 32,
                        width: 128,
                        formattedId: labelText,
                        color: teamColor
                    });

                    game.lastLabel = labelText;
                    me.game.world.addChild(label, Number.POSITIVE_INFINITY);
                }
                return false;
            }
            //else if (image && !this.shootDown && !res.obj.isDestructable()) {} // let it pass through for now, target could be above us

            // Did the player get hit?
            if (res.obj.type == game.PLAYER && this.shootDown) {
            }
        }

        // keep going
        if (this.shootDown) {
            this.vel.y += this.accel.y * me.timer.tick;
        } else {
            this.vel.y -= this.accel.y * me.timer.tick;
        }
        this.updateMovement();
        return true;
    },

    addExplosions: function(numLarge, numSmall, xRange, yRange, position) {
        var i;
        var explosions = [];    
        for (i = 0; i < numLarge; i++) {
            xPos = Math.floor(Math.random() * xRange) + position.x;
            yPos = Math.floor(Math.random() * yRange) + position.y;

            explosions.push(me.pool.pull("explosion", xPos, yPos, {
                image: "explosionLarge",
                spriteheight: 32,
                spritewidth: 32,
                width: 32,
                height: 32,
                z: Number.POSITIVE_INFINITY
            }));
        }

        for (i = 0; i < numSmall; i++) {
            xPos = Math.floor(Math.random() * xRange) + position.x;
            yPos = Math.floor(Math.random() * yRange) + position.y;

            explosions.push(me.pool.pull("explosion",  xPos, yPos, {
                image: "explosionSmall",
                spriteheight: 16,
                spritewidth: 16,
                width: 16,
                height: 16,
                z: Number.POSITIVE_INFINITY
            }));
        }

        _.each(explosions, function(oneExplosion) {
            me.game.world.addChild(oneExplosion);
        });
    }
});
