module = angular.module('angularBlastdown', []);

module.controller('dataController', ['$scope', 'RealtimeService', 'LookbackService', function($scope, RealtimeService, LookbackService) {
    $scope.eventHandler = new GameEventHandler();

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

    game.onload();

    $scope.addLogItem = function(logItem, date, className) {
        var dateString;
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

    $scope.scoreboard = {};


    $scope.addPoints = function(team, points) {
        if ($scope.scoreboard[team]) {
            $scope.scoreboard[team].points += points;

        } else {
            var newPoints = points || 0;
            $scope.scoreboard[team] = {
                points: newPoints
            }
        }
    };
}]);
