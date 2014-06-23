game.PlayScreen = me.ScreenObject.extend({
	/**
	 *  action to perform on state change
	 */
	onResetEvent: function() {

    // Just load the level on page load
    // when data comes back fron the service, then show the ships, etc.
    me.levelDirector.loadLevel("area51");

    console.log('loaded area51');
	},


	/**
	 *  action to perform when leaving this screen (state change)
	 */
	onDestroyEvent: function() {

	}
});
