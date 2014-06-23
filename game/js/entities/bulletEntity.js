game.BulletEntity = me.ObjectEntity.extend({

  // constructor
  init: function(x, y, settings) {
    // call the constructor
    this.parent(x, y, settings);
    this.gravity = 0.0;
    // set the movement speed
    this.setVelocity(0, 6);
    this.type = game.BULLET;
    this.shootDown = settings.shootDown;
  },

update: function() {
  // did we hit the top wall?
  if (this.pos.y < 16) {
    game.canShoot = true;
    me.game.world.removeChild(this);
  }

  // did we hit an enemy?
  var res = me.game.world.collide(this);
  if (res) {
    var image = null;
    console.log(res.obj.type, game.ENEMY_ENTITY_SUPER);
    if (res.obj.type == game.ENEMY_ENTITY_SUPER) {
      image = me.loader.getImage('explosionSuper');
    } else if (res.obj.type == game.ENEMY_ENTITY_LARGE) {
      image = me.loader.getImage('explosionLarge');
    } else if (res.obj.type == game.ENEMY_ENTITY_MEDIUM) {
      image = me.loader.getImage('explosionMedium');
    } else if (res.obj.type == game.ENEMY_ENTITY_SMALL) {
      image = me.loader.getImage('explosionSmall');
    }

    if (image && !this.shootDown) {
      console.log(this);
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
      emitter.name = 'fire';
      emitter.z = res.obj.z + 1;
      // TODO removeChild?
      me.game.world.addChild(emitter);
      me.game.world.addChild(emitter.container);
      emitter.streamParticles();

      console.log('Destroyed: ' + res.obj.name);
      me.game.world.removeChild(res.obj);
    }

    if (res.obj.type == game.PLAYER && this.shootDown) {
        // the player got hit
        
         me.game.world.removeChild(this);
        image = me.loader.getImage('explosionSmall');
      var emitter = new me.ParticleEmitter(res.obj.pos.x + (res.obj.width / 2), res.obj.pos.y + (res.obj.height / 2), {
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

      res.obj.renderable.flicker(500);
      emitter.name = 'fire';
      emitter.z = res.obj.z + 1;
      // TODO removeChild?
      me.game.world.addChild(emitter);
      me.game.world.addChild(emitter.container);
      emitter.streamParticles();

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
