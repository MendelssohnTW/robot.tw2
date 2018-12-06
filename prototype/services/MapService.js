define("robotTW2/services/MapService", [
	"robotTW2",
	"cdn",
	"conf/conf"
	], function(
			robotTW2,
			cdn,
			conf_conf
	){
	return (function MapService(
			$rootScope,
			socketService,
			providers,
			modelDataService,
			$timeout,
			ready
	) {
		var isInitialized = !1
		, isRunning = !1
		, villageSelected
		
		, init = function (){
			isInitialized = !0
			start();
		}
		, start = function (){
			if(isRunning){return}
			ready(function(){
				isRunning = !0;
				$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"MAP"})
				
			}, ["all_villages_ready"])
		}
		, stop = function (){
			isRunning = !1;
			$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"MAP"})
		}
		return	{
			init			: init,
			start 			: start,
			stop 			: stop,
			isRunning		: function() {
				return isRunning
			},
			isInitialized	: function(){
				return isInitialized
			},
			version			: "1.0.0",
			name			: "map"
		}
	})(
			robotTW2.services.$rootScope,
			robotTW2.services.socketService,
			robotTW2.providers,
			robotTW2.services.modelDataService,
			robotTW2.services.$timeout,
			robotTW2.ready
	)
})