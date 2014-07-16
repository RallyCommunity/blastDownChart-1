game.PlayScreen = me.ScreenObject.extend({
    zIndex        : 10,
    numInitiative : 0,
    numFeatures   : 0,
    numStories    : 0,
    numTasks      : 0,
    
    MAX_FEATURE_ROWS : 2,
    MAX_STORY_ROWS   : 3,
    MAX_TASK_ROWS    : 4,
    addedWithoutFeature : {},

    /**
     *  action to perform on state change
     */
    onResetEvent: function() {
        // Just load the level on page load
        // when data comes back fron the service, then show the ships, etc.
        me.levelDirector.loadLevel("area51");

        this.showLegend();

        // this.setupShips(); when you have data aggregated from the lbapi, use this
        // otherwise, act on a purely event-driven approach
        game.farRight = game.WIDTH;
        game.shipScreen = this;

        game.removedFeatures = {};


        this.eventDrivenSetup();

    },

    eventDrivenSetup: function() {
        game.POSITION_MANAGER = new PositionManager(game.WIDTH, game.FEATURE_SHIP, game.STORY_SHIP, game.TASK_SHIP, game.PADDING + game.MOTHERSHIP.height);

        var scope = angular.element($("#root")).scope();
        scope.eventHandler.playThrough();
    },

    addInitiative: function(record, oid, date) {
        if (this.numInitiative < 1) {
            this.addEnemy(record, oid, date, "xlarge", game.ENEMY_ENTITY_SUPER, game.MOTHERSHIP.height, game.MOTHERSHIP.width, game.WIDTH / 2 - game.MOTHERSHIP.width / 2, game.PADDING);
            this.numInitiative = 1;
            game.initiative = record;
        }
    },

    addFeature: function(record, oid, date, pt) {
        var point = pt ? pt : game.POSITION_MANAGER.getFeaturePosition();
        if (point) {
            var color = game.FEATURE_SHIP_COLORS[game.FEATURE_SHIP_COLOR_INDEX % game.FEATURE_SHIP_COLORS.length];
            game.featureColorMap[oid] = color;
            console.log("xxx" + oid + " " + color);
            this.addEnemy(record, oid, date, "large_" + color, game.ENEMY_ENTITY_LARGE, game.FEATURE_SHIP.height, game.FEATURE_SHIP.width, point.x, point.y);
            this.numFeatures++;
            game.FEATURE_SHIP_COLOR_INDEX++;
        } else {
            game.OID_MAP[oid] = {
                formattedId: record.get('FormattedID'),
                record: record,
                date: date
            };
            game.POSITION_MANAGER.addPending(oid, "PortfolioItem/Feature");
        }
    },

    addStory: function(record, oid, date, pt) {
        if (record.get('ObjectID') != oid) {
            console.error("object id not equal to oid", record, oid);
            return;
        }
        if (game.OID_MAP[oid] && game.OID_MAP[oid].ship) {
            console.log("Creating: ", record, oid, date, pt);
            return;
        }
        var featureOid = record.get('Feature');
        var x = 0;
        var color = 'medium';
        if (game.OID_MAP[featureOid] && game.OID_MAP[featureOid].ship) {
            x = game.OID_MAP[featureOid].ship.startingX;
            color = 'medium_' + game.featureColorMap[featureOid] || 'medium';
        }

        var point = pt ? pt : game.POSITION_MANAGER.getStoryPosition(x);
        if (point) {
            this.addEnemy(record, oid, date, color, game.ENEMY_ENTITY_MEDIUM, game.STORY_SHIP.height, game.STORY_SHIP.width, point.x, point.y, featureOid);
            this.numStories++;
            //this.updateStory(record, oid, date);

        } else {
            game.OID_MAP[oid] = {
                formattedId: record.get('FormattedID'),
                record: record,
                date: date
            };
            game.POSITION_MANAGER.addPending(oid, "HierarchicalRequirement");
        }

        // a lot of unnecessary calls
        game.scoreboard.initPoints(record.get('Project'));
        //console.log("init points for " + record.get('Project'));
    },

    addTask: function(record, oid, date) {
        /*
        var index = Math.floor(Math.random() * game.AVAILABLE_POSITIONS.tasks.length);
        var point = game.AVAILABLE_POSITIONS.tasks[index];

        var point = game.AVAILABLE_POSITIONS.tasks[index];
        if (point) {
            var featureOid = record.get('Feature');
            var color = game.featureColorMap[featureOid] || "none";
            // TODO color tasks
            this.addEnemy(record, oid, date, "small", game.ENEMY_ENTITY_SMALL, game.TASK_SHIP.height, game.TASK_SHIP.width, point.x, point.y, featureOid);
            this.numTasks++;
            this.updateTask(record, oid, date);
        } else {
            game.OID_MAP[oid] = {
                formattedId: record.get('FormattedID'),
                record: record,
                date: date
            };
            game.AVAILABLE_POSITIONS.pendingTasks.push(oid);
            game.POSITION_MANAGER.addPending(oid, "Task");
        }
        */
    },

    recycleShip: function(oid, date) {
        var obj = game.OID_MAP[oid];
        if (obj && obj.ship) {
            var ship = obj.ship;
            if (ship.type == game.ENEMY_ENTITY_LARGE) {
                // remove all children of the feature
                game.removedFeatures[oid] = [];
                var children = me.game.world.getChildByProp("featureOid", oid);
                console.log("children", children);
                _.each(game.OID_MAP, function(entry, key) {
                    if (entry.ship && entry.ship.featureOid == oid) {
                        game.removedFeatures[oid].push(entry.ship.objectID);
                        entry.ship.flyOff();
                    } else if (entry.record && entry.record.get('Feature') == oid) {
                        // TODO remove this as a pending story
                        game.removedFeatures[oid].push(entry.record.get('ObjectID'));
                        game.POSITION_MANAGER.removePending(oid, "HierarchicalRequirement");
                    }
                });

                /*
                TODO ???

                _.each(childShips, function(ship) {
                    // ship.flyOff(); 
                    
                    if (entry.ship && entry.ship.featureOid == oid) {
                        game.removedFeatures[oid].push(entry.ship.objectID);
                        console.log("Removing", game.OID_MAP[key], entry.ship.featureOid);
                        entry.ship.flyOff();
                    } else if (entry.record && entry.record.get('Feature') == oid) {
                        // TODO remove this as a pending story
                        game.removedFeatures[oid].push(entry.record.get('ObjectID'));
                        game.POSITION_MANAGER.removePending(oid, "HierarchicalRequirement");
                    }

                    
                });
                
*/
                
                setTimeout(function() {
                    console.log(game.removedFeatures);
                    console.log(game.OID_MAP);
                    console.log();
                }, 5000);
            } else if (ship.type == game.ENEMY_ENTITY_MEDIUM) {
                console.log("Removing", oid, game.OID_MAP[oid].ship.featureOid);
                var children = ship.record.get('Children');
                if (children) {
                    console.log("Also removing ", children);
                    _.each(children, function(childOid) {
                        var entity = game.OID_MAP[childOid];
                        if (entity && entity.ship) {
                            entity.ship.flyOff();
                        }
                    });
                }
            }
            game.log.addItem(ship.record.get('Name') + " recycled", date, 'recycled');
            ship.flyOff(); // also adds this point back as available

            if (game.TEAM_SHIPS[ship.team]) {
                game.TEAM_SHIPS[ship.team].removePotentialTarget(ship);
            }
        } else if (obj && obj.record) {
            game.POSITION_MANAGER.removePending(oid);
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
        var obj = game.OID_MAP[oid];
        if (obj && obj.ship) {
            var ship = obj.ship;
            ship.record = record;
            var endDate = record.get('ActualEndDate');
            if (!obj.targeted && endDate && moment(endDate).isBefore(moment())) {
                obj.targeted = true;
                var teamShip = game.getTeam(record.get('Project'));
                if (teamShip) {
                    ship.team = record.get('Project')
                    var children = me.game.world.getChildByProp("featureOid", oid);
                    // Add all remaining shown children as targets first
                    _.each(children, function(child) {
                        teamShip.addTarget(child);
                        console.log("My feature was destroyed", child);
                    });

                    teamShip.addTarget(ship);
                }
            }
        } else if (obj && obj.record) {
            if (endDate && moment(endDate).isBefore(moment())) {
                game.log.addItem(record.get('Name') + " completed", moment(date).format("MM-DD-YY HH:mm"), 'completed');
                delete game.OID_MAP[oid];
            } else {
                game.OID_MAP[oid].record = record;
            }
        }
    },

    updateStory: function(record, oid, date) {
        
        var feature = record.get('Feature');
        var state = record.get('ScheduleState');
        var obj = game.OID_MAP[oid];

        if (obj && obj.ship) {
            var ship = obj.ship;
            ship.record = record;
            if (!obj.targeted && (state == "Completed" || state == "Accepted" || state == "Released")) {
                obj.targeted = true;
                var children = record.get('Children');

                var teamShip = game.getTeam(record.get('Project'));
                var teamOid = record.get('Project');
                if (teamShip) {
                    if (children) {
                        _.each(children, function(child) {
                            var childShip = game.OID_MAP[child];
                            if (childShip && childShip.ship) {
                                childShip.team = teamOid;
                                teamShip.addTarget(childShip);
                            }

                            // also check pending ships?
                        });
                    }
                    ship.team = teamOid;
                    teamShip.addTarget(ship);
                }
            }
        } else if (obj && obj.record) {
            if ((state == "Completed" || state == "Accepted" || state == "Released")) {
                game.log.addItem(record.get('Name') + " completed", moment(date).format("MM-DD-YY HH:mm"), 'completed');
                delete game.OID_MAP[oid];
            } else {
                game.OID_MAP[oid].record = record;
            }
        }
    },

    updateTask: function(record, oid, date) {
        this.updateShip(record, oid, date, function(rec) {
            return rec.get('State') == "Completed";
        });
    },

    updateShip: function(record, oid, date, shouldAddTarget) {
        //console.log('update ' + record.get('Name'));
        var obj = game.OID_MAP[oid];
        if (obj && obj.ship) {
            var ship = obj.ship;
            ship.record = record;
            if (!obj.targeted && shouldAddTarget(record)) {
                obj.targeted = true;
                var teamShip = game.getTeam(record.get('Project'));
                if (teamShip) {
                    ship.team = record.get('Project')
                    teamShip.addTarget(ship);
                }
            }
        } else if (obj && obj.record) {
            if (addTarget(record)) {
                game.log.addItem(record.get('Name') + " completed", moment(date).format("MM-DD-YY HH:mm"), 'completed');
                delete game.OID_MAP[oid];
            } else {
                game.OID_MAP[oid].record = record;
            }
        }
    },

    addEnemy: function(record, oid, date, image, type, height, width, x, y, featureOid) {
        var shipSettings = {
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
        };

        if (featureOid) {
            shipSettings.featureOid = featureOid;
        }

        var ship = me.pool.pull("enemyShip", x, y, shipSettings);

        if (image == 'xlarge') {
            game.INITIATIVE_SHIP = ship;
        }

        game.log.addItem(record.get('Name') + " created", date, 'created');

        
        game.OID_MAP[oid] = {
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
            }
        });

        game.eventHandler.stopEvents();
    }
});
