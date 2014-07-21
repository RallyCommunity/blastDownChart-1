game.LabelEntity = me.ObjectEntity.extend({

    // constructor
    init: function(x, y, settings) {
        // call the constructor
        this.parent(x + (settings.width / 2), y, settings);

        this.font = new me.Font("Courier", settings.fontSize || 18, settings.color || "white", "left");
        this.formattedId = settings.formattedId;
        this.nextAlpha = 1;
        this.isDisplayed = false;
    },

    draw: function(context) {
        this.nextAlpha -= 0.01;
        if (this.nextAlpha < 0) {
            me.game.world.removeChild(this);
            return;
        }
        context.save();
        var local_alpha = context.globalAlpha;
        context.globalAlpha = this.nextAlpha;
        this.parent();
        this.font.draw(context, this.formattedId, this.pos.x, this.pos.y);
        context.globalAlpha = local_alpha;
        context.restore();
    }
});