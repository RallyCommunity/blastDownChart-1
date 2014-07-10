game.PlayScreen = me.ScreenObject.extend({
    zIndex        : 10,
    numInitiative : 0,
    numFeatures   : 0,
    numStories    : 0,
    numTasks      : 0,
    
    MAX_FEATURE_ROWS : 2,
    MAX_STORY_ROWS   : 3,
    MAX_TASK_ROWS    : 4,
    /**
     *  action to perform on state change
     */
    onResetEvent: function() {
        // Just load the level on page load
        // when data comes back fron the service, then show the ships, etc.
        me.levelDirector.loadLevel("area51");

        this.showLegend();

        //this.setupShips(); when you have data aggregated from the lbapi, use this
        // otherwise, act on a purely event-driven approach
        game.farRight = game.WIDTH;
        game.shipScreen = this;
        this.eventDrivenSetup();
    },

    eventDrivenSetup: function() {
        // list of points where there is currently room for a ship
        // if these fill up, add the item to the correct "pending" log
        game.AVAILABLE_POSITIONS.features = [];
        game.AVAILABLE_POSITIONS.stories = [];
        game.AVAILABLE_POSITIONS.tasks = [];

        // lists of items that cannot fit on the screen at the time of their addition
        game.AVAILABLE_POSITIONS.pendingFeatures = [];
        game.AVAILABLE_POSITIONS.pendingStories = [];
        game.AVAILABLE_POSITIONS.pendingTasks = [];

        var numFeatures = Math.floor(game.WIDTH / game.FEATURE_SHIP.width);
        var numStories = Math.floor(game.WIDTH / game.STORY_SHIP.width);
        var numTasks = Math.floor(game.WIDTH / game.TASK_SHIP.width);

        var i;
        for (i = 0; i < numFeatures; i++) {
            game.AVAILABLE_POSITIONS.features.push(new Point(i * game.FEATURE_SHIP.width, game.PADDING + game.MOTHERSHIP.height));
        }

        for (i = 0; i < numStories * 2; i++) {
            game.AVAILABLE_POSITIONS.stories.push(new Point((i % numStories) * game.STORY_SHIP.width, game.PADDING + game.MOTHERSHIP.height + game.FEATURE_SHIP.height + game.STORY_SHIP.height * Math.floor(i/numStories)));
        }

        for (i = 0; i < numTasks * 2; i++) {
            game.AVAILABLE_POSITIONS.tasks.push(new Point((i % numTasks) * game.STORY_SHIP.width, game.PADDING + game.MOTHERSHIP.height+ game.FEATURE_SHIP.height + game.STORY_SHIP.height * 2 + game.TASK_SHIP.height * Math.floor(i/numTasks)));
        }

        var scope = angular.element($("#root")).scope();
        scope.eventHandler.playThrough();

        var players = me.game.world.getChildByProp('type', game.PLAYER);
        if (players.length == 1) {
            game.PLAYER_SHIP = players[0];
        } else {
            console.error("no player"); // should never happen
        }
    },

    addInitiative: function(record, oid, date) {
        if (this.numInitiative < 1) {
            this.addEnemy(record, oid, date, "xlarge", game.ENEMY_ENTITY_SUPER, game.MOTHERSHIP.height, game.MOTHERSHIP.width, game.WIDTH / 2 - game.MOTHERSHIP.width / 2, game.PADDING);
            this.numInitiative = 1;
            game.initiative = record;
        }
    },

    addFeature: function(record, oid, date) {
        var index = Math.floor(Math.random() * game.AVAILABLE_POSITIONS.features.length);
        var point = game.AVAILABLE_POSITIONS.features[index];
        if (point) {
            this.addEnemy(record, oid, date, "large", game.ENEMY_ENTITY_LARGE, game.FEATURE_SHIP.height, game.FEATURE_SHIP.width, point.x, point.y);
            game.AVAILABLE_POSITIONS.features.splice(index, 1);
            this.numFeatures++;
            this.updateFeature(record, oid, date);
        } else {
            game.OID_MAP[oid] = {
                displayed: false,
                formattedId: record.get('FormattedID'),
                record: record,
                date: date
            };
            game.AVAILABLE_POSITIONS.pendingFeatures.push(oid);
        }
    },

    addStory: function(record, oid, date) {
        var index = Math.floor(Math.random() * game.AVAILABLE_POSITIONS.stories.length);
        var point = game.AVAILABLE_POSITIONS.stories[index];
        if (point) {
            this.addEnemy(record, oid, date, "medium", game.ENEMY_ENTITY_MEDIUM, game.STORY_SHIP.height, game.STORY_SHIP.width, point.x, point.y);
            game.AVAILABLE_POSITIONS.stories.splice(index, 1);
            this.numStories++;
            this.updateStory(record, oid, date);
        } else {
            game.OID_MAP[oid] = {
                displayed: false,
                formattedId: record.get('FormattedID'),
                record: record,
                date: date
            };
            game.AVAILABLE_POSITIONS.pendingStories.push(oid);
        }
    },

    addTask: function(record, oid, date) {
        var index = Math.floor(Math.random() * game.AVAILABLE_POSITIONS.tasks.length);
        var point = game.AVAILABLE_POSITIONS.tasks[index];

        var point = game.AVAILABLE_POSITIONS.tasks[index];
        if (point) {
            this.addEnemy(record, oid, date, "small", game.ENEMY_ENTITY_SMALL, game.TASK_SHIP.height, game.TASK_SHIP.width, point.x, point.y);
            game.AVAILABLE_POSITIONS.tasks.splice(index, 1);
            this.numTasks++;
            this.updateTask(record, oid, date);
        } else {
            game.OID_MAP[oid] = {
                displayed: false,
                formattedId: record.get('FormattedID'),
                record: record,
                date: date
            };
            game.AVAILABLE_POSITIONS.pendingTasks.push(oid);
        }
    },

    recycleShip: function(oid, date) {
        var obj = game.OID_MAP[oid];
        if (obj && obj.displayed && obj.ship) {
            var ship = obj.ship;
            game.log.addItem(ship.record.get('Name') + " recycled", date, 'recycled');
            ship.flyOff();

            // Add back this point as available
            game.addAvailablePosition(ship);

            game.PLAYER_SHIP.removePotentialTarget(ship);
        } else if (obj && !obj.displayed) {
            game.log.addItem(obj.record.get('Name') + " recycled", date, 'recycled');
        }
        delete game.OID_MAP[oid];
    },

    updateInitiative: function(record, oid, date) {
        if (game.INITIATIVE_SHIP) {
            game.INITIATIVE_SHIP.record = record;
        }
        this.updateShip(record, oid, date, function(rec) {
            var endDate = record.get('ActualEndDate');
            return endDate && moment(endDate).isBefore(moment());
        });
    },

    updateFeature: function(record, oid, date) {
        this.updateShip(record, oid, date, function(rec) {
            var endDate = record.get('ActualEndDate');
            return endDate && moment(endDate).isBefore(moment());
        });
    },

    updateStory: function(record, oid, date) {
        // TODO check if it moved from a non completed state?
        this.updateShip(record, oid, date, function(rec) {
            var state = rec.get('ScheduleState');
            // base it on a change in the validTo date not the Recycled field
            var recycle = rec.get('Recycled');
            if (recycle) {
                console.error(">>>story recycled");
                // This is never updated
            }
            return (state == "Completed" || state == "Accepted" || state == "Released");
        });
    },

    updateTask: function(record, oid, date) {
        this.updateShip(record, oid, date, function(rec) {
            return rec.get('State') == "Completed";
        });
    },

    updateShip: function(record, oid, date, addTarget) {
        //console.log('update ' + record.get('Name'));
        var obj = game.OID_MAP[oid];
        if (obj && obj.displayed && obj.ship) {
            var ship = obj.ship;
            ship.record = record;
            if (!obj.targeted && addTarget(record)) {
                obj.targeted = true;
                game.PLAYER_SHIP.addTarget(ship);
            }
        } else if (obj && !obj.displayed) {
            if (addTarget(record)) {
                game.log.addItem(record.get('Name') + " completed", moment(date).format("MM-DD-YY HH:mm"), 'completed');
                delete game.OID_MAP[oid];
            } else {
                game.OID_MAP[oid].record = record;
            }
        }
    },

    addEnemy: function(record, oid, date, image, type, height, width, x, y) {
        var ship = me.pool.pull("enemyShip", x, y, {
            height: height,
            image: image,
            spriteheight: height,
            spritewidth: width,
            width: width,
            objectID: oid,
            z: this.zIndex,
            type: type,
            date: date,
            record: record
        });

        if (image == 'xlarge') {
            game.INITIATIVE_SHIP = ship;
        }

        game.log.addItem(record.get('Name') + " created", date, 'created');

        game.OID_MAP[oid] = {
            displayed: true,
            formattedId: record.get('FormattedID'),
            ship: ship
        };

        me.game.world.addChild(ship, this.zIndex++);
    },

    showLegend: function() {
        function changeShip(num) {
            var ships = $('.shipContainer');
            if (num >= ships.length) {
                num = 0;
            }

            $(ships[num]).fadeIn().delay(5000).fadeOut(function() {
                 changeShip(num + 1);
             });
        }
        $('.shipContainer.logo').hide();
        changeShip(1);
    },

    /**
     *  action to perform when leaving this screen (state change)
     */
    onDestroyEvent: function() {
        // remove all remaining ships
        _.each(game.OID_MAP, function(element, index, list) {
            if (element.displayed) {
                if (element.ship) {
                    destroy = element.ship;
                    var offset;
                    switch (destroy.type) {
                        case game.ENEMY_ENTITY_LARGE:
                            offset = 'LARGE';
                            break;

                        case game.ENEMY_ENTITY_MEDIUM:
                            offset = 'MEDIUM'; 
                            break;
                        default: offset = 'SMALL';
                    }
                    game.VICTORY_ANIMATIONS[offset].push(new Point(destroy.pos.x + destroy.width / 2, destroy.pos.y + destroy.height / 2));

                    me.game.world.removeChild(destroy);
                    // TODO animate destruction of remaining ships?
                }
            }
        });
    }
});
