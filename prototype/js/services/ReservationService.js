define([
	"app.services"
	], function (
			services
	) {	
	services.factory("ReservationService", [
		"$rootScope",
		"eventTypeProvider",
		"routeProvider",
		"SocketService",
		"conf",
		function (
				$rootScope,
				eventTypeProvider,
				routeProvider,
				SocketService,
				conf
		){
			var service = {},
			c = !1
			,
			isInitialized = function() {
				return c
			};

			service.isInitialized 				= isInitialized;
			service.reservations_tribe 			= undefined;
			service.reservations 				= undefined;
			service.villages	 				= undefined;

			return service;

		}]);
});