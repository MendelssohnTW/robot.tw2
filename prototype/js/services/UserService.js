define([
	"app.services"
	], function (
			services
	) {	
	services.factory("UserService", [
		"SocketService", 
		"routeProvider",
		"conf",
		function (
				SocketService, 
				routeProvider,
				conf
		){
			var service = {},
			getByUsername = function getByUsername(nickname, callback) {
				SocketService.emit(routeProvider.SEARCH_NICKNAME, {"nickname":nickname, "world_id":conf.USER.world_id}, function(msg){
					if (msg.type == routeProvider.SEARCH_NICKNAME.type){
						if (msg.data.located){
							callback(msg.data.located);
						} else {
							callback(false);
						}
					};
				});
			},
			create = function create(user, callback) {
				SocketService.emit(routeProvider.REGISTER, {"user":user}, function(msg){
					if (msg.type == routeProvider.REGISTER.type){
						callback(msg.data.registerResp);
					};
				});
			};

			service.getByUsername = getByUsername;
			service.create = create;

			return service;

		}]);
});