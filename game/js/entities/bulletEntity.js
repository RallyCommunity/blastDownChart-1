game.BulletEntity = me.ObjectEntity.extend({

    // constructor
    init: function(x, y, settings) {
        // call the constructor
        this.parent(x, y, settings);
        this.gravity = 0.0;
        this.setVelocity(0, 6);
        
        this.type = game.BULLET;

        this.shootDown = settings.shootDown; // true if the bullet was shot by an enemy, false if shot by the player
    },

    update: function() {
        // did we hit the top wall?
        if (this.pos.y < 16) {
            game.canShoot = true;
            me.game.world.removeChild(this);
        } else if (this.pos.y > game.WINDOW_HEIGHT - 16) {
            me.game.world.removeChild(this);
        }

        // did we hit an enemy?
        var res = me.game.world.collide(this);
        if (res) {
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

            // Did the player shoot someone destructable
            if (image && !this.shootDown && res.obj.isDestructable()) {
                game.canShoot = true;
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
                emitter.name = 'fire'; // TODO use radial explosion instead?

                
                if (game.OID_MAP[res.obj.objectID]) {
                    game.OID_MAP[res.obj.objectID].displayed = false;
                }

                emitter.z = res.obj.z + 1;
                // TODO removeChild?
                me.game.world.addChild(emitter);
                me.game.world.addChild(emitter.container);
                emitter.streamParticles();

                game.PENDING_REMOVE.push(emitter);
                game.PENDING_REMOVE.push(emitter.container);


                if (res.obj.featureId && game.OID_MAP[res.obj.featureId]) {
                    if (res.obj.type == game.ENEMY_ENTITY_SMALL) { // task

                        // was there a task waiting for this spot?
                        if (game.AVAILABLE_POSITIONS[game.OID_MAP[res.obj.featureId].column].pendingTasks.length > 0) {
                            var ship = game.AVAILABLE_POSITIONS[game.OID_MAP[res.obj.featureId].column].pendingTasks.shift();
                            var taskShip = me.pool.pull("enemyShip", res.obj.startingX, res.obj.startingY, {
                                height: game.TASK_SHIP.height,
                                image: "small",
                                name: "[TASK] - " + ship.Name,
                                spriteheight: game.TASK_SHIP.height,
                                spritewidth: game.TASK_SHIP.width,
                                width: game.TASK_SHIP.width,
                                objectID: ship.ObjectID,
                                z: res.obj.z,
                                health: 2,
                                type: game.ENEMY_ENTITY_SMALL,
                                delay: 0,
                                programmaticallyAdded: true,
                                featureId: res.obj.featureId,
                                waitFor: 0
                            });

                            me.game.world.addChild(taskShip, res.obj.z);

                        } else {
                            game.AVAILABLE_POSITIONS[game.OID_MAP[res.obj.featureId].column].taskPositions.unshift(new Point(res.obj.startingX, res.obj.startingY));
                        }
                    } else if (res.obj.type == game.ENEMY_ENTITY_MEDIUM) {

                        // was there a story waiting for this spot?
                        if (game.AVAILABLE_POSITIONS[game.OID_MAP[res.obj.featureId].column].pendingStories.length > 0) {

                            var ship = game.AVAILABLE_POSITIONS[game.OID_MAP[res.obj.featureId].column].pendingStories.shift();

                            game.OID_MAP[ship.ObjectID].displayed = true;

                            var storyShip = me.pool.pull("enemyShip", res.obj.startingX, res.obj.startingY, {
                                height: game.STORY_SHIP.height,
                                image: "medium",
                                name: "[STORY/DEFECT] - " + ship.Name,
                                spriteheight: game.STORY_SHIP.height,
                                spritewidth: game.STORY_SHIP.width,
                                width: game.STORY_SHIP.width,
                                objectID: ship.ObjectID,
                                z: res.obj.z,
                                health: 2,
                                type: game.ENEMY_ENTITY_MEDIUM,
                                delay: 0,
                                programmaticallyAdded: true,
                                featureId: res.obj.featureId,
                                waitFor: 0
                            });

                            me.game.world.addChild(storyShip, res.obj.z);
                        } else {
                            game.AVAILABLE_POSITIONS[game.OID_MAP[res.obj.featureId].column].storyPositions.unshift(new Point(res.obj.startingX, res.obj.startingY));
                        }
                    }
                    
                }

                game.log.addItem(res.obj.name + " COMPLETED", Ext.Date.format(new Date(res.obj.date), "m-d H:i"));

                game.PLAYER_SHIP.removeTarget(res.obj);

                me.game.world.removeChild(res.obj);
                return true;
            } else if (image && !this.shootDown && !res.obj.isDestructable()) { // let it pass through for now, target could be above us
                // res.obj.flashShields();
                
                //me.game.world.removeChild(this);
            }

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
                // TODO remove the emitter?
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
