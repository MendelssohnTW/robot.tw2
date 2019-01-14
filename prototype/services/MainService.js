define("robotTW2/services/MainService", [
	"robotTW2",
	"robotTW2/conf",
	"robotTW2/socketSend",
	], function(
			robotTW2,
			conf,
			socketSend
	){
	return (function MainService($rootScope, requestFn, secondVillageService) {
		$rootScope.local = "";
		var count_ready = true;
		if(count_ready){
			count_ready = false;
			socketSend.emit(robotTW2.providers.routeProvider.SEARCH_LOCAL, {}, function(msg){
				if (msg.type == robotTW2.providers.routeProvider.SEARCH_LOCAL.type){
					$rootScope.local = msg.local;
					if (!$rootScope.$$phase) $rootScope.$apply();
				}
			})
		}
		var service = {};
		return service.initExtensions = function(){
			var extensions = $rootScope.data_main.getExtensions();
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
			$rootScope.data_main.setExtensions(extensions);
			return extensions
		}
		, service
	})(robotTW2.services.$rootScope, robotTW2.requestFn, robotTW2.services.secondVillageService)
})