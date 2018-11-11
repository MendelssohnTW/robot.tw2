define("robotTW2/services/SpyService", [
	"robotTW2",
	"helper/time",
	"robotTW2/conf",
	"conf/spyTypes",
	], function(
			robotTW2,
			helper,
			conf,
			SPY_TYPES
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
			Object.keys($rootScope.data_villages.villages).forEach(function(id){
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
									if(elem != "food"){
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
						if(spy.type == SPY_TYPES.RECRUITING){
							list.push(spy.timeCompleted);
						}
						if ((spy.type === SPY_TYPES.NO_SPY) && spy.active && spy.affordable) {
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
			list.push($rootScope.data_spy.interval)
			var t = Math.min.apply(null, list)
			t < 3000 ? t = 3000 : t;
			$rootScope.data_spy.interval = t
			$rootScope.data_spy.completed_at = helper.gameTime() + t
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
			version			: "1.0.0",
			name			: "spy"
		}

	})(
			robotTW2.services.$rootScope,
			robotTW2.socketService,
			robotTW2.providers,
			robotTW2.services.modelDataService,
			robotTW2.services.$timeout
	)
})