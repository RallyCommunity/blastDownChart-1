/**
 * A title screen 
 **/
game.TitleScreen = me.ScreenObject.extend({
 
    /**    
     *  action to perform on state change
     */
    onResetEvent : function() {
        // title screen
        me.game.world.addChild(new me.SpriteObject(0, 0, me.loader.getImage('background')), 1);
     
        // add a new renderable component with the scrolling text
        me.game.world.addChild(new (me.Renderable.extend({
            // constructor
            init : function() {
                this.parent(new me.Vector2d(0, 0), me.game.viewport.width, me.game.viewport.height);
                // font for the scrolling text
                this.font = new me.Font("pressStart", 24, "white", "center");
                 
                 // a tween to animate the arrow
                this.scrollertween = new me.Tween(this).to({scrollerpos: -700}, 3000).onComplete(this.scrollover.bind(this)).start();
         
                this.scroller = "A PORTFOLIO ITEM VISUALIZATION";
                this.scrollerpos = 3000;
            },
             
            // some callback for the tween objects
            scrollover : function() {
                // reset to default value
                this.scrollerpos = 1800;
                this.scrollertween.to({scrollerpos: -700}, 10000).onComplete(this.scrollover.bind(this)).start();
            },
         
            update : function (dt) {
                return true;
            },
             
            draw : function (context) {
                this.font.draw(context, "PRESS ENTER TO PLAY", game.WINDOW_WIDTH / 2, (2 * game.WINDOW_HEIGHT) / 3);
                this.font.draw(context, this.scroller, this.scrollerpos, game.WINDOW_HEIGHT / 2);
            },
            onDestroyEvent : function() {
                //just in case
                this.scrollertween.stop();
            }
        }))(), 2);
         
        // change to play state on press Enter or click/tap
        me.input.bindKey(me.input.KEY.ENTER, "enter", true);
        me.input.bindPointer(me.input.mouse.LEFT, me.input.KEY.ENTER);

        this.handler = me.event.subscribe(me.event.KEYDOWN, function (action, keyCode, edge) {
            if (action === "enter") {
                // play something on tap / enter
                // this will unlock audio on mobile devices
                
                me.state.change(me.state.PLAY);
            }
        });
    },
 
    /**    
     *  action to perform when leaving this screen (state change)
     */
    onDestroyEvent : function() {
        me.input.unbindKey(me.input.KEY.ENTER);
        me.input.unbindPointer(me.input.mouse.LEFT);
        me.event.unsubscribe(this.handler);
   }
});