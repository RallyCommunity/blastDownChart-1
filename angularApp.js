module = angular.module('angularBlastdown', []);

module.controller('dataController', ['$scope', 'RallyDataService', function($scope, RallyDataService) {
    $scope.organizedData = {};

    RallyDataService.getData(function(data) {
        $scope.organizedData = data;
        $scope.$apply();

        // Start the game
        game.onload();
    });
}]);
