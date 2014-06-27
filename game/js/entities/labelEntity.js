game.LabelEntity = me.ObjectEntity.extend({

    // constructor
    init: function(x, y, settings) {
        // call the constructor
        this.parent(x + (settings.width / 2), y, settings);

        this.font = new me.Font("Arial", settings.fontSize || 24, "white", "center");
        this.formattedId = settings.formattedId;
        this.displayed = false;
    },

    update: function() {
        this.vel.x = 0;
        this.vel.y = 0;
        return false;
    },

    draw: function(context) {
        if (game.SHOW_LABEL) {
            this.font.draw(context, this.formattedId, this.pos.x, this.pos.y);
            this.displayed = true;
        } else {
            me.game.world.removeChild(this);
        }
    }
});