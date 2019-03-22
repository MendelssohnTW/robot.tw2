define("robotTW2/services/LogService", [
	"robotTW2",
	"robotTW2/time",
	"robotTW2/conf",
	"$rootScope",
	"socketService",
	"eventTypeProvider",
	"modelDataService",
	"$timeout",
	"ready"
	], function(
			robotTW2,
			time,
			conf,
			$rootScope,
			socketService,
			eventTypeProvider,
			modelDataService,
			$timeout,
			ready
	){
	return (function LogService() {

		var isInitialized = !1
		, isRunning = !1
		, init = function (){
			isInitialized = !0
			start();
		}
		, start = function (){
			if(isRunning){return}
			ready(function(){
				isRunning = !0;
			}, ["all_villages_ready"])
		}
		, stop = function (){
			isRunning = !1
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
			version			: conf.VERSION.LOG,
			name			: "log"
		}

	})()
})
