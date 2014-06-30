// TODO destroy a given feature/story/task that is not on the screen
// TODO repopulate the screen after a few have been destroyed - fly off, fly back on again?
/* Game namespace */
var game = {

    // size of the game canvas
    WINDOW_WIDTH: 960,
    WINDOW_HEIGHT: 640,

    ENEMY_ENTITY_SMALL:  96, // small enemy type
    ENEMY_ENTITY_MEDIUM: 97, // medium enemy type
    ENEMY_ENTITY_LARGE:  98, // large enemy type
    ENEMY_ENTITY_SUPER:  99, // super enemy type

    SHOW_LABEL: true,

    PLAYER: 88,     // player type
    BULLET: 77,     // bullet type
    EXPLOSION: 66,  // explosion type

    // boolean - can the player shoot?
    canShoot: true,

    // probability that enemy ships will shoot
    FIRE_PROBABILITY: 2000,

    OID_MAP : {}, // map OID -> boolean (true if displayed on the screen, else false)

    FEATURE_COLUMN: {},

    AVAILABLE_POSITIONS: {},

    // Image asset sizes
    MOTHERSHIP: {
        width: 320,
        height: 160
    },

    FEATURE_SHIP: {
        width: 64,
        height: 64
    },

    STORY_SHIP: {
        width: 32,
        height: 32
    },

    TASK_SHIP: {
        width: 16,
        height: 16
    },

    // track the score
    data : {
        // score
        score : {}
    },

    log : {
        addItem: function(logEvent) {
            angular.element($("#root")).scope().addLogItem(logEvent);
        }
    },

    // Run on page load.
    "onload" : function () {
        // Initialize the video.
        me.sys.fps = 45;
        if (!me.video.init("screen", game.WINDOW_WIDTH, game.WINDOW_HEIGHT, true, 'auto')) {
            alert("Your browser does not support HTML5 canvas.");
            return;
        }

        // add "#debug" to the URL to enable the debug Panel
        if (document.location.hash === "#debug") {
            window.onReady(function () {
                me.plugin.register.defer(this, debugPanel, "debug");
            });
        }

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
        me.pool.register("label", game.LabelEntity);

        // Setup keyboard listeners
        me.input.bindKey(me.input.KEY.LEFT,  "left");
        me.input.bindKey(me.input.KEY.RIGHT, "right");
        me.input.bindKey(me.input.KEY.SPACE, "shoot");

        // TODO - eventually this will not be controlled by a button - realtime data
        $("#completeFeature").click(function() {
            // TODO if you dont find the OID in the game, then it might not be present.  Kill another one??
            var destroy = me.game.world.getChildByProp('objectID', game.shootMe);
            if (destroy.length == 1) {
                var players = me.game.world.getChildByProp('type', game.PLAYER);
                if (players.length == 1) {
                    destroy[0].setVulnerable(true);
                    players[0].addTarget(destroy[0]);
                }
            }
            $('#completeFeature').hide();
        });

        me.state.change(me.state.MENU);

        // Reveal the game
        $($('.rally-app')[0]).hide();
        $('#root').show();
        $('body').removeClass('x-body');
        $('html').removeClass('x-viewport');
        Ext.getBody().unmask();
    },

    addStory: function(oid) {
        // TODO optimize
        Rally.data.WsapiModelFactory.getModel({
            type: 'User Story',
            context: {
                workspace: Rally.util.Ref.getRelativeUri()
            },
            success: function(model) {
                model.load(oid, {
                    scope: this,
                    callback: function(record, op, success) {
                        console.log('got record for story', record, 'record.data.Feature._ref', record.data.Feature._ref);
                        // console.log(record);
                        // console.log(record.data.Feature._ref);
                        Rally.data.WsapiModelFactory.getModel({
                            type: 'PortfolioItem/Feature',
                            context: {
                                workspace: Rally.util.Ref.getRelativeUri()
                            },
                            success: function(featureModel) {
                                featureModel.load(record.data.Feature._ref, {
                                    scope: this,
                                    callback: function(parent) {
                                        game.displayStory(parent);
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    },

    removeStory: function(oid) {
        // removing a ship
        var item = game.OID_MAP[oid];
        if (item && item.displayed && game.OID_MAP[Parent.ObjectID] && game.AVAILABLE_POSITIONS[game.OID_MAP[Parent.ObjectID].column]) {
            var positions = game.AVAILABLE_POSITIONS[game.OID_MAP[Parent.ObjectID].column].storyPositions;
            var pendingRemove = me.game.world.getChildByProp('objectID', oid);
            if (positions && pendingRemove) {
                positions.push(new Point(pendingRemove.startingX, pendingRemove.startingY));
                pendingRemove.flyOff();
            }
            game.log.addItem(item.formattedId + " recycled");
        } else if (item) {
            // not currently displayed, just remove it from the map and log it
            delete game.OID_MAP[oid];
            game.log.addItem(item.formattedId + " recycled");
        }
        /*
        var item = game.OID_MAP[oid];
        if (item && item.displayed) {
            // currently displayed - have it fly off
            var pendingRemove = me.game.world.getChildByProp('objectID', oid);
            console.log('pending remove', pendingRemove);
            game.OID_MAP[Parent.ObjectID]
            if (pendingRemove) {
                pendingRemove.flyOff();
            }
            game.log.addItem(item.formattedId + " recycled");
        } else if (item) {
            // not currently displayed, just remove it from the map and log it
            delete game.OID_MAP[oid];
            game.log.addItem(item.formattedId + " recycled");
        }
        */
    },

    // TODO
    addTask: function(oid) {
        // TODO optimize

        Rally.data.WsapiModelFactory.getModel({
            type: 'Task',
            context: {
                workspace: Rally.util.Ref.getRelativeUri()
            },
            success: function(taskModel) {
                taskModel.load(oid, {
                    scope: this,
                    callback: function(taskRecord, op, success) {
                        console.log('got record for task', taskRecord);
                        if (taskRecord && taskRecord.data.WorkProduct && taskRecord.data.WorkProduct._type == "HierarchicalRequirement") {
                            

                            // get User Story
                            Rally.data.WsapiModelFactory.getModel({
                                type: 'User Story',
                                context: {
                                    workspace: Rally.util.Ref.getRelativeUri()
                                },
                                success: function(userStoryModel) {
                                    userStoryModel.load(taskRecord.data.WorkProduct._ref, {
                                        scope: this,
                                        callback: function(storyRecord, op, success) {
                                            console.log('got record for story', storyRecord);
                                            
                                            if (storyRecord && storyRecord.data && storyRecord.data.Feature) {

                                                // Get Feature
                                                Rally.data.WsapiModelFactory.getModel({
                                                    type: 'PortfolioItem/Feature',
                                                    context: {
                                                        workspace: Rally.util.Ref.getRelativeUri()
                                                    },
                                                    success: function(featureModel) {
                                                        featureModel.load(storyRecord.data.Feature._ref, {
                                                            scope: this,
                                                            callback: function(featureRecord) {
                                                                game.displayTask(oid, taskRecord, storyRecord, featureRecord);
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        }
                                    });
                                }
                            });
                        }
                    }
                });
            }
        });
    },

    removeTask: function(oid) {
        var item = game.OID_MAP[oid];
        if (item && item.displayed) {
            // currently displayed - have it fly off
            var pendingRemove = me.game.world.getChildByProp('objectID', oid);
            console.log('pending remove', pendingRemove);
            game.OID_MAP[Parent.ObjectID]
            if (pendingRemove) {
                pendingRemove.flyOff();
            }
            game.log.addItem(item.formattedId + " recycled");
        } else if (item) {
            // not currently displayed, just remove it from the map and log it
            delete game.OID_MAP[oid];
            game.log.addItem(item.formattedId + " recycled");
        }
    },

    displayStory: function(parent) {
        var id = null;
        if (parent && parent.data) {
            id = parent.data.ObjectID;
        }
        console.log(id, game.OID_MAP[id]);
        if (id && game.OID_MAP[id] && game.AVAILABLE_POSITIONS[game.OID_MAP[id].column]) {
            var positions = game.AVAILABLE_POSITIONS[game.OID_MAP[id].column].storyPositions;
            if (positions && positions.length > 0) {
                var position = game.AVAILABLE_POSITIONS[game.OID_MAP[id].column].storyPositions.shift();
                console.log("putting story ship at position", position);
                game.OID_MAP[oid] = {
                    displayed: true,
                    formattedId: record.data.FormattedID
                }
                // create a new ship entitiy!
                var STORY_SHIP = {
                    width: 32,
                    height: 32
                };

                var storyShip = me.pool.pull("enemyShip", position.x, position.y, {
                    height: game.STORY_SHIP.height,
                    image: "medium",
                    name: "[STORY/DEFECT] - " + record.data.Name,
                    spriteheight: game.STORY_SHIP.height,
                    spritewidth: game.STORY_SHIP.width,
                    width: game.STORY_SHIP.width,
                    objectID: record.data.ObjectID,
                    //formattedId: playScreen.getFormattedId(stories[j].artifact._UnformattedID, stories[j].artifact._TypeHierarchy),
                    z: 10,
                    health: 2,
                    type: game.ENEMY_ENTITY_MEDIUM,
                    delay: 0,
                    programmaticallyAdded: true,
                    featureId: id,
                    waitFor: 0
                });

                me.game.world.addChild(storyShip, 10);
                console.log('added storyship', storyShip);
                game.log.addItem(record.data.Name + ":: ADDED");
            } else {
                game.OID_MAP[oid] = {
                    displayed: false,
                    formattedId: "f"
                }
            }
        }
    },

    displayTask: function(oid, task, story, feature) {
        // console.log(record);
        var id = null;
        if (feature && feature.data) {
            id = feature.data.ObjectID;
        }

        if (id && game.OID_MAP[id] && game.AVAILABLE_POSITIONS[game.OID_MAP[id].column]) {
            var positions = game.AVAILABLE_POSITIONS[game.OID_MAP[id].column].taskPositions;
            if (positions && positions.length > 0) {
                var position = game.AVAILABLE_POSITIONS[game.OID_MAP[id].column].taskPositions.shift();
                console.log("putting story ship at position", position);
                game.OID_MAP[oid] = {
                    displayed: true,
                    formattedId: task.data.FormattedID
                }

                var taskShip = me.pool.pull("enemyShip", position.x, position.y, {
                    height: game.TASK_SHIP.height,
                    image: "small",
                    name: "[TASK] - " + task.data.Name,
                    spriteheight: game.TASK_SHIP.height,
                    spritewidth: game.TASK_SHIP.width,
                    width: game.TASK_SHIP.width,
                    objectID: task.data.ObjectID,
                    //formattedId: playScreen.getFormattedId(tasks[k]._UnformattedID, tasks[k]._TypeHierarchy),
                    z: Number.POSITIVE_INFINITY,
                    health: 2,
                    type: game.ENEMY_ENTITY_SMALL,
                    delay: 0,
                    featureId: id,
                    programmaticallyAdded: true,
                    waitFor: 0
                });

                me.game.world.addChild(taskShip, Number.POSITIVE_INFINITY);
                console.log('added task', taskShip);
                game.log.addItem(task.data.Name + ":: ADDED");
            } else {
                game.OID_MAP[oid] = {
                    displayed: false,
                    formattedId: "f"
                }
            }
        }
    }
};
