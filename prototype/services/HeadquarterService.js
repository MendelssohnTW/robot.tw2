define("robotTW2/services/HeadquarterService", [
	"robotTW2",
	"robotTW2/time",
	"robotTW2/conf",
	"conf/upgradeabilityStates",
	"conf/locationTypes",
	"robotTW2/databases/data_villages",
	"robotTW2/databases/data_headquarter",
	], function(
			robotTW2,
			time,
			conf,
			upgradeabilityStates,
			locationTypes,
			data_villages,
			data_headquarter
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
		, interval_cicle
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
			if(!vill.selected){
				vill.selected = data_headquarter.selects.find(f=>f.name ="standard");
			}
			var buildingLevels = vill.buildinglevels
			, buildingLimit = vill.buildinglimit[vill.selected.value]
			, builds = [];

			Object.keys(buildingLevels).forEach(function(key_level){
				if(buildingLimit){
					Object.keys(buildingLimit).forEach(function(key_limit){
						if(Object.keys(buildingLevels[key_level])[0] == key_limit && Object.values(buildingLevels[key_level])[0] < buildingLimit[key_limit] && Object.values(buildingLevels[key_level])[0] > 0){
							builds.push({[Object.keys(buildingLevels[key_level])[0]] : Object.values(buildingLevels[key_level])[0]})
						}
					})
				}
			})

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
							if(resources[resource_type] + data_headquarter.reserva[resource_type.toLowerCase()] < nextLevelCosts[resource_type]){
								not_enough_resources = true;
							}
						})
					}

					if(not_enough_resources){
						callback(!1, {[village.data.name] : "not_enough_resources for " + build})
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
							callback(!1, {[village.data.name] : buildingData.upgradeability + " for " + build})
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
				return data_headquarter.interval / 1e3;
			}
		}
		, getFinishedForFree = function (village){
			var lt = [];
			if(village.getBuildingQueue().getQueue().length > 0){
				var timer = Math.round(canBeFinishedForFree(village) * 1e3) + 5000;
				if (timer < data_headquarter.interval){
					timer < 0 ? timer = 0 : timer;
					lt.push(timer);
				}
			}
			var t = data_headquarter.interval > 0 ? data_headquarter.interval : data_headquarter.interval = conf.INTERVAL.HEADQUARTER;
			if(lt.length){
				t = Math.min.apply(null, lt);
			}
			return t || 0;
		}
		, setList = function(callback){
			list.push(conf.INTERVAL.HEADQUARTER)
			data_headquarter.interval < conf.MIN_INTERVAL ? list.push(conf.MIN_INTERVAL) : list.push(data_headquarter.interval);
			var t = Math.min.apply(null, list);
			data_headquarter.interval = t
			data_headquarter.complete = time.convertedTime() + t
			data_headquarter.set()
			list = [];
			$rootScope.$broadcast(providers.eventTypeProvider.INTERVAL_CHANGE_HEADQUARTER)
			if(callback && typeof(callback) == "function"){callback(t)}
		}
		, upgradeBuilding = function(village_id, resolve){
			character = modelDataService.getSelectedCharacter();
			return new Promise(function(resolve){
				var village = character.getVillage(village_id);
				buildingService.compute(village)
				var buildingQueue = village.getBuildingQueue()
				, buildingData = village.getBuildingData()
				, levels = buildingData.getBuildingLevels()
				, buildingLevels = angular.copy(Object.keys(levels).map(function(key){return {[key] : levels[key]}}))
				, queues = village.buildingQueue.getQueue()
				, readyState = village.checkReadyState()
				, buildState = data_villages.villages[village_id].headquarter_activate
				, buildAmounts = buildingQueue.getAmountJobs()
				, buildUnlockedSlots = buildingQueue.getUnlockedSlots()
				, firstQueue = queues[0];
				
				var premiumActionService = injector.get("premiumActionService");

				if(firstQueue && firstQueue.canBeFinishedForFree){
					premiumActionService.instantBuild(firstQueue, locationTypes.HEADQUARTER, true);
					resolve(true);
					return;
				}

				var gt = getFinishedForFree(village);
				if(gt != Infinity && gt != 0 && !isNaN(gt) && gt > conf.MIN_INTERVAL){
					list.push(gt)
				}

				if (
						!(
								buildAmounts !== buildUnlockedSlots
								&& buildState
								&& buildAmounts < data_headquarter.reserva.slots
								&& (readyState.buildingQueue || readyState.buildings) 
								&& (village.isInitialized() || villageService.initializeVillage(village))
						) 
				) {
					resolve();
					return;
				}

				data_villages.villages[village_id].buildinglevels = buildingLevels;
				if (queues.length) {
					queues.forEach(
							function(queue) {
								data_villages.villages[village_id].buildinglevels.map(function(value){
									Object.keys(value)[0] == queue.building ? value[queue.building]++ :undefined;
								})
							}
					)
				}

				data_villages.villages[village_id].builds = checkBuildingOrderLimit(data_villages.villages[village_id]);

				if(!data_villages.villages[village_id].builds.length) {
					resolve();
					return;
				}

				var bd = data_villages.villages[village_id].buildingorder[data_villages.villages[village_id].selected.value]
				var reBuilds = Object.keys(bd).map(function(key_db){
					return data_villages.villages[village_id].builds.map(function(key){
						return Object.keys(key)[0]
					}).find(f=>f==key_db)
				}).filter(f => f != undefined)
				, g = [];

				reBuilds.forEach(function(i){
					g.push(data_villages.villages[village_id].builds.map(
							function(key){
								return Object.keys(key)[0] == i ? {[Object.keys(key)[0]] : Object.values(key)[0]} : undefined
							}
					)
					.filter(f => f != undefined)[0]
					)
				})
				
				g.sort(function(a,b){return Object.values(a)[0] - Object.values(b)[0]})

				g.forEach(function(b) {
					function a (build){
						if(!promise_next){
							promise_next = new Promise(function(res){
								if(data_headquarter.seq){g = []};
								var buildLevel = Object.keys(build)[0]
								buildingService.compute(village)
								if(buildAmounts !== buildUnlockedSlots && buildAmounts < data_headquarter.reserva.slots) {
									isUpgradeable(village, buildLevel, function(success, data) {
										if (success) {
											++buildAmounts;
										} else if(data == "instant"){
											res(true);
										}
										res()
									})
								} else {
									res();

								}
							}).then(function(repeat){
								promise_next = undefined;
								if(repeat){
									resolve(true);
									next_queue = [];
								} else if(g.length && isRunning){
									build = g.shift()
									a(build)
								} else {
									resolve()
								}
							})
						} else {
							next_queue.push(build)
						}
					}
					a(b)
				})
			})
		}
		, seq_cicle = function(village_id){
			function f(vill_id){
				if(!promise){
					promise = new Promise(function(res){
						upgradeBuilding(vill_id).then(function(repeat){
//							data_villages.set();
							if(repeat){
								f(vill_id)
							} else {
								res()
							}
						})
					}).then(function(){
						promise = undefined;
						if (promise_queue.length){
							vill_id = promise_queue.shift();
							f(vill_id);	
						} else {
							wait()
						}
					})
				} else {
					promise_queue.push(vill_id)
				}
			}
			f(village_id)
		}
		, cicle_building = function($event, data){
			if (!isInitialized)
				return;
			Object.keys(data_villages.villages).map(function(village_id){seq_cicle(village_id)})
		}
		, wait = function(){
			setList(function(tm){
				if(isRunning){
					if(!interval_builder){
						interval_builder = $timeout(cicle_building, tm || conf.MIN_INTERVAL)
					} else {
						$timeout.cancel(interval_builder);
						interval_builder = $timeout(cicle_building, tm || conf.MIN_INTERVAL)
					}
				}
			});
		}
		, init = function(bool){
			isInitialized = !0
			Object.keys(data_villages.villages).map(function(village){
				if(!data_villages.villages[village].selected){
					data_villages.villages[village].selected = data_headquarter.selects[0];
				}
			})
			data_villages.set();
			if(bool){return}
			start();
		}
		, start = function(){
			if(isRunning){return}
			ready(function(){
				interval_cicle = setInterval(cicle_building, 15 * 60 * 1000)
				data_headquarter.interval = conf.INTERVAL.HEADQUARTER;
				data_headquarter.set()
				listener_building_level_change = $rootScope.$on(providers.eventTypeProvider.BUILDING_LEVEL_CHANGED, cicle_building)
				isRunning = !0
				$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"HEADQUARTER"})
				wait();
				cicle_building()
			}, ["all_villages_ready"])
		}
		, stop = function(){
			$timeout.cancel(interval_builder);
			interval_cicle = undefined;
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
			version			: conf.VERSION.HEADQUARTER,
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
