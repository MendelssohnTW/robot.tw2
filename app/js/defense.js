define("robotTW2/defense", [], function(){
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
		name			: "defense"
	}

})
,
define("robotTW2/defense/ui", [
	"robotTW2/defense",
	"robotTW2/builderWindow",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/data_alert",
	"helper/time",
	"robotTW2/conf"
	], function(
			defense,
			builderWindow,
			services,
			providers,
			data_alert,
			helper,
			conf
	){
	var $window
	, build = function(callback) {
		var hotkey = conf.HOTKEY.DEFENSE;
		var templateName = "defense";
		$window = new builderWindow(hotkey, templateName, callback)
		return $window
	}
	, injectScope = function(){

	}

	Object.setPrototypeOf(defense, {
		build : function(){
			build(injectScope)
		}
	})

})