module = angular.module('angularBlastdown', []);

module.controller('dataController', ['$scope', 'RallyDataService', 'RealtimeService', function($scope, RallyDataService, RealtimeService) {
    $scope.organizedData = {};
    $scope.RallyDataService = RallyDataService;

    RallyDataService.getData(true, function(data) {
        $scope.organizedData = data;
        $scope.$apply();
        // Start the game
        game.onload();
    });

    $scope.logItems = [{
        date: Ext.Date.format(new Date(), "m-d H:i"),
        note: "Space Invaders Blast Down Initialized"
    }];

    $scope.addLogItem = function(logItem, date) {
        var dateString = date || Ext.Date.format(new Date(), "m-d H:i");
        $scope.logItems.unshift({
            date: dateString,
            note: logItem
        });
        $scope.$apply();
    };
}]);
