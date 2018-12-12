define("robotTW2/services/MainService", [
	"robotTW2",
	"robotTW2/conf",
	], function(
			robotTW2,
			conf
	){
	return (function MainService($rootScope, requestFn) {
		var service = {};
		return service.initExtensions = function(){
			var extensions = $rootScope.data_main.getExtensions();
			for (var extension in extensions) {
				var arFn = requestFn.get(extension.toLowerCase(), true);
				if(!arFn) {
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
						if(!$rootScope.data_data.possible && extensions[extension] == "data")
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
	})(robotTW2.services.$rootScope, robotTW2.requestFn)
})