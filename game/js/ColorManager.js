// Manages the relationship between ships and their colors

function ColorManager(featureImagePrefix, storyImagePrefix, taskImagePrefix) {
    var FEATURE_SHIP_COLORS = ["blue", "brick", "darkgold", "darkgreen", "gold", "green", "lime",
                            "medblue", "medlime", "medorange", "medpink", "medpurple", "medred",
                            "medteal", "medyellow", "orange", "pink", "purple", "teal", "white", "yellow"];

    var FEATURE_SHIP_COLOR_INDEX = 0;
    var featureColorMap = {};

    var featurePrefix = featureImagePrefix;
    var storyPrefix = storyImagePrefix;
    var taskPrefix = taskImagePrefix;

    var getColor = function(featureOid) {
        var color = featureColorMap[featureOid];
        if (!color) {
            // pick a new one and create a mapping
            color = FEATURE_SHIP_COLORS[FEATURE_SHIP_COLOR_INDEX % FEATURE_SHIP_COLORS.length];
            FEATURE_SHIP_COLOR_INDEX++;
            featureColorMap[featureOid] = color;
        }
        return color;
    };

    this.getFeatureColor = function(featureOid) {
        return featurePrefix + "" + getColor(featureOid);
    };

    this.getStoryColor = function(featureOid) {
        return storyPrefix + "" + getColor(featureOid);
    };

    this.getTaskColor = function(featureOid) {
        return taskPrefix + "" + getColor(featureOid);
    };

}