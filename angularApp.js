module = angular.module('angularBlastdown', []);

module.controller('dataController', ['$scope', 'RallyDataService', 'RealtimeService', 'LookbackService', function($scope, RallyDataService, RealtimeService, LookbackService) {
    $scope.organizedData = {};
    $scope.RallyDataService = RallyDataService;

    $scope.eventHandler = new GameEventHandler();

/*
    RallyDataService.getData(true, function(data) {
        $scope.organizedData = data;
        $scope.$apply();
        // Start the game
        game.onload();
    });
*/
    $scope.selectedTypes = [];

    $scope.filters = {};

    $scope.setSelectedOption = function(option) {
        $scope.filters.class = option;
    };

    $scope.logItems = [{
        date: Ext.Date.format(new Date(), "m-d H:i"),
        note: "Space Invaders Blast Down Initialized",
        class: 'init'
    }];

    $scope.connectRealtime = function(uuids) {
        // connect to realtime, which now just fires events
        RealtimeService.connect(uuids);
    };

    LookbackService.connect(GLOBAL.ObjectID);
    game.onload();

    $scope.addLogItem = function(logItem, date, className) {
        var dateString ;
        if (!date) {
            dateString = Ext.Date.format(new Date(), "m-d H:i");
        } else if (date instanceof Date) {
            dateString = Ext.Date.format(date, "m-d H:i");
        } else {
            dateString = date;
        }
        $scope.logItems.unshift({
            date: dateString,
            note: logItem,
            class: className
        });
        $scope.$apply();
    };
}]);
