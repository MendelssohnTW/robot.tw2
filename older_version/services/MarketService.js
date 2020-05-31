define("robotTW2/CommandMarket", [
	], function(){
	return {}
})

define("robotTW2/services/MarketService", [
	"robotTW2",
	"robotTW2/time",
	"helper/time",
	"robotTW2/conf",
	"robotTW2/databases/data_villages",
	"robotTW2/databases/data_market",
	"robotTW2/CommandMarket"
	], function(
			robotTW2,
			time,
			helper,
			conf,
			data_villages,
			data_market,
			commandMarket
	){
	return (function MarketService(
			$rootScope,
			socketService,
			providers,
			modelDataService,
			$timeout,
			commandQueue,
			ready,
			loadScript,
			loadController
	) {

		var isInitialized = !1
		, isRunning = !1
		, interval_market = undefined
		, listener_market = undefined
		, interval_handler = undefined
		, list = []
		, setList = function(callback){
			list.push(conf.INTERVAL.MARKET)
			data_market.interval < conf.MIN_INTERVAL ? list.push(conf.MIN_INTERVAL) : list.push(data_market.interval)
					var t = Math.min.apply(null, list)
					data_market.interval = t
					data_market.complete = time.convertedTime() + t
					list = [];
			data_market.set();
			$rootScope.$broadcast(providers.eventTypeProvider.INTERVAL_CHANGE_MARKET)
			if(callback && typeof(callback) == "function"){callback(t)}
		}
		, wait = function(){
			setList(function(tm){
				if(!interval_market){
					interval_market = $timeout(function(){
						
					}, tm)
				} else {
					$timeout.cancel(interval_market);
					interval_market = undefined;
					interval_market = $timeout(function(){
						
					}, tm)
				}
			});
		}
		, init = function (){
			isInitialized = !0
			start();
		}
		, start = function (){
			if(isRunning){return}
			ready(function(){
				
			}, ["all_villages_ready"])
		}
		, stop = function (){
			typeof(listener_market) == "function" ? listener_market(): null;
			interval_handler = undefined;
			isRunning = !1
			$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"MARKET"})
			$timeout.cancel(interval_market);
			interval_market = undefined;
		}
		return	{
			init						: init,
			start						: start,
			stop 						: stop,
			isRunning					: function() {
				return isRunning
			},
			isInitialized				: function(){
				return isInitialized
			},
			version						: conf.VERSION.MARKET,
			name						: "market"
		}

	})(
			robotTW2.services.$rootScope,
			robotTW2.services.socketService,
			robotTW2.providers,
			robotTW2.services.modelDataService,
			robotTW2.services.$timeout,
			robotTW2.commandQueue,
			robotTW2.ready,
			robotTW2.loadScript,
			robotTW2.loadController
	)
})
