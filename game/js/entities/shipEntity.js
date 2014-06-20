game.Ship = me.ObjectEntity.extend({
	// constructor
	// pass the correct image, width/height and x, y for any type of ship that moves in the same pattern
	init: function(x, y, settings) {
        // call the constructor
        this.parent(x, y, settings);
        this.gravity = 0.0;
        // set the movement speed
        this.setVelocity(0, 0);

        this.numSteps = 0;
        this.moveRight = true;
        this.collidable = true;
        this.type = game.ENEMY_ENTITY;
    },

    update: function() {
        // simple movement pattern
    	if (this.numSteps % 3 == 0) {
    		if (this.numSteps % (96 * 2) == 0) {
    			this.moveRight = !this.moveRight;
    			this.numSteps = 0;
    		}
    		
    		if (this.moveRight) {
	    		this.pos.x -= 1;
	    	} else {
	    		this.pos.x += 1;
	    	}
    	}
    	this.numSteps++;
    }
});
