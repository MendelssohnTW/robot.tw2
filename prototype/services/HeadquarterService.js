define("robotTW2/services/HeadquarterService", [
	"robotTW2",
	"helper/time",
	"robotTW2/conf",
	], function(
			robotTW2,
			helper,
			conf
	){
	return (function HeadquarterService(
			$rootScope,
			socketService,
			providers,
			modelDataService,
			$timeout,
			ready
	) {

		var o
		, interval_builder
		, q
		, character
		, s
		, isInitialized = !1
		, isRunning = !1
		, isPaused = !1
		, list = []
		, x = {}
		, y = {}
		, reqD = 0
		, respD = 0	
		, data_villages = robotTW2.databases.data_villages
		, villages = data_villages.getVillages()
		, data_headquarter = robotTW2.databases.data_headquarter 
		, listener_building_level_change = undefined
		, listener_resume = undefined
		, checkBuildingOrderLimit = function(vill) {
			var buildingLevels = vill.buildinglevels
			, buildingLimit = vill.buildinglimit
			, builds = [];

			buildingLevels.map(
					function(e){
						buildingLimit.map(
								function(d){
									if(Object.keys(e)[0] == Object.keys(d)[0] && Object.values(e)[0] < Object.values(d)[0]){
										builds.push({[Object.keys(e)[0]] : Object.values(e)[0]})
									}
								}
						)
					}
			)

			return builds

		}
		, getResources = function (village_id, callback) { 
			return robotTW2.services.socketService.emit(robotTW2.providers.routeProvider.VILLAGE_GET_VILLAGE, {village_id: village_id}, function (data) {
				if(!data){callback(null)}
				if(typeof(callback) == "function") {callback(data.resources)} else {return}
			})
		}
		, isUpgradeable = function(village, build, callback) {
			var buildingData = village.getBuildingData().getDataForBuilding(build)
			, nextLevelCosts = buildingData.nextLevelCosts
			, not_enough_resources = false
			, firstQueue = village.getBuildingQueue().getQueue()[0];

			if(firstQueue && firstQueue.canBeFinishedForFree){
				robotTW2.services.premiumActionService.instantBuild(firstQueue, locationTypes.HEADQUARTER, true);
				callback(!1, "instant")
			} else {
				getResources(village.data.villageId, function(resources){
					Object.keys(resources).forEach(function(resource_type){
						if(resources[resource_type] + data_headquarter.get().RESERVA[resource_type.toUpperCase()] < nextLevelCosts[resource_type]){
							not_enough_resources = true;
						}
					})

					if(not_enough_resources){
						callback(!1, {[village.data.name] : "not_enough_resources"})
					} else{

						if(buildingData.upgradeability === upgradeabilityStates.POSSIBLE) {

							robotTW2.services.socketService.emit(robotTW2.providers.routeProvider.VILLAGE_UPGRADE_BUILDING, {
								building: build,
								village_id: village.getId(),
								location: locationTypes.MASS_SCREEN,
								premium: !1
							}, function(data, b) {
								if(data.code == "Route/notPublic") {
									callback(!1)
								} else {
									callback(!0, data)	
								}
							}) 
						} else {
							callback(!1, {[village.data.name] : buildingData.upgradeability})
						}
					}
				})
			}
		}
		, canBeFinishedForFree = function(village){
			if (village.getBuildingQueue()){
				var queue = village.getBuildingQueue().getQueue()[0];
				var d = robotTW2.services.modelDataService.getWorldConfig().getFreeSecondsPerBuildingLevel() * village.getBuildingLevel("headquarter")
				return queue.finishedIn - d;
			} else {
				return data_headquarter.get().interval / 1e3;
			}
		}
		, getFinishedForFree = function (village){
			var lt = [];
			if(village.getBuildingQueue().getQueue().length > 0){
				var timer = Math.round(canBeFinishedForFree(village) * 1e3) + 5000;
				if (timer < data_headquarter.get().interval){
					timer < 0 ? timer = 0 : timer;
					lt.push(timer);
				}
			}
			var t = 3000;
			if(lt.length){
				t = Math.min.apply(null, lt);
			}
			return t;
		}
		, setList = function(callback){
			list.push(conf.INTERVAL.HEADQUARTER)
			list.push(data_headquarter.getTimeCicle())
			var t = Math.min.apply(null, list);
			data_headquarter.setTimeCicle(t)
			data_headquarter.setTimeComplete(helper.gameTime() + t)
			list = [];
			robotTW2.services.$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.INTERVAL_CHANGE_HEADQUARTER)
			if(callback && typeof(callback) == "function"){callback(t)}
		}
		, upgradeBuilding = function(village_id){
			reqD++
			robotTW2.services.$timeout(function(){
				respD++
				var village = character.getVillage(village_id);
				robotTW2.services.buildingService.compute(village)
				var buildingQueue = village.getBuildingQueue()
				, buildingData = village.getBuildingData()
				, levels = buildingData.getBuildingLevels()
				, buildingLevels = angular.copy(Object.keys(levels).map(function(key){return {[key] : levels[key]}}))
				, queues = village.buildingQueue.getQueue()
				, readyState = village.checkReadyState()
				, buildState = villages[village_id].EXECUTEBUILDINGORDER
				, buildAmounts = buildingQueue.getAmountJobs()
				, buildUnlockedSlots = buildingQueue.getUnlockedSlots()
				, firstQueue = queues[0];

				var premiumActionService = injector.get("premiumActionService");

				if(firstQueue && firstQueue.canBeFinishedForFree){
					premiumActionService.instantBuild(firstQueue, locationTypes.HEADQUARTER, true);
					return upgradeBuilding(village_id)

				}

				list.push(getFinishedForFree(village))
				setList();

				if (
						!(
								buildAmounts !== buildUnlockedSlots
								&& buildState
								&& buildAmounts < data_headquarter.get().RESERVA.SLOTS
								&& (readyState.buildingQueue || readyState.buildings) 
								&& (village.isInitialized() || robotTW2.services.villageService.initializeVillage(village))
						) 
				) {
					return;
				}

				villages[village_id].buildinglevels = buildingLevels;
				if (queues.length) {
					queues.forEach(
							function(queue) {
								villages[village_id].buildinglevels.map(function(value){value[queue.building]++})
							}
					)
				}

				villages[village_id].builds = checkBuildingOrderLimit(villages[village_id]);

				if(!villages[village_id].builds.length) {
					return;
				}

				var reBuilds = villages[village_id].BUILDINGORDER.map(function(key){
					return villages[village_id].builds.map(function(key){return Object.keys(key)[0]}).find(f=>f==Object.keys(key)[0])
				}).filter(f => f != undefined)
				, g = [];

				reBuilds.forEach(function(i){
					g.push(villages[village_id].builds.map(
							function(key){
								return Object.keys(key)[0] == i ? {[Object.keys(key)[0]] : Object.values(key)[0]} : undefined
							}
					)
					.filter(f => f != undefined)[0]
					)
				})

				var next = function() {
					if(g.length > 0 && isRunning){
						var build = g.shift();
						var buildLevel = Object.keys(build)[0]
						robotTW2.services.buildingService.compute(village)
						if(!(buildAmounts !== buildUnlockedSlots && buildAmounts < data_headquarter.get().RESERVA.SLOTS)) {
							next()
						} else {
							isUpgradeable(village, buildLevel, function(success, data) {
								if (success) {
									++buildAmounts;
								} else if(data == "instant"){
									g.unshift(build);
								}
								next()
							})
						}
					}
				}
				next()

				if(reqD == respD){
					reqD = 0;
					respD = 0;
					wait();
					return !0;
				}
			}, reqD * 3000)
		}
		, cicle_building = function($event, data){
			if (!isInitialized)
				return;
			character = robotTW2.services.modelDataService.getSelectedCharacter();
			if(isPaused){
				listener_resume = robotTW2.services.$rootScope.$on(robotTW2.providers.eventTypeProvider.RESUME_CHANGE_RECRUIT, function(){
					var data_resume = data;
					if(data_resume != undefined){
						cicle_building(null, data_resume)
					} else {
						cicle_building()
					}
					listener_resume()
					listener_resume = undefined;
					return
				})
			}

			if(data != undefined){
				robotTW2.services.$timeout(function() {
					isRunning = !0
					upgradeBuilding(data.village_id)
				}, 3e3)
			} else {
				Object.keys(villages).map(function(village_id){
					upgradeBuilding(village_id)
				})
			}
		}
		, wait = function(){
			setList(function(tm){
				if(!interval_builder){
					interval_builder = robotTW2.services.$timeout(function(){cicle_building()}, tm)
				} else {
					robotTW2.services.$timeout.cancel(interval_builder);
					interval_builder = robotTW2.services.$timeout(function(){cicle_building()}, tm)
				}
			});
		}
		, init = function(){
			isInitialized = !0
			start();
		}
		, start = function(){
			if(isRunning){return}
			ready(function(){
				var d = data_headquarter.get();
				d.interval = conf.INTERVAL.HEADQUARTER;
				data_headquarter.set(d);
				listener_building_level_change = robotTW2.services.$rootScope.$on(robotTW2.providers.eventTypeProvider.BUILDING_LEVEL_CHANGED, cicle_building)
				isRunning = !0
				robotTW2.services.$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"HEADQUARTER"})
				wait();
				cicle_building()
			}, ["all_villages_ready"])
		}
		, stop = function(){
			isRunning = !1
			robotTW2.services.$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"HEADQUARTER"})
			typeof(listener_building_level_change) == "function" ? listener_building_level_change(): null;
			listener_building_level_change = undefined
		}
		, pause = function (){
			isPaused = !0
			robotTW2.services.$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"HEADQUARTER"})
		}
		, resume = function (){
			isPaused = !1
			robotTW2.services.$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"HEADQUARTER"})
			robotTW2.services.$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.RESUME_CHANGE_HEADQUARTER)
		}

		return {
			init			: init,
			start			: start,
			pause			: pause,
			resume 			: resume,
			stop			: stop,
			isRunning		: function() {
				return isRunning
			},
			isPaused		: function() {
				return isPaused
			},
			isInitialized	: function(){
				return isInitialized
			},
			version			: "1.0.0",
			name			: "headquarter"
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