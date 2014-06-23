/**
 * a HUD container and child items
 */

game.HUD = game.HUD || {};


game.HUD.Container = me.ObjectContainer.extend({

	init: function() {
		// call the constructor
		this.parent();
		
		// persistent across level change
		this.isPersistent = true;
		
		// non collidable
		this.collidable = false;
		
		// make sure our object is always draw first
		this.z = Infinity;

		// give a name
		this.name = "HUD";
		
		// add our child score object at the top left corner
    var i = 0;
    var container = this; 
    console.log(game.data.score);
    Ext.Object.each(game.data.score, function(key, value) {
        var align = "left";
        var x = 5;
        var y = 5;
        if (i % 3 == 1) { 
            align = "center";
            x = game.WINDOW_WIDTH / 2;
        } else if (i % 3 == 2) {
            align = "right";
            x = game.WINDOW_WIDTH - 5;
        } else if (i != 0) {
            y += 25;
        }

        container.addChild(new game.HUD.ScoreItem(x, y, key, align));
        i++;
    });
    
    
  }
});


/** 
 * a basic HUD item to display score
 */
game.HUD.ScoreItem = me.Renderable.extend({	
	/** 
	 * constructor
	 */
	init: function(x, y, key, alignment) {
		
		// call the parent constructor 
		// (size does not matter here)
		this.parent(new me.Vector2d(x, y), 10, 10); 

    this.font = new me.Font("Arial", 18, "white", alignment);

		// local copy of the global score
		this.score = -1;

    this.key = key;

		// make sure we use screen coordinates
		this.floating = true;
	},

	/**
	 * update function
	 */
	update : function () {
		// we don't do anything fancy here, so just
		// return true if the score has been updated
		if (this.score !== game.data.score[this.key]) {	
			this.score = game.data.score[this.key];
			return true;
		}
		return false;
	},

	/**
	 * draw the score
	 */
	draw : function (context) {
		  this.font.draw(context, this.key + ": " + this.score, this.pos.x, this.pos.y);
	}

});
