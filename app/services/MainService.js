define("robotTW2/services/MainService", [
	"robotTW2",
	"robotTW2/conf",
	"robotTW2/databases/data_main",
	], function(
			robotTW2,
			conf,
			data_main
	){
	return (function MainService($rootScope, requestFn, secondVillageService, modelDataService, providers) {
		var timeout = undefined;
		
		function onError (){
			if(timeout && timeout.$$state && timeout.$$state.status == 0){
				robotTW2.services.$timeout.cancel(timeout)
			}
			location.reload()
		}
		
		function onErrorTimeout (){
			if(timeout && timeout.$$state && timeout.$$state.status == 0){
				robotTW2.services.$timeout.cancel(timeout)
			}
			timeout = robotTW2.services.$timeout(function(){
				onError()
			}, 30000)
		}
		
		var service = {};
		return service.initExtensions = function(){
			
			var extensions = data_main.getExtensions();
			for (var extension in extensions) {
				var arFn = requestFn.get(extension.toLowerCase(), true);
				if(!arFn || (extension.toLowerCase() == "secondvillage" && !secondVillageService.isFeatureActive())
				) {
					extensions[extension].activated = false;
					continue
				} else {
					var fn = arFn.fn;
					extensions[extension].hotkey = conf.HOTKEY[extension].toUpperCase();
					extensions[extension].activated = true;

					if(extensions[extension].auto_start){
						extensions[extension].init_initialized = true;
						if(fn.isInitialized())
							return !1;
						if(typeof(fn.init) == "function"){fn.init()}
						if(typeof(fn.analytics) == "function"){fn.analytics()}
					}
				}
			}
			data_main.setExtensions(extensions);
			
			$rootScope.$on(providers.eventTypeProvider.SOCKET_ERROR,				onErrorTimeout);
			$rootScope.$on(providers.eventTypeProvider.SOCKET_RECONNECT_ERROR,		onError);
			$rootScope.$on(providers.eventTypeProvider.SOCKET_RECONNECT_FAILED,		onError);
			
			return extensions
		}
		, service.getSelects = function(obj, selected){
			if(!obj) {return}
			
			var select = {
				"availableOptions" : obj,
				"selectedOption" : selected ? obj.find(f=>f.value==selected.value) : obj[0]
			}
			
			return select
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