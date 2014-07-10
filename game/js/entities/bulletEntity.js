game.BulletEntity = me.ObjectEntity.extend({

    // constructor
    init: function(x, y, settings) {
        // call the constructor
        this.parent(x, y, settings);
        this.gravity = 0.0;
        this.setVelocity(0, 20);
        
        this.type = game.BULLET;

        this.shootDown = settings.shootDown; // true if the bullet was shot by an enemy, false if shot by the player
    },

    update: function() {
        // did we hit the top wall?
        if (this.pos.y < 30 && !this.shootDown) {
            game.canShoot = true;
            me.game.world.removeChild(this);
        } else if (this.pos.y > game.WINDOW_HEIGHT - 30) {
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

            // Did the player shoot someone destructable?
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
                    delete game.OID_MAP[res.obj.objectID];
                }

                emitter.z = res.obj.z + 1;
                // TODO removeChild?
                me.game.world.addChild(emitter);
                me.game.world.addChild(emitter.container);
                emitter.streamParticles();

                game.PENDING_REMOVE.push(emitter);
                game.PENDING_REMOVE.push(emitter.container);

                // this slot is now open!
                game.addAvailablePosition(res.obj);

                game.scoreboard.addPoints(res.obj.record.get('Project'), res.obj.record.get('PlanEstimate'));

                game.log.addItem(res.obj.record.get('Name') + " completed", moment(res.obj.date).format("MM-DD HH:mm"), 'completed');

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
