module = angular.module('angularBlastdown', []);

module.controller('dataController', ['$scope', 'RealtimeService', 'LookbackService', function($scope, RealtimeService, LookbackService) {
    $scope.eventHandler = new GameEventHandler();

    $scope.selectedTypes = [];


    game.angularScope = $scope;

    $scope.filters = {};

    $scope.sort = function(item) {
        return new Date(item.date);
    };

    $scope.setSelectedOption = function(option) {
        $scope.filters.applyClass = option;
    };

    $scope.logItems = [{
        date: moment().format("MM-MM-DD-YY HH:mm"),
        note: "Blast Down Initialized",
        applyClass: 'init'
    }];

    $scope.realtimeStatus = 'Waiting';

    $scope.connectRealtime = function(uuids) {
        // connect to realtime, which now just fires events
        $scope.realtimeStatus = 'Connecting'; // listen for events to change to connected
        RealtimeService.connect(uuids);
    };

    $scope.disconnectRealtime = function() {
        RealtimeService.disconnect();
        $scope.realtimeStatus = 'Disconnected';
        $scope.$digest();
    };

    $scope.updateStatus = function(status) {
        $scope.realtimeStatus = status;
        $scope.$digest();
    };

    game.onload();

    $scope.addLogItem = function(logItem, date, applyClass) {
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
            applyClass: applyClass
        });
        $scope.$digest();
    };

    $scope.scoreboard = {};


    $scope.addPoints = function(team, points) {
        if ($scope.scoreboard[team]) {
            $scope.scoreboard[team].completed += 1;
            $scope.scoreboard[team].points += points || 0;
        } else {
            var newPoints = points || 0;
            $scope.scoreboard[team] = {
                points: newPoints,
                color: "#000000",
                completed: 1
            };
        }
        $scope.$digest();
    };

    $scope.addTeamColor = function(team, color) {
        if (!$scope.scoreboard[team]) {
            $scope.scoreboard[team] = {
                points: 0,
                color: color,
                completed: 0
            };
            $scope.$digest();
        }
    };

    $scope.getTeamColor = function(team) {
        if (team && $scope.scoreboard[team]) {
            return $scope.scoreboard[team].color;
        }
        return "white";
    };
}]);
