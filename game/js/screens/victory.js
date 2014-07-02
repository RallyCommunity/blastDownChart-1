/**
 * A victory screen
 **/
game.VictoryScreen = me.ScreenObject.extend({
 
    /**    
     *  action to perform on state change
     */
    onResetEvent : function() {
        // title screen
        me.game.world.addChild(new me.SpriteObject(0, 0, me.loader.getImage('background')), 1);


        // Add all destruction animations
        var largeImg = me.loader.getImage('explosionSuper');

        var superEmitter = new me.ParticleEmitter(game.VICTORY_ANIMATIONS.SUPER.x, game.VICTORY_ANIMATIONS.SUPER.y, {
            image: largeImg,
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
        superEmitter.name = 'fire';

        superEmitter.z = Number.POSITIVE_INFINITY;
        // TODO removeChild?
        me.game.world.addChild(superEmitter);
        me.game.world.addChild(superEmitter.container);
        superEmitter.streamParticles();

        game.PENDING_REMOVE.push(superEmitter);
        game.PENDING_REMOVE.push(superEmitter.container);

        delete game.VICTORY_ANIMATIONS.SUPER;
        console.log("iterate over victory animations");
        var time = -1;
        setInterval(function() {
            time++;
            if (time > 0) {
                game.cleanup();
            }
            _.each(game.VICTORY_ANIMATIONS, function(el, index) {
                console.log(el, index);

                var image;

                if (index == "LARGE") {
                    image = me.loader.getImage('explosionLarge');
                } else if (index == "MEDIUM") {
                    image = me.loader.getImage('explosionMedium');
                } else if (index == "SMALL"){
                    image = me.loader.getImage('explosionSmall');
                } else {
                    image = me.loader.getImage('explosionSuper');
                }

                _.each(el, function(point) {
                    var emitter = new me.ParticleEmitter(point.x, point.y, {
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

                    emitter.z = Number.POSITIVE_INFINITY;
                    // TODO removeChild?
                    me.game.world.addChild(emitter);
                    me.game.world.addChild(emitter.container);
                    emitter.streamParticles();

                    game.PENDING_REMOVE.push(emitter);
                    game.PENDING_REMOVE.push(emitter.container);
                });
            });
            game.VICTORY_ANIMATIONS = {
                SUPER: [new Point(Math.random() * (game.WINDOW_WIDTH - 50), Math.random() * (game.WINDOW_HEIGHT - 50))],
                LARGE: [new Point(Math.random() * (game.WINDOW_WIDTH - 50), Math.random() * (game.WINDOW_HEIGHT - 50))],
                MEDIUM: [new Point(Math.random() * (game.WINDOW_WIDTH - 50), Math.random() * (game.WINDOW_HEIGHT - 50))],
                SMALL: [new Point(Math.random() * (game.WINDOW_WIDTH - 50), Math.random() * (game.WINDOW_HEIGHT - 50))]
            }
        }, 1500);
        
     
        // add a new renderable component with the scrolling text
        me.game.world.addChild(new (me.Renderable.extend({
            // constructor
            init : function() {
                this.parent(new me.Vector2d(0, 0), me.game.viewport.width, me.game.viewport.height);
                // font for the scrolling text
                this.font = new me.Font("pressStart", 32, "white", "center");
                 
                 // a tween to animate the arrow
                this.scrollertween = new me.Tween(this).to({scrollerpos: -600}, 3000).onComplete(this.scrollover.bind(this)).start();
         
                this.scroller = game.initiative.Name + " COMPLETED";
                this.scrollerpos = 3000;
            },
             
            // some callback for the tween objects
            scrollover : function() {
                // reset to default value
                this.scrollerpos = 1500;
                this.scrollertween.to({scrollerpos: -600}, 10000).onComplete(this.scrollover.bind(this)).start();
            },
         
            update : function (dt) {
                return true;
            },
             
            draw : function (context) {
                this.font.draw(context, "VICTORY!", 450, 350);
                this.font.draw(context, this.scroller, this.scrollerpos, 256);
            },
            onDestroyEvent : function() {
                //just in case
                this.scrollertween.stop();
            }
        }))(), 2);
    },
 
    /**    
     *  action to perform when leaving this screen (state change)
     */
    onDestroyEvent : function() {

   }
});