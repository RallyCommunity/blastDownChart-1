module = angular.module('angularBlastdown', []);

module.controller('dataController', ['$scope', 'RallyDataService', 'RealtimeService', function($scope, RallyDataService, RealtimeService) {
    $scope.organizedData = {};

    RallyDataService.getData(function(data) {
        $scope.organizedData = data;
        $scope.$apply();
        // Start the game
        game.onload();
    });
}]);
