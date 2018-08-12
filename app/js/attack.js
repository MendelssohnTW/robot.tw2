define("robotTW2/attack", [], function(){
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
		name			: "attack"
	}

})
,
define("robotTW2/attack/ui", [
	"robotTW2/attack",
	"robotTW2/builderWindow",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/data_alert",
	"helper/time",
	"robotTW2/conf"
	], function(
			attack,
			builderWindow,
			services,
			providers,
			data_alert,
			helper,
			conf
	){
	var $window
	, build = function(callback) {
		var hotkey = conf.HOTKEY.ATTACK;
		var templateName = "attack";
		$window = new builderWindow(hotkey, templateName, callback)
		return $window
	}
	, injectScope = function(){

	}

	Object.setPrototypeOf(attack, {
		build : function(){
			build(injectScope)
		}
	})

})
