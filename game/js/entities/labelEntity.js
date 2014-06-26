game.LabelEntity = me.ObjectEntity.extend({

    // constructor
    init: function(x, y, settings) {
        // call the constructor
        this.parent(x, y, settings);

        this.font = new me.Font("Arial", settings.fontSize || 24, "white", "left");
        this.formattedId = settings.formattedId;
        this.displayed = false;
        console.log("this", this);
    },

    update: function() {
        return true;
    },

    draw: function(context) {
        if (!this.displayed) {
            console.log('id', this);
            this.font.draw(context,this.formattedId, this.pos.x, this.pos.y);
            this.displayed = true;
        }
        
    }
});