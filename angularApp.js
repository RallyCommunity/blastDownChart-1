module = angular.module('angularBlastdown', []);

module.controller('dataController', ['$scope', 'RallyDataService', 'RealtimeService', function($scope, RallyDataService, RealtimeService) {
    $scope.organizedData = {};
    $scope.redraw = false;
    $scope.$watch('organizedData', function() {
        if ($scope.redraw) {
            console.log('redrawing');
        } else {
            console.log('not drawn yet');
        }
    });

    $scope.RallyDataService = RallyDataService;

    RallyDataService.getData(true, function(data) {
        $scope.organizedData = data;
        $scope.$apply();
        // Start the game
        game.onload();
        $scope.redraw = true; // now when it changes the game will recognize it
    });

    $scope.logItems = [{
        date: new Date(),
        note: "Space Invaders Initialized",
        style: "italic" // TODO use this
    }];

    $scope.addLogItem = function(logItem, style) {
        $scope.logItems.push({
            date: new Date(),
            note: logItem,
            style: style
        });
        $scope.$apply();
    };
}]);
