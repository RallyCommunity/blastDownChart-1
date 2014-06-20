module = angular.module('angularBlastdown', []);


module.controller('dataController', ['$scope', 'RallyDataService', function($scope, RallyDataService) {
    $scope.itemHierarchy = GLOBAL.itemHierarchy;
    console.log('NAME: ', GLOBAL.initiative.raw.formattedID);
    $scope.initiativeName = GLOBAL.initiative.raw.FormattedID;
    $scope.organizedData = {
        initiative: {},
        features: []
    };
    $scope.$watch('organizedData.features', function () {
        console.log('data updated');
        console.log($scope.organizedData);
    });
    RallyDataService.getData(function(data) {
        console.log('data returned', data);
        $scope.organizedData.features = _.toArray(data.features);
        $scope.$apply();

        game.setupShips(data);
    });
}]);
