define("robotTW2/spy", [], function(){
	var isInitialized = !1
	, isRunning = !1
	, init = function (){

	}
	, start = function (){

	}
	, stop = function (){

	}
	return	{
		init			: init,
		start			: start,
		stop 			: stop,
		isRunning		: function() {
			return isRunning
		},
		isInitialized	: function(){
			return isInitialized
		},
		version			: "1.0.0",
		name			: "spy"
	}

})
,
define("robotTW2/spy/ui", [
	"robotTW2/spy",
	"robotTW2/builderWindow",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/data_alert",
	"helper/time",
	"robotTW2/conf"
	], function(
			spy,
			builderWindow,
			services,
			providers,
			data_alert,
			helper,
			conf
	){
	var $window
	, build = function(callback) {
		var hotkey = conf.HOTKEY.SPY;
		var templateName = "spy";
		$window = new builderWindow(hotkey, templateName, callback)
		return $window
	}
	, injectScope = function(){

	}

	Object.setPrototypeOf(spy, {
		build : function(){
			build(injectScope)
		}
	})

})