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

        this.eventDrivenSetup();
    },

    eventDrivenSetup: function() {
        game.POSITION_MANAGER = new PositionManager(game.WIDTH, game.FEATURE_SHIP, game.STORY_SHIP, game.TASK_SHIP, game.PADDING + game.MOTHERSHIP.height);
        var scope = angular.element($("#root")).scope();
        
        var i = 0;
        setInterval(function() {

            var ship = me.pool.pull("rallyShip", -41, 1, {
                height: 42,
                image: 'rectangle',
                spriteheight: 42,
                spritewidth: 42,
                width: 42,
                z: Number.POSITIVE_INFINITY,
                type: game.RALLY_SHIP
            });

            game.cleanupOld();

            me.game.world.addChild(ship, Number.POSITIVE_INFINITY);
        }, 10000);

        var color = game.TEAM_SHIP_COLORS[game.TEAM_SHIP_COLOR_INDEX % game.TEAM_SHIP_COLORS.length];
        game.TEAM_SHIP_COLOR_INDEX++; // TODO special color?

        // create a new one
        var team = me.pool.pull("rallyHunter", 64, game.WINDOW_HEIGHT - 64, {
            image: "player_" + color.name,
            spriteheight: 64,
            spritewidth: 32,
            width: 32,
            height: 64,
            z: Number.POSITIVE_INFINITY,
            type: game.PLAYER,
            team: game.SPECIAL_TEAM
        });
        game.canShoot[game.SPECIAL_TEAM] = true;
        game.TEAM_SHIPS[game.SPECIAL_TEAM] = team;

        me.game.world.addChild(team, Number.POSITIVE_INFINITY);
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
        var point = pt && typeof pt == "object" ? pt : game.POSITION_MANAGER.getFeaturePosition();
        if (point) {
            var color = game.featureColorMap[oid];
            if (!color) {
                color = game.FEATURE_SHIP_COLORS[game.FEATURE_SHIP_COLOR_INDEX % game.FEATURE_SHIP_COLORS.length];
                game.FEATURE_SHIP_COLOR_INDEX++;
                game.featureColorMap[oid] = color;
            }
            
            this.addEnemy(record, oid, date, "large_" + color, game.ENEMY_ENTITY_LARGE, game.FEATURE_SHIP.height, game.FEATURE_SHIP.width, point.x, point.y);
            this.numFeatures++;
        } else {
            game.OID_MAP[oid] = {
                formattedId: record.get('FormattedID'),
                record: record,
                date: date
            };
            game.POSITION_MANAGER.addPending(oid, "PortfolioItem/Feature");
            game.log.addItem(record.get('Name') + " created", date, 'created');
        }
    },

    addStory: function(record, oid, date, pt) {
        //console.log("add story");
        if (record.get('ObjectID') != oid) {
            console.error("object id not equal to oid", record, oid);
            return;
        }
        if (game.OID_MAP[oid] && game.OID_MAP[oid].ship) {
            return;
        }
        var featureOid = record.get('Feature');
        var x = 0;
        var color = 'medium';
        if (game.OID_MAP[featureOid] && game.OID_MAP[featureOid].ship) {
            x = game.OID_MAP[featureOid].ship.startingX;
            color = 'medium_' + game.featureColorMap[featureOid] || 'medium';
        }

        var point = pt && typeof pt == "object" ? pt : game.POSITION_MANAGER.getStoryPosition(x);
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
            game.log.addItem(record.get('Name') + " created", date, 'created');
        }

        game.getTeam(record.get('Project'));
    },

    addTask: function(record, oid, date, pt) {
        //console.log("add task");
        var featureOid = record.get('Feature');
        var x = 0;
        var color = 'small';
        if (game.OID_MAP[featureOid] && game.OID_MAP[featureOid].ship) {
            x = game.OID_MAP[featureOid].ship.startingX;
            color = 'small_' + game.featureColorMap[featureOid] || 'small';
        }

        var point = pt && typeof pt == "object" ? pt : game.POSITION_MANAGER.getTaskPosition(x);
        if (point) {
            this.addEnemy(record, oid, date, color, game.ENEMY_ENTITY_SMALL, game.TASK_SHIP.height, game.TASK_SHIP.width, point.x, point.y, featureOid);
            this.numTasks++;
            //this.updateTask(record, oid, date);
        } else {
            game.OID_MAP[oid] = {
                formattedId: record.get('FormattedID'),
                record: record,
                date: date
            };
            game.POSITION_MANAGER.addPending(oid, "Task");
            game.log.addItem(record.get('Name') + " created", date, 'created');
        }
        
    },

    recycleShip: function(oid, date) {
        var obj = game.OID_MAP[oid];
        if (obj && obj.ship) {
            var ship = obj.ship;
            if (ship.type == game.ENEMY_ENTITY_LARGE) {
                // remove all children of the feature
                var remove = [];
                var pendingRemove = [];
                _.each(game.OID_MAP, function(entry, key) {
                    if (entry.ship && entry.ship.featureOid == oid) {
                        remove.push(entry.ship);
                    } else if (entry.record && entry.record.get('Feature') == oid) {
                        pendingRemove.push(entry.record.get('ObjectID'));
                    }
                });
                _.each(remove, function(ship) {
                    ship.flyOff();
                });

                _.each(pendingRemove, function(pendingOid) {
                    game.POSITION_MANAGER.removePending(pendingOid, "HierarchicalRequirement");
                });
            } else if (ship.type == game.ENEMY_ENTITY_MEDIUM) {
                var children = ship.record.get('Children');
                if (children) {
                    _.each(children, function(childOid) {
                        var entity = game.OID_MAP[childOid];
                        if (entity && entity.ship) {
                            entity.ship.flyOff();
                        }
                    });
                }
            }
            game.log.addItem(ship.record.get('Name') + " recycled", date, 'recycled');
            if (ship.flyOff) {
                ship.flyOff(); // also adds this point back as available
            }
        } else if (obj && obj.record) {
            game.POSITION_MANAGER.removePending(oid);
            game.log.addItem(obj.record.get('Name') + " recycled", date, 'recycled');
        }
    },

    updateInitiative: function(record, oid, date) {
        //console.log("update initiative");
        if (game.INITIATIVE_SHIP) {
            game.INITIATIVE_SHIP.record = record;
        }

        var endDate = record.get('ActualEndDate');
        if (!game.endDate && endDate) {
            game.endDate = moment(endDate);
            game.historyFinishedData = {
                oid: oid
            }
            console.log("Completed initiative at " + game.endDate);
            if (game.isHistoryFinished) {
                game.historyFinished();
            }
        }
        

        var obj = game.OID_MAP[oid];
        if (obj && obj.ship) {
            var ship = obj.ship;
            ship.record = record;
        } else if (obj && obj.record) {
            if (addTarget(record)) {
                game.log.addItem(record.get('Name') + " completed", moment(date).format("MM-DD-YY HH:mm"), 'completed');
                delete game.OID_MAP[oid];
            } else {
                game.OID_MAP[oid].record = record;
            }
        }
    },

    updateFeature: function(record, oid, date) {
        //console.log("update feature");
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
                    });

                    teamShip.addTarget(ship);
                }
            }
        } else if (obj && obj.record) {
            if (endDate && moment(endDate).isBefore(moment())) {
                // see if you can swap this record with one that is currently on the screen
                var possibleShips = me.game.world.getChildByProp('type', game.ENEMY_ENTITY_LARGE);
                if (possibleShips && possibleShips.length > 0) {
                    var match = _.find(possibleShips, function(oneShip) {
                        if (game.OID_MAP[oneShip] && !game.OID_MAP[oneShip.objectID].targeted && game.OID_MAP[oneShip.objectID].ship)  {
                            return oneShip;
                        }
                    });

                    if (match) {
                        // swap records
                        var temp = game.OID_MAP[oid];

                        // update the displayed in the oid map
                        game.OID_MAP[match.objectID].record = match.record;
                        game.OID_MAP[match.objectID].date = match.date;
                        game.OID_MAP[match.objectID].ship = null;
                        game.OID_MAP[match.objectID] = temp;

                        // update the ship
                        match.objectID = oid;
                        match.date = date;
                        match.record = record;

                        // update this in the oidmap
                        game.OID_MAP[oid].record = null;
                        game.OID_MAP[oid].ship = match;
                        game.OID_MAP[oid].date = date;
                        var teamShip = game.getTeam(record.get('Project'));
                        if (teamShip) {
                            game.OID_MAP[oid].targeted = teamShip.team;
                            teamShip.addTarget(match);
                        }

                        console.log("SWAPPED!");
                        return;
                    }
                }
                // oh well, we tried to make it more fun!
                game.log.addItem(record.get('Name') + " completed", moment(date).format("MM-DD-YY HH:mm"), 'completed');
                delete game.OID_MAP[oid];
            } else {
                game.OID_MAP[oid].record = record;
            }
        }
    },

    updateStory: function(record, oid, date) {
        //console.log("update story");
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

                var possibleShips = me.game.world.getChildByProp('type', game.ENEMY_ENTITY_MEDIUM);
                if (possibleShips && possibleShips.length > 0) {
                    var match = _.find(possibleShips, function(oneShip) {
                        if (game.OID_MAP[oneShip.objectID] && !game.OID_MAP[oneShip.objectID].targeted && game.OID_MAP[oneShip.objectID].ship)  {
                            return oneShip;
                        }
                    });

                    if (match) {
                        // update the displayed in the oid map
                        game.OID_MAP[match.objectID].record = match.record;
                        game.OID_MAP[match.objectID].date = match.date;
                        game.OID_MAP[match.objectID].ship = null;
                        game.OID_MAP[match.objectID].swapped = oid;

                        // update the ship
                        match.objectID = oid;
                        match.date = date;
                        match.record = record;

                        // update this in the oidmap
                        game.OID_MAP[oid].record = null;
                        game.OID_MAP[oid].ship = match;
                        game.OID_MAP[oid].date = date;
                        var teamShip = game.getTeam(record.get('Project'));
                        if (teamShip) {
                            game.OID_MAP[oid].targeted = teamShip.team;
                            teamShip.addTarget(match);
                        }

                        console.log("SWAPPED!");
                        return;
                    } else {
                        console.log("NO MATCH, COULD NOT SWAP");
                    }
                } else {
                    console.log("NONE POSSIBLE, COULD NOT SWAP", possibleShips);
                }
                
                // oh well, we tried to make it more fun!
                game.log.addItem(record.get('Name') + " completed", moment(date).format("MM-DD-YY HH:mm"), 'completed');
                delete game.OID_MAP[oid];
            } else {
                game.OID_MAP[oid].record = record;
            }
        }
    },

    updateTask: function(record, oid, date) {
        // TODO swap if not shown - we have yet to see a situation where this would matter, but maybe they use a tonnnn or tasks
        this.updateShip(record, oid, date, function(rec) {
            return rec.get('State') == "Completed";
        });
    },

    updateShip: function(record, oid, date, shouldAddTarget) {
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
            if (shouldAddTarget(record)) {
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

        if (!game.OID_MAP[oid] || !game.OID_MAP[oid].swapped) {
            game.log.addItem(record.get('Name') + " created", date, 'created');
        }
        
        game.OID_MAP[oid] = {
            formattedId: record.get('FormattedID'),
            ship: ship,
            targeted: false
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
        var scope = angular.element($("#root")).scope();
        scope.eventHandler.stopEvents();
    }
});
