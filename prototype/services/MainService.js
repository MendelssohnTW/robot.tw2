define("robotTW2/services/MainService", [
	"robotTW2",
	"robotTW2/conf",
	"robotTW2/socketSend",
	"robotTW2/databases/data_main",
	], function(
			robotTW2,
			conf,
			socketSend,
			data_main
	){
	return (function MainService($rootScope, requestFn, secondVillageService, modelDataService, providers) {

		var connectionAttemptThreshold	= 5,
		connectionAttempts			= 0;
		
		function onError (){
			location.reload()
		}
		
		var service = {};
		return service.initExtensions = function(){
			
//			var interval_reload = setInterval(function(){
//				location.reload()	
//			}, 3 * 60 * 60 * 1000)
			
			var extensions = data_main.getExtensions();
			for (var extension in extensions) {
				var arFn = requestFn.get(extension.toLowerCase(), true);
				if(!arFn 
						|| (extension.toLowerCase() == "secondvillage" && !secondVillageService.isFeatureActive())
						|| (extensions[extension] == "data" && (!$rootScope.data_data || !$rootScope.data_data.possible))
				) {
					extensions[extension].activated = false;
					continue
				} else {
					var fn = arFn.fn;
					extensions[extension].hotkey = conf.HOTKEY[extension].toUpperCase();
					extensions[extension].activated = true;

					if(extensions[extension].auto_initialize){
						extensions[extension].initialized = true;
						if(fn.isInitialized())
							return !1;
						if(typeof(fn.init) == "function"){fn.init()}
						if(typeof(fn.analytics) == "function"){fn.analytics()}
					} else {
						extensions[extension].auto_initialize = false
					}
				}
			}
			data_main.setExtensions(extensions);
			
			$rootScope.$on(eventTypeProvider.SOCKET_RECONNECTING,			onSocketReconnecting);
			$rootScope.$on(eventTypeProvider.SOCKET_RECONNECT_ERROR,		onError);
			$rootScope.$on(eventTypeProvider.SOCKET_RECONNECT_FAILED,		onError);
			$rootScope.$on(providers.eventTypeProvider.SOCKET_ERROR, 		onError);
			
			return extensions
		}
		, service
	})(
			robotTW2.services.$rootScope, 
			robotTW2.requestFn, 
			robotTW2.services.secondVillageService,
			robotTW2.services.modelDataService,
			robotTW2.providers
			)
})