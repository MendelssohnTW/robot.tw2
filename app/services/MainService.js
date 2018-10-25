define("robotTW2/services/MainService", [
	"robotTW2"
	], function(
			robotTW2
	){
	return (function MainService() {
		var service = {};
		var data_main = robotTW2.databases.data_main
		var extensions = data_main.getExtensions();
		for (var extension in extensions) {
			var arFn = robotTW2.requestFn.get(extension.toLowerCase(), true);
			if(!arFn) {
				extensions[extension].activated = false;
				continue
			} else {
				var fn = arFn.fn;
				var params = arFn.params;
				extensions[extension].activated = true;
				robotTW2.requestFn.trigger(fn, params);
				if(extensions[extension].initialized && extensions[extension].auto_initialize){
					if(fn.isInitialized())
						return !1;	
//					robotTW2.requestFn.trigger(extensions[extension].name.toLowerCase(), params);
					if(typeof(fn.init) == "function"){fn.init()}
					if(typeof(fn.analytics) == "function"){fn.analytics()}
				}
			}
		}
		data_main.setExtensions(extensions);
		return service;
	})()
})