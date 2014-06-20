/* Game namespace */
var game = {

	ENEMY_ENTITY: 99,
	PLAYER: 88,
	BULLET: 77,
  EXPLOSION: 66,
	// an object where to store game information
	data : {
		// score
		score : 0
	},
	
	
	// Run on page load.
"onload" : function () {
		// Initialize the video.
		if (!me.video.init("screen", 960, 640, true, 'auto')) {
			alert("Your browser does not support HTML5 canvas.");
			return;
		}

		// add "#debug" to the URL to enable the debug Panel
		if (document.location.hash === "#debug") {
			window.onReady(function () {
				me.plugin.register.defer(this, debugPanel, "debug");
			});
		}

		//me.sys.fps = 30; // probably okay

		// Initialize the audio.
		me.audio.init("mp3,ogg");
 
		// Set a callback to run when loading is complete.
		me.loader.onload = this.loaded.bind(this);

		// Load the resources.
		me.loader.preload(game.resources);

		// Initialize melonJS and display a loading screen.
		me.state.change(me.state.LOADING);
	},

	// Run on game resources loaded.
	"loaded" : function () {
		me.state.set(me.state.MENU, new game.TitleScreen());
		me.state.set(me.state.PLAY, new game.PlayScreen());

		me.pool.register("mainPlayer", game.PlayerEntity);
		me.pool.register("bullet", game.BulletEntity);
		me.pool.register("enemyShip", game.Ship);
    	me.pool.register("explosion", game.ExplosionEntity);
		// TODO object POOLING?
		
		// TODO temporary enabling keyboard
		me.input.bindKey(me.input.KEY.LEFT,  "left");
   		me.input.bindKey(me.input.KEY.RIGHT, "right");
   		me.input.bindKey(me.input.KEY.SPACE, "shoot");

		// Start the game.
		me.state.change(me.state.PLAY);
	},

  	setupShips: function(data) {
	    console.log("setting up with: ", data);
		var CANVAS_WIDTH = 960;
		var PADDING = 32;
		var WIDTH = CANVAS_WIDTH - (PADDING * 2);

		var MOTHERSHIP = {
			width: 320,
			height: 160
		};

		var FEATURE_SHIP = {
			width: 64,
			height: 64
		};

		var STORY_SHIP = {
			width: 32,
			height: 32
		};

		var TASK_SHIP = {
			width: 16,
			height: 16
		};
	    // reset the score
		game.data.score = 0;

		var zAxis = 8;

		// TODO object pooling? https://github.com/melonjs/melonJS/wiki/Frequently-Asked-Questions
		// TODO keep track of all of these for removal purposes?
		/*
		 * Draw the Mothership
		 */
		var mothership = me.pool.pull("enemyShip", WIDTH / 2 - MOTHERSHIP.width / 2, 32, {
			height: MOTHERSHIP.height,
			image: "xlarge",
			name: "initiative",
			spriteheight: MOTHERSHIP.height,
			spritewidth: MOTHERSHIP.width,
			width: MOTHERSHIP.width,
			z: zAxis
		});

		me.game.world.addChild(mothership, zAxis);
		zAxis++;
		var features = _.toArray(data.features);
		var numFeatures = features.length;
		var sectionWidth = WIDTH/numFeatures;
			
		for (var i = 0; i < numFeatures; i++) {
			var xPosition = (i * sectionWidth) + ((sectionWidth) / 2) - (FEATURE_SHIP.width / 2);
			var yPosition = 32 + 160;
			var featureShip = me.pool.pull("enemyShip", xPosition, yPosition, {
				height: FEATURE_SHIP.height,
				image: "large",
				name: "[FEATURE] - " + features[i].feature.Name,
				spriteheight: FEATURE_SHIP.height,
				spritewidth: FEATURE_SHIP.width,
				width: FEATURE_SHIP.width,
				z: zAxis
			});

			me.game.world.addChild(featureShip, zAxis++);
			var stories = features[i].children;
			var numStories = stories.length;
			var storiesPerLine = Math.floor(sectionWidth / STORY_SHIP.width);
			var storyLines = Math.floor(numStories / storiesPerLine) + 1;

			var tasks = [];

			for (var j = 0; j < numStories; j++) {
				var storyX, storyY;
				var storiesOnThisLine = storiesPerLine;
				if (Math.floor(j / storiesPerLine + 1) == storyLines) {
					storiesOnThisLine = numStories % storiesPerLine;
				}
				storyY = 32 + 160 + 64 + 32 + Math.floor(j / storiesPerLine) * (STORY_SHIP.height);
				storyX = (i * sectionWidth) + (j % storiesPerLine) * ((sectionWidth) / (storiesOnThisLine + 1)) + sectionWidth / (storiesOnThisLine + 1) - (STORY_SHIP.width / 2);

				var storyShip = me.pool.pull("enemyShip", storyX, storyY, {
					height: STORY_SHIP.height,
					image: "medium",
					name: "[STORY/DEFECT] - " + stories[j].artifact.Name,
					spriteheight: STORY_SHIP.height,
					spritewidth: STORY_SHIP.width,
					width: STORY_SHIP.width,
					z: zAxis,
					health: 2
				});
				console.log('storyShip', storyShip, stories[j]);

				me.game.world.addChild(storyShip, zAxis++);

				// add the tasks together
				_.each(stories[j].children, function(oneTask) {
					Ext.Array.push(tasks, oneTask);
				});
			}
	    // 
			// for proper task vertical alignment
			if (numStories % storiesPerLine == 0) {
				storyLines -= 1;
			}

			// Add all tasks below stories
			var numTasks = tasks.length;
			var tasksPerLine = Math.floor(sectionWidth / TASK_SHIP.width);
			var taskLines = Math.floor(numTasks / tasksPerLine) + 1;

			for (var k = 0; k < numTasks; k++) {
				var taskX, taskY;
				var tasksOnThisLine = tasksPerLine;
				if (Math.floor(k / tasksPerLine + 1) == taskLines) {
					tasksOnThisLine = numTasks % tasksPerLine;
				}
				taskY = storyLines * STORY_SHIP.height + 32 + 160 + 64 + 32 + Math.floor(k / tasksPerLine) * (TASK_SHIP.height);
				taskX = (i * sectionWidth) + (k % tasksPerLine) * ((sectionWidth) / (tasksOnThisLine + 1)) + sectionWidth / (tasksOnThisLine + 1) - (TASK_SHIP.width / 2);

				var taskShip = me.pool.pull("enemyShip", taskX, taskY, {
					height: TASK_SHIP.height,
					image: "small",
					name: "[TASK] - " + tasks[j].Name,
					spriteheight: TASK_SHIP.height,
					spritewidth: TASK_SHIP.width,
					width: TASK_SHIP.width,
					z: zAxis,
					health: 2
				});

				me.game.world.addChild(taskShip, zAxis++);

				// add the tasks together
			}
		}
	}
};
