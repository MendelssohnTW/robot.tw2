define("robotTW2/services/SpyService", [
	"robotTW2",
	"robotTW2/version",
	"robotTW2/time",
	"robotTW2/conf",
	"conf/spyTypes",
	"robotTW2/databases/data_villages",
	], function(
			robotTW2,
			version,
			time,
			conf,
			SPY_TYPES,
			data_villages
	){
	return (function SpyService(
			$rootScope,
			socketService,
			providers,
			modelDataService,
			$timeout
	) {

		var isInitialized = !1
		, isRunning = !1
		, interval_spy = null
		, listener_spy = undefined
		, list = []
		, counterMeasureTypes = {
				CAMOUFLAGE: "camouflage",
				DUMMIES: "dummies",
				EXCHANGE: "exchange",
				SWITCH_WEAPONS: "switch_weapons"
		}
		, getMaxSpies = function(researches, level){
			var a, b, c = {}, d;
			for (a in researches)
				for (b in counterMeasureTypes)
					counterMeasureTypes[b] === a && (c[a] = researches[a]);

			d = Object.keys(c).map(function(key, index, array){
				if (c[key].required_level <= level) {
					return c[key]
				} else {
					return
				}
			}).filter(f => f != undefined);

			return level > 0 ? Object.keys(d).length + 1 : 0;
		}
		, recruit_spy = function (){
			Object.keys(data_villages.villages).forEach(function(id){
				var selectedVillage = modelDataService.getSelectedCharacter().getVillage(id);
				if(selectedVillage && selectedVillage.data.buildings) {
					var scoutingInfo = selectedVillage.scoutingInfo;
					var spies = scoutingInfo.spies;
					var prices = scoutingInfo.getData().spy_prices;
					var maxSpies = getMaxSpies(selectedVillage.data.buildings.tavern.researches, selectedVillage.data.buildings.tavern.level);
					var count = 0;
					for (i = 0; i < maxSpies; i++ ){
						var spy = spies[i];
						spy.affordable = !Object.keys(selectedVillage.getResources().getComputed()).map(
								function(elem){
									if(["wood", "clay", "iron"].some(f=> f== elem)){
										if(selectedVillage.getResources().getComputed()[elem].currentStock > prices[i][elem]) {
											return true
										} else {
											return false
										}
									} else {
										return undefined;
									}
								}
						).filter(elem => elem != undefined).some(elem => elem == false)
						if(spy.type == SPY_TYPES.RECRUITING && spy.timeCompleted != null){
							list.push(spy.timeCompleted);
						}
						if ((spy.type === SPY_TYPES.NO_SPY) && spy.affordable) {
							socketService.emit(providers.routeProvider.SCOUTING_RECRUIT, {
								'village_id'	: selectedVillage.getId(),
								'slot'			: spy.id
							});
						};
					}

				}

			})
			wait();
		}
		, setList = function(callback){
			list.push(conf.INTERVAL.SPY)
			$rootScope.data_spy.interval < conf.MIN_INTERVAL ? list.push(conf.MIN_INTERVAL) : list.push($rootScope.data_spy.interval)
			var t = Math.min.apply(null, list)
			$rootScope.data_spy.interval = t
			$rootScope.data_spy.complete = time.convertedTime() + t
			list = [];
			$rootScope.$broadcast(providers.eventTypeProvider.INTERVAL_CHANGE_SPY)
			if(callback && typeof(callback) == "function"){callback(t)}
		}
		, wait = function(){
			setList(function(tm){
				if(!interval_spy){
					interval_spy = $timeout(function(){recruit_spy()}, tm)
				} else {
					$timeout.cancel(interval_spy);
					interval_spy = undefined;
					interval_spy = $timeout(function(){recruit_spy()}, tm)
				}
			});
		}
		, init = function (){
			isInitialized = !0
			start();
		}
		, start = function (){
			if(isRunning){return}
			robotTW2.ready(function(){
				$rootScope.data_spy.interval = conf.INTERVAL.SPY;
				isRunning = !0;
				!listener_spy ? listener_spy = $rootScope.$on(providers.eventTypeProvider.SCOUTING_SPY_PRODUCED, recruit_spy) : listener_spy;
				$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"SPY"})
				recruit_spy();
			}, ["all_villages_ready"])
		}
		, stop = function (){
			typeof(listener_spy) == "function" ? listener_spy(): null;
			listener_spy = undefined;
			isRunning = !1
			$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"SPY"})
			$timeout.cancel(interval_spy);
			interval_spy = undefined;
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
			version			: version.spy,
			name			: "spy"
		}

	})(
			robotTW2.services.$rootScope,
			robotTW2.services.socketService,
			robotTW2.providers,
			robotTW2.services.modelDataService,
			robotTW2.services.$timeout
	)
})
