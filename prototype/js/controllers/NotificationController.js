define([
	'app.controllers'
	], 
	function (
			controllers
	) {
	"use strict";
	controllers.controller("NotificationController", [
		"$rootScope", 
		"$scope",
		"eventTypeProvider",
		function (
				$rootScope,
				$scope,
				eventTypeProvider
		) {
			
			var setNotification = function($event, msg){
				$scope.notification = msg;
				if(!$scope.$$phase) {
					$scope.$apply();
				};

				setTimeout(function(){
					$scope.notification = undefined;
					if(!$scope.$$phase) {
						$scope.$apply();
					};

				}, 3000)
			};
			
			$rootScope.$on(eventTypeProvider.NOTIFICATION, setNotification);

		}]);
});

