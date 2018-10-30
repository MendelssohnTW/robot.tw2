define("robotTW2/services/SpyService", [
	"robotTW2",
	"helper/time",
	"robotTW2/conf"
	], function(
			robotTW2,
			helper,
			conf
	){
	return (function SpyService() {

		var isInitialized = !1
		, isRunning = !1
		, interval_spy = null
		, listener_spy = undefined
		, list = []
		, data_spy = robotTW2.databases.data_spy
		, data_villages = robotTW2.databases.data_villages
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
			var lista_aldeias = data_villages.getVillages();
			var l = [];
			Object.keys(lista_aldeias).forEach(function(id){
				var selectedVillage = robotTW2.services.modelDataService.getSelectedCharacter().getVillage(id);
				if(selectedVillage && selectedVillage.data.buildings) {
					var scoutingInfo = selectedVillage.scoutingInfo;
					var spies = scoutingInfo.spies;
					var prices = scoutingInfo.getData().spy_prices;
					var maxSpies = getMaxSpies(selectedVillage.data.buildings.tavern.researches, selectedVillage.data.buildings.tavern.level);
					var count = 0;
					for (i = 0; i < maxSpies; i++ ){
						var spy = spies[i];
						var resources = !Object.keys(selectedVillage.getResources().getComputed()).map(
								function(elem){
									if(prices[i][elem] > selectedVillage.getResources().getComputed()[elem].currentStock) {
										return false
									} else {
										return true
									}
								}
						).some(elem => elem = false)
						if(spy.recruitingInProgress){
							l.push(spy.timeCompleted);
						}
						if (spy.type == 0 && !spy.active && resources) {
							robotTW2.services.socketService.emit(robotTW2.providers.routeProvider.SCOUTING_RECRUIT, {
								'village_id'	: selectedVillage.getId(),
								'slot'			: spy.id
							});
						};
					}
					var t = helper.gameTime() - Math.min.apply(null, l)
					t < 3000 ? t = 3000 : t;
					data_spy.setTimeCicle(t)
					data_spy.setTimeComplete(helper.gameTime() + t)
				}
				wait();
			})
		}
		, setList = function(callback){
			list.push(conf.INTERVAL.SPY)
			list.push(data_spy.getTimeCicle())
			var t = Math.min.apply(null, list)
			t < 3000 ? t = 3000 : t;
			data_spy.setTimeCicle(t)
			data_spy.setTimeComplete(helper.gameTime() + t)
			list = [];
			robotTW2.services.$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.INTERVAL_CHANGE_SPY)
			if(callback && typeof(callback) == "function"){callback(t)}
		}
		, wait = function(){
			setList(function(tm){
				if(!interval_spy){
					interval_spy = robotTW2.services.$timeout(function(){recruit_spy()}, tm)
					interval_spy = robotTW2.services.$timeout(recruit_spy, data_spy.interval)
				} else {
					robotTW2.services.$timeout.cancel(interval_spy);
					interval_spy = undefined;
					interval_spy = robotTW2.services.$timeout(function(){recruit_spy()}, tm)
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
				isRunning = !0;
				!listener_spy ? listener_spy = robotTW2.services.$rootScope.$on(robotTW2.providers.eventTypeProvider.SCOUTING_SPY_PRODUCED, recruit_spy) : listener_spy;
				robotTW2.services.$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"SPY"})
				recruit_spy();
			}, ["all_villages_ready"])
		}
		, stop = function (){
			typeof(listener_spy) == "function" ? listener_spy(): null;
			listener_spy = undefined;
			isRunning = !1
			robotTW2.services.$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"SPY"})
			robotTW2.services.$timeout.cancel(interval_spy);
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

	})()
})