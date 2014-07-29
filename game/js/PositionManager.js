// Manages open ship positions and pending records

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
    };

    var verticalOffset = topOffset;

    // initialize all available positions
    var numLarge = Math.floor(width / shipWidth.large);
    var numMedium = Math.floor(width / shipWidth.medium);
    var numSmall = Math.floor(width / shipWidth.small);

    var NUM_LARGE_PER_LINE = numLarge;
    var NUM_MEDIUM_PER_LINE = numMedium;
    var NUM_SMALL_PER_LINE = numSmall;

    var availablePositions = {
        large: new Array(NUM_LARGE_PER_LINE),
        medium: new Array(numMedium * 2),
        small: new Array(numSmall * 2)
    };

    var pendingPlacement = {
        large: [],
        medium: [],
        small: []
    };

    var paddingLeft = 32;

    var largePositionsToIndex = {};

    var i = 0;
    for (i = 0; i < availablePositions.large.length; i++) {
        availablePositions.large[i] = new Point(i * shipWidth.large + paddingLeft, verticalOffset);
    }

    for (i = 0; i < availablePositions.medium.length; i++) {
        availablePositions.medium[i] = new Point((i % numMedium) * shipWidth.medium + paddingLeft,  8 + verticalOffset + shipHeight.large + shipHeight.medium * Math.floor(i/numMedium));   
    }
    for (i = 0; i < availablePositions.small.length; i++) {
        availablePositions.small[i] = new Point((i % numSmall) * shipWidth.small + paddingLeft,  16 + verticalOffset+ shipHeight.large + shipHeight.medium * 2 + shipHeight.small * Math.floor(i/numSmall));
    }

    var nextFeatureIndex = -1;
    var initial = true;

    this.getFeaturePosition = function() {
        var temp;
        if (numLarge > 0 && initial) {
            nextFeatureIndex += 2;
            if (nextFeatureIndex >= availablePositions.large.length) {
                nextFeatureIndex = 0;
            }
            numLarge--;
            temp = availablePositions.large[nextFeatureIndex];
            delete availablePositions.large[nextFeatureIndex];
            return temp;
        } else {
            initial = false;
            var index = -1;
            for (var j = 0; j < availablePositions.large.length; j++) {
                if (availablePositions.large[j]) {
                    index = j;
                    break;
                }
            }
            if (index == -1) {
                return null;
            } else {
                temp = availablePositions.large[index];
                delete availablePositions.large[index];
                return temp;
            }
        }
    };

    var getRandomPosition = function(positionArray) {
        // just grab the first available position
        for (var i = 0; i < positionArray.length; i++) {
            var temp = positionArray[i];
            if (temp) {
                delete positionArray[i];
                return temp;
            }
        }
        return null;
    };

    var getPosition = function(array, maxPerLine, featureX) {
        if (!featureX) {
            return getRandomPosition(array);
        }

        // try to find a story near its feature
        var featureIndex = featureX / shipWidth.large;
        var low = Math.max(0, (featureIndex - 1) * 2);
        var high = (featureIndex + 1) * 2 + 1;
        var highCap = Math.min(maxPerLine, high);
        var max = Math.min(high + maxPerLine + 1, array.length);
        var temp;
        var idx;
        for (idx = low; idx < highCap; idx++) {
            if (array[idx]) {
                temp = array[idx];
                delete array[idx];
                return temp;
            }
        }

        for (idx = low + NUM_MEDIUM_PER_LINE; idx < max; idx++) {
            if (array[idx]) {
                temp = array[idx];
                delete array[idx];
                return temp;
            }
        }

        return getRandomPosition(array); // for now, just dont show a ship under this feature
    };

    this.getStoryPosition = function(featureX) {
        return getPosition(availablePositions.medium, NUM_MEDIUM_PER_LINE, featureX);
    };  

    this.getTaskPosition = function(featureX) {
        return getPosition(availablePositions.small, NUM_SMALL_PER_LINE, featureX);
    };

    this.addAvailablePosition = function(width, x, y) {
        var addBackTo;

        if (width == shipWidth.large) {
            if (pendingPlacement.large.length > 0) {
                oid = pendingPlacement.large.shift();
                if (!game.OID_MAP[oid]) {
                    //console.error("This record does not exist");
                } else if (!game.OID_MAP[oid].record) {
                    //console.error("This record is current displayed");
                } else {
                    game.shipScreen.addFeature(game.OID_MAP[oid].record, oid, game.OID_MAP[oid].date, new Point(x, y));
                }
                return;
            }
            addBackTo = availablePositions.large;
        } else if (width == shipWidth.medium) {
            if (pendingPlacement.medium.length > 0) {
                oid = pendingPlacement.medium.pop();
                if (!game.OID_MAP[oid]) {
                    //console.error("This record does not exist");
                } else if (!game.OID_MAP[oid].record) {
                    //console.error("This record is current displayed");
                } else {
                    game.shipScreen.addStory(game.OID_MAP[oid].record, oid, game.OID_MAP[oid].date, new Point(x, y));
                }
                
                return;
            }
            addBackTo = availablePositions.medium;
        } else if (width == shipWidth.small) {
            if (pendingPlacement.small.length > 0) {
                oid = pendingPlacement.small.pop();
                if (!game.OID_MAP[oid]) {
                    //console.error("This record does not exist");
                } else if (!game.OID_MAP[oid].record) {
                    //console.error("This record is current displayed");
                } else {               
                    game.shipScreen.addTask(game.OID_MAP[oid].record, oid, game.OID_MAP[oid].date, new Point(x, y));
                }
                return;
            }

            addBackTo = availablePositions.small;
        } else {
            // should never happen
            return;
        }

        // find index in the array to add this open slot to
        var index = Math.floor((x - paddingLeft) / width);

        if (addBackTo[index] && width != shipWidth.large) {
            index += addBackTo.length / 2;
        }
        if (addBackTo[index]) {
            //console.error("[X][X][X][X] - this should never happen - at index " + index, addBackTo, width, x, y);
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
    };

    this.removePending = function(oid) {
        if (!removeFromArr(oid, pendingPlacement.large) && !removeFromArr(oid, pendingPlacement.medium) && removeFromArr(oid, pendingPlacement.small)) {}
    };
}