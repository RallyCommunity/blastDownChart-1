module = angular.module('angularBlastdown', []);

module.controller('dataController', ['$scope', 'RealtimeService', 'LookbackService', function($scope, RealtimeService, LookbackService) {
    $scope.eventHandler = new GameEventHandler();

    $scope.selectedTypes = [];

    $scope.filters = {};

    $scope.sort = function(item) {
        return new Date(item.date);
    };

    $scope.setSelectedOption = function(option) {
        $scope.filters.class = option;
    };

    $scope.logItems = [];

    /*

    {
        date: Ext.Date.format(new Date(), "m-d H:i"),
        note: "Space Invaders Blast Down Initialized",
        class: 'init'
    }

    */

    $scope.realtimeStatus = 'Waiting';

    $scope.connectRealtime = function(uuids) {
        // connect to realtime, which now just fires events
        $scope.realtimeStatus = 'Connecting'; // listen for events to change to connected
        RealtimeService.connect(uuids);
    };

    $scope.updateStatus = function(status) {
        $scope.realtimeStatus = status;
    }

    game.onload();

    $scope.addLogItem = function(logItem, date, className) {
        var dateString;
        if (!date) {
            dateString = moment().format("MM-MM-DD-YY HH:mm");
        } else if (date instanceof Date) {
            dateString = moment(date).format("MM-DD-YY HH:mm");
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
            $scope.scoreboard[team].points += points || 0;

        } else {
            var newPoints = points || 0;
            $scope.scoreboard[team] = {
                points: newPoints
            }
        }
    };
}]);
