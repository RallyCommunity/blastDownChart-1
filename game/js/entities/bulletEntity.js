game.BulletEntity = me.ObjectEntity.extend({

    // constructor
    init: function(x, y, settings) {
        // call the constructor
        this.parent(x, y, settings);
        this.gravity = 0.0;

        if (!this.shootDown) {
            this.setVelocity(0, game.SPEED + 5);
        } else {
            this.setVelocity(0, game.SPEED);
        }
        
        
        this.teamShip = settings.teamShip;
        if (!settings.teamShip) {
            console.error('no team ship provided', settings);
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
            if (res.obj.type == game.RALLY_SHIP && this.teamShip.team == game.SPECIAL_TEAM) {
                me.game.world.removeChild(this);
                me.game.world.removeChild(res.obj);
                var img = me.loader.getImage('explosionMedium');
                var emitter = new me.ParticleEmitter(res.obj.pos.x + (res.obj.width / 2), res.obj.pos.y + (res.obj.height / 2), {
                    image: img,
                    width: 4,
                    totalParticles: 12,
                    angle: 0.0856797996433583,
                    angleVariation: 3.14159265358979,
                    minLife: 400,
                    maxLife: 1800,
                    speed: 0.954545454545454,
                    speedVariation: 9.95454545454546,
                    minRotation: 1.34231686107927,
                    minStartScale: 1.43181818181818,
                    maxParticles: 17,
                    frequency: 19,
                    duration: 400,
                    framesToSkip: 1
                });
                emitter.name = 'fire';

                game.canShoot[this.teamShip.team] = true;
                me.game.world.addChild(emitter, Number.POSITIVE_INFINITY);
                me.game.world.addChild(emitter.container, Number.POSITIVE_INFINITY);
                game.PENDING_REMOVE.push(emitter);
                game.PENDING_REMOVE.push(emitter.container);
                emitter.streamParticles();

                // TODO special sounds, logging, score, something?

                if (game.audioOn) {
                    me.audio.play("explode");
                }

                return;
            }






            var image = null;
            if (res.obj.type == game.ENEMY_ENTITY_SUPER) {
                image = me.loader.getImage('explosionSuper');
            } else if (res.obj.type == game.ENEMY_ENTITY_LARGE) {
                image = me.loader.getImage('explosionLarge');
            } else if (res.obj.type == game.ENEMY_ENTITY_MEDIUM) {
                image = me.loader.getImage('explosionMedium');
            } else if (res.obj.type == game.ENEMY_ENTITY_SMALL) {
                image = me.loader.getImage('explosionSmall');
            }

            // Did the player shoot someone destructable?
            if (image && !this.shootDown && res.obj.isDestructable()) {
                game.canShoot[this.teamShip.team] = true;
                me.game.world.removeChild(this);

                var emitter = new me.ParticleEmitter(res.obj.pos.x + (res.obj.width / 2), res.obj.pos.y + (res.obj.height / 2), {
                    image: image,
                    width: 4,
                    totalParticles: 12,
                    angle: 0.0856797996433583,
                    angleVariation: 3.14159265358979,
                    minLife: 400,
                    maxLife: 1800,
                    speed: 0.954545454545454,
                    speedVariation: 9.95454545454546,
                    minRotation: 1.34231686107927,
                    minStartScale: 1.43181818181818,
                    maxParticles: 17,
                    frequency: 19,
                    duration: 400,
                    framesToSkip: 1
                });
                emitter.name = 'fire';
                
                if (game.OID_MAP[res.obj.objectID]) {
                    // this slot is now open - but only if it still exists in the oid map (could have been recycled first)
                    game.POSITION_MANAGER.addAvailablePosition(res.obj.width, res.obj.startingX, res.obj.startingY);
                    delete game.OID_MAP[res.obj.objectID];
                }

                emitter.z = res.obj.z + 1;

                me.game.world.addChild(emitter);
                me.game.world.addChild(emitter.container);
                emitter.streamParticles();

                game.PENDING_REMOVE.push(emitter);
                game.PENDING_REMOVE.push(emitter.container);

                if (game.audioOn) {
                    me.audio.play("explode");
                }
                //

                game.scoreboard.addPoints(res.obj.record.get('Project'), res.obj.record.get('PlanEstimate'));

                var projectName = game.PROJECT_MAPPING[res.obj.record.get('Project')];
                var pointsEarned = res.obj.record.get('PlanEstimate');
                var time = moment(res.obj.date).format("MM-DD-YY HH:mm", 'completed');
                if (projectName && pointsEarned) {
                    game.log.addItem(res.obj.record.get('Name') + " - completed by " + projectName + " for +" + pointsEarned, time, 'completed');
                } else if (projectName) {
                    game.log.addItem(res.obj.record.get('Name') + " - completed by " + projectName, time, 'completed');
                } else {
                    game.log.addItem(res.obj.record.get('Name') + " - completed", time, 'completed');
                }

                var teamColor = game.scoreboard.getTeamColor(res.obj.record.get('Project'));

               

                if (res.obj.type == game.ENEMY_ENTITY_LARGE) {
                    var labelPosition = game.LABEL_POSITONS[game.LABEL_INDEX++];
                    if (game.LABEL_INDEX >= game.LABEL_POSITONS.length) {
                        game.LABEL_INDEX = 0;
                    }
                    var label = me.pool.pull("label", labelPosition.x, labelPosition.y, {
                        height: 32,
                        width: 128,
                        formattedId: res.obj.record.get('FormattedID') + ": " + res.obj.record.get('Name'),
                        color: teamColor
                    });
                    me.game.world.addChild(label, Number.POSITIVE_INFINITY);
                }

                this.teamShip.removeTarget(res.obj);

                me.game.world.removeChild(res.obj);
                return true;
            }
            //else if (image && !this.shootDown && !res.obj.isDestructable()) {} // let it pass through for now, target could be above us


            // Did the player get hit?
            if (res.obj.type == game.PLAYER && this.shootDown) {
                me.game.world.removeChild(this);
                image = me.loader.getImage('explosionSmall');
                var explosion = new me.ParticleEmitter(res.obj.pos.x + (res.obj.width / 2), res.obj.pos.y + (res.obj.height / 2), {
                    image: image,
                    width: 4,
                    totalParticles: 12,
                    angle: 0.0856797996433583,
                    angleVariation: 3.14159265358979,
                    minLife: 200,
                    maxLife: 400,
                    speed: 0.5,
                    speedVariation: 4,
                    minRotation: 1.34231686107927,
                    minStartScale: 1.43181818181818,
                    maxParticles: 17,
                    frequency: 19,
                    duration: 200,
                    framesToSkip: 1
                });

                explosion.name = 'fire';
                explosion.z = res.obj.z + 1;

                me.game.world.addChild(explosion);
                me.game.world.addChild(explosion.container);
                game.PENDING_REMOVE.push(explosion);
                game.PENDING_REMOVE.push(explosion.container);
                explosion.streamParticles();
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
    }
});
