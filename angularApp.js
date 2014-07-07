module = angular.module('angularBlastdown', []);

module.controller('dataController', ['$scope', 'RallyDataService', 'RealtimeService', 'LookbackService', function($scope, RallyDataService, RealtimeService, LookbackService) {
    $scope.organizedData = {};
    $scope.RallyDataService = RallyDataService;

    var gameHandler = new GameEventHandler();

/*
    RallyDataService.getData(true, function(data) {
        $scope.organizedData = data;
        $scope.$apply();
        // Start the game
        game.onload();
    });
*/

    $scope.logItems = [{
        date: Ext.Date.format(new Date(), "m-d H:i"),
        note: "Space Invaders Blast Down Initialized"
    }];

    game.onload();

    $scope.connect = function() {
        LookbackService.connect(GLOBAL.ObjectID);
    };

    $scope.addLogItem = function(logItem, date) {
        var dateString = date || Ext.Date.format(new Date(), "m-d H:i");
        $scope.logItems.unshift({
            date: dateString,
            note: logItem
        });
        $scope.$apply();
    };
}]);
