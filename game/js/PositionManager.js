// Manages open ship positions and pending records
// TODO does not work fully for tasks yet

function PositionManager(screenWidth, largeShip, mediumShip, smallShip, topOffset) {
    var width = screenWidth;
    var shipWidth = {
        large: largeShip.width,
        medium: mediumShip.width,
        small: smallShip.width
    };

    var shipHeight = {
        large: largeShip.height,
        medium: mediumShip.height,
        small: smallShip.height
    }

    var topOffset = topOffset;

    // initialize all available positions
    var numLarge = Math.floor(width / shipWidth.large);
    var numMedium = Math.floor(width / shipWidth.medium);
    var numSmall = Math.floor(width / shipWidth.small);

    var NUM_LARGE_PER_LINE = numLarge;
    var NUM_MEDIUM_PER_LINE = numMedium;
    var NUM_SMALL_PER_LINE = numSmall;

    var availablePositions = {
        large: new Array(numLarge),
        medium: new Array(numMedium * 2),
        small: new Array(numSmall * 2)
    }

    var pendingPlacement = {
        large: new Array(),
        medium: new Array(),
        small: new Array()
    }

    var largePositionsToIndex = {};

    var i = 0;
    for (i = 0; i < availablePositions.large.length; i++) {
        availablePositions.large[i] = new Point(i * shipWidth.large, topOffset);
    }

    for (i = 0; i < availablePositions.medium.length; i++) {
        availablePositions.medium[i] = new Point((i % numMedium) * shipWidth.medium, topOffset + shipHeight.large + shipHeight.medium * Math.floor(i/numMedium));
    }

    for (i = 0; i < availablePositions.small.length; i++) {
        availablePositions.small[i] = new Point((i % numSmall) * shipWidth.small, topOffset+ shipHeight.large + shipHeight.medium * 2 + shipHeight.small * Math.floor(i/numSmall));
    }

    var nextFeatureIndex = 1;
    var initial = true;

    this.getFeaturePosition = function() {
        if (numLarge > 0 && initial) {
            nextFeatureIndex += 2;
            if (nextFeatureIndex >= availablePositions.large.length) {
                nextFeatureIndex = Math.floor((nextFeatureIndex % 2 + 1) / 2);
            }
            numLarge--;
            var temp = availablePositions.large[nextFeatureIndex];
            delete availablePositions.large[nextFeatureIndex];
            return temp;
        } else {
            initial = false;
            for (var j = 0; j < availablePositions.large.length; i++) {
                var temp = availablePositions.large[j];
                delete availablePositions.large[j];
                return temp;
            }
            return null;
        }
    };

    var getRandomStoryPosition = function() {
        // just grab the first available position
        for (var i = 0; i < availablePositions.medium.length; i++) {
            var temp = availablePositions.medium[i]
            if (temp) {
                delete availablePositions.medium[i];
                return temp;
            }
        }
        return null;
    };

    this.getStoryPosition = function(featureX) {
        if (!featureX) {
            return getRandomStoryPosition();
        }

        // try to find a story near its feature
        var featureIndex = featureX / shipWidth.large;
        var low = Math.max(0, (featureIndex - 1) * 2);
        var high = (featureIndex + 1) * 2 + 1;
        var highCap = Math.min(NUM_MEDIUM_PER_LINE, high);
        var max = Math.min(high + NUM_MEDIUM_PER_LINE + 1, availablePositions.medium.length);
        // could be between low and high OR on the next row, which is low + NUM_MEDIUM_PER_LINE and high +

        var idx;
        for (idx = low; idx < highCap; idx++) {
            if (availablePositions.medium[idx]) {
                var temp = availablePositions.medium[idx];
                delete availablePositions.medium[idx];
                return temp;
            }
        }

        for (idx = low + NUM_MEDIUM_PER_LINE; idx < max; idx++) {
            if (availablePositions.medium[idx]) {
                var temp = availablePositions.medium[idx];
                delete availablePositions.medium[idx];
                return temp;
            }
        }

        return getRandomStoryPosition(); // for now, just dont show a ship under this feature
    };  

    this.getTaskPosition = function() {
        // forget about it
        return null;
    };

    this.addAvailablePosition = function(width, x, y) {
        // TODO check to see if something is waiting on this spot?
        var addBackTo;

        if (width == shipWidth.large) {
            if (pendingPlacement.large.length > 0) {
                oid = pendingPlacement.large.pop();
                if (!game.OID_MAP[oid] || !game.OID_MAP[oid].record) {
                    console.error("This record is current displayed or does not exist");
                }
                game.shipScreen.addFeature(game.OID_MAP[oid].record, oid, game.OID_MAP[oid].date, x, y);
                return;
            }
            addBackTo = availablePositions.large;
        } else if (width == shipWidth.medium) {
            if (pendingPlacement.medium.length > 0) {
                oid = pendingPlacement.medium.pop();
                console.log(oid, game.OID_MAP[oid]);
                if (!game.OID_MAP[oid] || !game.OID_MAP[oid].record) {
                    // TODO handle this
                    console.error("This record is current displayed or does not exist");
                }

                game.shipScreen.addStory(game.OID_MAP[oid].record, oid, game.OID_MAP[oid].date, x, y);
                return;
            }
            addBackTo = availablePositions.medium;
        } else if (width == shipWidth.small) {
            if (pendingPlacement.small.length > 0) {
                oid = pendingPlacement.small.pop();               
                game.shipScreen.addTask(game.OID_MAP[oid].record, oid, game.OID_MAP[oid].date, x, y);
                return;
            }

            addBackTo = availablePositions.small;
        } else {
            // should never happen
            return;
        }

        // find index in the array to add this open slot to
        var index = Math.floor(x / width);
        if (addBackTo[index] && width != shipWidth.large) {
            index += addBackTo.length / 2;
        }
        if (addBackTo[index]) {
            console.error("[X][X][X][X] - this should never happen - at index " + index, addBackTo, width, x, y);
        } else {
            addBackTo[index] = new Point(x, y);
        }
    };

    this.addPending = function(oid, type) {
        switch(type) {
            case "PortfolioItem/Feature":
                pendingPlacement.large.push(oid);
                return;
            case "Task":
                pendingPlacement.small.push(oid);
                return;
            case "HierarchicalRequirement":
            case "UserStory":
                pendingPlacement.medium.push(oid);
                return;
            default: // noop
        }
    };

    var removeFromArr = function(oid, arr) {
        if (arr) {
            var removeIdx = -1;
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] == oid) {
                    removeIdx = i;
                    break;
                }
            }
            if (removeIdx >= 0) {
                arr.splice(removeIdx, 1);
                return true;
            }
            return false;
        }
        return false;
    }

    this.removePending = function(oid) {
        !removeFromArr(oid, pendingPlacement.large) && !removeFromArr(oid, pendingPlacement.medium) && removeFromArr(oid, pendingPlacement.small);
    };
}