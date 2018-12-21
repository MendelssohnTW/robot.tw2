define([
	"app.services"
	], function (
			services
	) {
	services.factory("SendMsg", [
		"$rootScope",
		"ModalService",
		"eventTypeProvider",
		function (
				$rootScope,
				ModalService,
				eventTypeProvider
		){
			return function(msg){
				$rootScope.$broadcast(eventTypeProvider.NOTIFICATION, msg);
			}
		}])
});