define([
	"app.services"
	], function (
			services
	) {
	services.factory("SocketService", [
		'$rootScope',
		"routeProvider",
		"socket",
		"conf",
		function (
				$rootScope,
				routeProvider,
				socket,
				conf
				){
		var service = {},
		count = 0,
		emit = function (routeProvider, data, opt_callback){
			var cal = function cal(connected){
				count++;
				if (connected && routeProvider != undefined){
					socket.sendMsg(routeProvider.type, data, conf.USER.role, opt_callback);
					return;

				} else {
					if (count < 10){
						socket.connect(function(connected){cal(connected)});
						return;
					}else {
						count = 0;
						return;
					}
				}

			};
			socket.connect(function(connected){cal(connected)});

		}
//		, emitNoBR = function (routeProvider, data, opt_callback){
//
//			var cal = function cal(connected){
//				count++;
//				if (connected && routeProvider != undefined){
//					socket.sendMsg(routeProvider.type, "br", data, conf.USER.role, opt_callback);
//					return;
//
//				} else {
//					if (count < 10){
//						socket.connect(function(connected){cal(connected)});
//						return;
//					}else {
//						count = 0;
//						return;
//					}
//				}
//
//			};
//			socket.connect(function(connected){cal(connected)});
//
//		};

		service.emit 		= emit;
//		service.emitNoBR 	= emitNoBR;

		return service;
	}])

});