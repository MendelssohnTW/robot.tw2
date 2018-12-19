define("robotTW2/services/HeadquarterService", [
	"robotTW2",
	"robotTW2/version",
	"robotTW2/time",
	"robotTW2/conf",
	"conf/upgradeabilityStates",
	"conf/locationTypes",
	], function(
			robotTW2,
			version,
			time,
			conf,
			upgradeabilityStates,
			locationTypes
	){
	return (function HeadquarterService(
			$rootScope,
			socketService,
			providers,
			modelDataService,
			premiumActionService,
			buildingService,
			villageService,
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
		, promise = undefined
		, promise_queue = []	
		, promise_next = undefined
		, next_queue = []	
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
			return socketService.emit(providers.routeProvider.VILLAGE_GET_VILLAGE, {village_id: village_id}, function (data) {
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
				premiumActionService.instantBuild(firstQueue, locationTypes.HEADQUARTER, true);
				callback(!1, "instant")
			} else {
				getResources(village.data.villageId, function(resources){

					if(!resources){
						not_enough_resources = true
					} else {
						Object.keys(resources).forEach(function(resource_type){
							if(resources[resource_type] + $rootScope.data_headquarter.reserva[resource_type.toLowerCase()] < nextLevelCosts[resource_type]){
								not_enough_resources = true;
							}
						})
					}

					if(not_enough_resources){
						callback(!1, {[village.data.name] : "not_enough_resources"})
					} else{

						if(buildingData.upgradeability === upgradeabilityStates.POSSIBLE) {

							socketService.emit(providers.routeProvider.VILLAGE_UPGRADE_BUILDING, {
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
				var d = modelDataService.getWorldConfig().getFreeSecondsPerBuildingLevel() * village.getBuildingLevel("headquarter")
				return queue.finishedIn - d;
			} else {
				return $rootScope.data_headquarter.interval / 1e3;
			}
		}
		, getFinishedForFree = function (village){
			var lt = [];
			if(village.getBuildingQueue().getQueue().length > 0){
				var timer = Math.round(canBeFinishedForFree(village) * 1e3) + 5000;
				if (timer < $rootScope.data_headquarter.interval){
					timer < 0 ? timer = 0 : timer;
					lt.push(timer);
				}
			}
			var t = $rootScope.data_headquarter.interval;
			if(lt.length){
				t = Math.min.apply(null, lt);
			}
			return t;
		}
		, setList = function(callback){
			list.push(conf.INTERVAL.HEADQUARTER)
			$rootScope.data_headquarter.interval < conf.MIN_INTERVAL ? list.push(conf.MIN_INTERVAL) : list.push($rootScope.data_headquarter.interval);
			var t = Math.min.apply(null, list);
			$rootScope.data_headquarter.interval = t
			$rootScope.data_headquarter.complete = time.convertedTime() + t
			list = [];
			$rootScope.$broadcast(providers.eventTypeProvider.INTERVAL_CHANGE_HEADQUARTER)
			if(callback && typeof(callback) == "function"){callback(t)}
		}
		, upgradeBuilding = function(village_id, resolve, reject){
			var village = character.getVillage(village_id);
			buildingService.compute(village)
			var buildingQueue = village.getBuildingQueue()
			, buildingData = village.getBuildingData()
			, levels = buildingData.getBuildingLevels()
			, buildingLevels = angular.copy(Object.keys(levels).map(function(key){return {[key] : levels[key]}}))
			, queues = village.buildingQueue.getQueue()
			, readyState = village.checkReadyState()
			, buildState = $rootScope.data_villages.villages[village_id].executebuildingorder
			, buildAmounts = buildingQueue.getAmountJobs()
			, buildUnlockedSlots = buildingQueue.getUnlockedSlots()
			, firstQueue = queues[0];

			var premiumActionService = injector.get("premiumActionService");

			if(firstQueue && firstQueue.canBeFinishedForFree){
				premiumActionService.instantBuild(firstQueue, locationTypes.HEADQUARTER, true);
				reject(village_id);
			}

			list.push(getFinishedForFree(village))
			setList();

			if (
					!(
							buildAmounts !== buildUnlockedSlots
							&& buildState
							&& buildAmounts < $rootScope.data_headquarter.reserva.slots
							&& (readyState.buildingQueue || readyState.buildings) 
							&& (village.isInitialized() || villageService.initializeVillage(village))
					) 
			) {
				resolve();
			}

			$rootScope.data_villages.villages[village_id].buildinglevels = buildingLevels;
			if (queues.length) {
				queues.forEach(
						function(queue) {
							$rootScope.data_villages.villages[village_id].buildinglevels.map(function(value){
								Object.keys(value)[0] == queue.building ? value[queue.building]++ :undefined;
							})
						}
				)
			}

			$rootScope.data_villages.villages[village_id].builds = checkBuildingOrderLimit($rootScope.data_villages.villages[village_id]);

			if(!$rootScope.data_villages.villages[village_id].builds.length) {
				resolve();
			}

			var reBuilds = $rootScope.data_villages.villages[village_id].buildingorder.map(function(key){
				return $rootScope.data_villages.villages[village_id].builds.map(function(key){return Object.keys(key)[0]}).find(f=>f==Object.keys(key)[0])
			}).filter(f => f != undefined)
			, g = [];

			reBuilds.forEach(function(i){
				g.push($rootScope.data_villages.villages[village_id].builds.map(
						function(key){
							return Object.keys(key)[0] == i ? {[Object.keys(key)[0]] : Object.values(key)[0]} : undefined
						}
				)
				.filter(f => f != undefined)[0]
				)
			})

			g.forEach(function(b) {
				function a (build){
					if(!promise_next){
						promise_next = new Promise(function(res, rej){
							if($rootScope.data_headquarter.seq){g = []};
							var buildLevel = Object.keys(build)[0]
							buildingService.compute(village)
							if(!(buildAmounts !== buildUnlockedSlots && buildAmounts < $rootScope.data_headquarter.reserva.slots)) {
								res()
							} else {
								isUpgradeable(village, buildLevel, function(success, data) {
									if (success) {
										++buildAmounts;
									} else if(data == "instant"){
										rej(village_id);
									}
									res()
								})
							}
						}).then(function(){
							promise_next = undefined;
							if(g.length && isRunning){
								build = g.shift()
								a(build)
							}
						}, function(village_id){
							promise_next = undefined;
//							g.unshift(build);
							seq_cicle(village_id);
							return true;
						})
					} else {
						next_queue.push(build)
					}
				}
				a(b)
			})

//			if(reqD == respD){
//				reqD = 0;
//				respD = 0;
//				wait();
//				return !0;
//			}
		}
		, seq_cicle = function(village_id){
			function f(village_id){
				if(!promise){
					promise = new Promise(function(res, rej){
						upgradeBuilding(village_id, res, rej)
					}).then(function(){
						promise = undefined;
						if (promise_queue.length){
							village_id = promise_queue.shift();
							f(village_id);	
						}
					}, function(village_id){
						f(village_id);
					})
				} else {
					promise_queue.push(village_id)
				}
			}
			f(village_id)
		}
		, cicle_building = function($event, data){
			if (!isInitialized)
				return;
			character = modelDataService.getSelectedCharacter();
			if(isPaused){
				listener_resume = $rootScope.$on(providers.eventTypeProvider.RESUME_CHANGE_RECRUIT, function(){
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
				$timeout(function() {
					isRunning = !0
					seq_cicle(data.village_id)
				}, 3e3)
			} else {
				Object.keys($rootScope.data_villages.villages).map(function(village_id){seq_cicle(village_id)})
			}
		}
		, wait = function(){
			setList(function(tm){
				if(!interval_builder){
					interval_builder = $timeout(function(){cicle_building()}, tm)
				} else {
					$timeout.cancel(interval_builder);
					interval_builder = $timeout(function(){cicle_building()}, tm)
				}
			});
		}
		, init = function(bool){
			isInitialized = !0
			if(bool){return}
			start();
		}
		, start = function(){
			if(isRunning){return}
			ready(function(){
				$rootScope.data_headquarter.interval = conf.INTERVAL.HEADQUARTER;
				listener_building_level_change = $rootScope.$on(providers.eventTypeProvider.BUILDING_LEVEL_CHANGED, cicle_building)
				isRunning = !0
				$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"HEADQUARTER"})
				wait();
				cicle_building()
			}, ["all_villages_ready"])
		}
		, stop = function(){
			promise = undefined
			promise_queue = []	
			promise_next = undefined
			next_queue = []	
			isRunning = !1
			$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"HEADQUARTER"})
			typeof(listener_building_level_change) == "function" ? listener_building_level_change(): null;
			listener_building_level_change = undefined
		}
		, pause = function (){
			isPaused = !0
			$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"HEADQUARTER"})
		}
		, resume = function (){
			isPaused = !1
			$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"HEADQUARTER"})
			$rootScope.$broadcast(providers.eventTypeProvider.RESUME_CHANGE_HEADQUARTER)
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
			version			: version.headquarter,
			name			: "headquarter"
		}

	})(
			robotTW2.services.$rootScope,
			robotTW2.services.socketService,
			robotTW2.providers,
			robotTW2.services.modelDataService,
			robotTW2.services.premiumActionService,
			robotTW2.services.buildingService,
			robotTW2.services.villageService,
			robotTW2.services.$timeout,
			robotTW2.ready
	)
})
