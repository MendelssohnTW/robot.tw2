define("robotTW2/headquarter", [
	"robotTW2/ready",
	"robotTW2/eventQueue",
	"robotTW2/data_villages",
	"robotTW2/data_headquarter",
	"conf/upgradeabilityStates", 
	"conf/locationTypes", 
	"helper/time",
	"robotTW2/conf", 
	"robotTW2/services",
	"robotTW2/providers"
	], function(
			ready,
			eventQueue,
			data_villages,
			data_headquarter,
			upgradeabilityStates,
			locationTypes,
			helper,
			conf, 
			services,
			providers
	){
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
	, villages = data_villages.getVillages()
	, listener_building_level_change = undefined
	, listener_resume = undefined
	, checkBuildingOrderLimit = function(vill) {
		var buildingLevels = vill.BUILDINGLEVELS
		, buildingLimit = vill.BUILDINGLIMIT
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
		return services.socketService.emit(providers.routeProvider.VILLAGE_GET_VILLAGE, {village_id: village_id}, function (data) {
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
			services.premiumActionService.instantBuild(firstQueue, locationTypes.HEADQUARTER, true);
			callback(!1, "instant")
		} else {
			getResources(village.data.villageId, function(resources){
				Object.keys(resources).forEach(function(resource_type){
					if(resources[resource_type] + data_headquarter.getHeadquarter().RESERVA[resource_type.toUpperCase()] < nextLevelCosts[resource_type]){
						not_enough_resources = true;
					}
				})

				if(not_enough_resources){
					callback(!1, {[village.data.name] : "not_enough_resources"})
				} else{

					if(buildingData.upgradeability === upgradeabilityStates.POSSIBLE) {

						services.socketService.emit(providers.routeProvider.VILLAGE_UPGRADE_BUILDING, {
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
			var d = services.modelDataService.getWorldConfig().getFreeSecondsPerBuildingLevel() * village.getBuildingLevel("headquarter")
			return queue.finishedIn - d;
		} else {
			return data_headquarter.getHeadquarter().INTERVAL / 1e3;
		}
	}
	, getFinishedForFree = function (village, lt){
		if(village.getBuildingQueue().getQueue().length > 0){
			var timer = Math.round(canBeFinishedForFree(village) * 1e3) + 5000;
			if (timer < data_headquarter.getHeadquarter().INTERVAL){
				timer < 0 ? timer = 0 : timer;
				lt.push(timer);
			}
		}
		return lt;
	}
	, setList = function(lt){
		if(lt){list = lt}
		list.push(conf.INTERVAL.HEADQUARTER)
		list.push(data_headquarter.getTimeCicle())
		var t = Math.min.apply(null, list);
		data_headquarter.setTimeCicle(t)
		data_headquarter.setTimeComplete(helper.gameTime() + t)
		list = [];
		$rootScope.$broadcast(providers.eventTypeProvider.INTERVAL_CHANGE_HEADQUARTER)
	}
	, upgradeBuilding = function(village_id){
		reqD++
		services.$timeout(function(){
			respD++
			var village = character.getVillage(village_id);
			services.buildingService.compute(village)
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

			list = getFinishedForFree(village, list)

			setList(list);

			if (
					!(
							buildAmounts !== buildUnlockedSlots
							&& buildState
							&& buildAmounts < data_headquarter.getHeadquarter().RESERVA.SLOTS
							&& (readyState.buildingQueue || readyState.buildings) 
							&& (village.isInitialized() || services.villageService.initializeVillage(village))
					) 
			) {
				return;
			}

			villages[village_id].BUILDINGLEVELS = buildingLevels;
			if (queues.length) {
				queues.forEach(
						function(queue) {
							villages[village_id].BUILDINGLEVELS.map(function(value){value[queue.building]++})
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
					services.buildingService.compute(village)
					if(!(buildAmounts !== buildUnlockedSlots && buildAmounts < data_headquarter.getHeadquarter().RESERVA.SLOTS)) {
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
		character = services.modelDataService.getSelectedCharacter();
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
			services.$timeout(function() {
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
		setList();
		if(!interval_builder){
			interval_builder = services.$timeout(cicle_building, data_headquarter.getTimeCicle())
		} else {
			services.$timeout.cancel(interval_builder);
			interval_builder = services.$timeout(cicle_building, data_headquarter.getTimeCicle())
		}
	}
	, init = function(){
		isInitialized = !0
		start();
	}
	, start = function(){
		if(isRunning){return}
		ready(function(){
			var d = data_headquarter.getHeadquarter();
			d.INTERVAL = conf.INTERVAL.HEADQUARTER;
			data_headquarter.setHeadquarter(d);
			listener_building_level_change = $rootScope.$on(providers.eventTypeProvider.BUILDING_LEVEL_CHANGED, cicle_building)
			isRunning = !0
			$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"HEADQUARTER"})
			wait();
			cicle_building()
		}, ["all_villages_ready"])
	}
	, stop = function(){
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
		version			: "1.0.0",
		name			: "headquarter"
	}
})
,
define("robotTW2/headquarter/ui", [
	"robotTW2/headquarter",
	"robotTW2/builderWindow",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/data_villages",
	"robotTW2/data_headquarter",
	"helper/time",
	"robotTW2/conf"
	], function(
			headquarter,
			builderWindow,
			services,
			providers,
			data_villages,
			data_headquarter,
			helper,
			conf
	) {
	var $window
	, build = function(callback) {
		var hotkey = conf.HOTKEY.HEADQUARTER;
		var templateName = "headquarter";
		$window = new builderWindow(hotkey, templateName, callback)
		return $window
	}
	, injectScope = function() {

		var $scope = $window.$data.scope;
		$scope.title = services.$filter("i18n")("title", $rootScope.loc.ale, "headquarter");
		$scope.introducing = services.$filter("i18n")("introducing", $rootScope.loc.ale, "headquarter");
		$scope.text_interval_headquarter = services.$filter("i18n")("text_interval_headquarter", $rootScope.loc.ale, "headquarter");
		$scope.text_reserva_food = services.$filter("i18n")("text_reserva_food", $rootScope.loc.ale, "headquarter");
		$scope.text_reserva_slots = services.$filter("i18n")("text_reserva_slots", $rootScope.loc.ale, "headquarter");
		$scope.text_reserva_wood = services.$filter("i18n")("text_reserva_wood", $rootScope.loc.ale, "headquarter");
		$scope.text_reserva_clay = services.$filter("i18n")("text_reserva_clay", $rootScope.loc.ale, "headquarter");
		$scope.text_reserva_iron = services.$filter("i18n")("text_reserva_iron", $rootScope.loc.ale, "headquarter");
		$scope.settings = services.$filter("i18n")("settings", $rootScope.loc.ale, "headquarter");
		$scope.headquarter_running = services.$filter("i18n")("headquarter_running", $rootScope.loc.ale, "headquarter");
		$scope.priority = services.$filter("i18n")("priority", $rootScope.loc.ale, "headquarter");
		$scope.settings_for_villages = services.$filter("i18n")("settings_for_villages", $rootScope.loc.ale, "headquarter");
		$scope.levels = services.$filter("i18n")("levels", $rootScope.loc.ale, "headquarter");
		$scope.init_standard = services.$filter("i18n")("init_standard", $rootScope.loc.ale, "headquarter");
		$scope.ativate = services.$filter("i18n")("ativate", $rootScope.loc.ale, "headquarter");
		$scope.tooltip_input = services.$filter("i18n")("tooltip_input", $rootScope.loc.ale, "headquarter");
		$scope.tooltip_button = services.$filter("i18n")("tooltip_button", $rootScope.loc.ale, "headquarter");
		$scope.restore = services.$filter("i18n")("RESTORE", $rootScope.loc.ale);
		$scope.save = services.$filter("i18n")("SAVE", $rootScope.loc.ale);
		$scope.close = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		$scope.start = services.$filter("i18n")("START", $rootScope.loc.ale);
		$scope.pause = services.$filter("i18n")("PAUSE", $rootScope.loc.ale);
		$scope.resume = services.$filter("i18n")("RESUME", $rootScope.loc.ale);
		$scope.stop = services.$filter("i18n")("STOP", $rootScope.loc.ale);
		$scope.data_headquarter = data_headquarter.getHeadquarter();
		$scope.villages = data_villages.getVillages();

		$window.$data.ativate = $scope.data_headquarter.ATIVATE;

		$scope.isRunning = headquarter.isRunning();
		$scope.paused = headquarter.isPaused();

		$scope.data_headquarter.COMPLETED_AT ? $scope.completed_at = $scope.data_headquarter.COMPLETED_AT : $scope.completed_at = 0;

		
		$scope.getTimeRest = function(){
			return helper.readableMilliseconds($scope.completed_at - helper.gameTime()); 
		}

		$scope.getKey = function(buildingOrder){
			return services.$filter("i18n")(Object.keys(buildingOrder)[0], $rootScope.loc.ale, "headquarter");
		}

		$scope.getClass = function(buildingOrder){
			return "icon-20x20-building-" + Object.keys(buildingOrder)[0];
		}

		$scope.getValue = function(buildingOrder){
			return Object.values(buildingOrder)[0];
		}

		$scope.up = function(data, buildingOrder){
			var ant = data.BUILDINGORDER.find(function(a,b){return Object.values(a)[0]==Object.values(buildingOrder)[0]-1})
			ant[Object.keys(ant)[0]] += 1
			buildingOrder[Object.keys(buildingOrder)[0]] -= 1
			data.BUILDINGORDER = data.BUILDINGORDER.map(function(key,index,array){return delete data.BUILDINGORDER[index].$$hashKey ? data.BUILDINGORDER[index] : undefined}).sort(function(a,b){return Object.values(a)[0] - Object.values(b)[0]})
			if (!$scope.$$phase) {$scope.$apply();}
		}

		$scope.down = function(data, buildingOrder){
			var prox = data.BUILDINGORDER.find(function(a,b){return Object.values(a)[0]==Object.values(buildingOrder)[0]+1})
			prox[Object.keys(prox)[0]] -= 1
			buildingOrder[Object.keys(buildingOrder)[0]] += 1
			data.BUILDINGORDER = data.BUILDINGORDER.map(function(key,index,array){return delete data.BUILDINGORDER[index].$$hashKey ? data.BUILDINGORDER[index] : undefined}).sort(function(a,b){return Object.values(a)[0] - Object.values(b)[0]})
			if (!$scope.$$phase) {$scope.$apply();}
		}

		$scope.levelup = function(buildingLimit){
			var max_level = services.modelDataService.getGameData().getBuildingDataForBuilding(Object.keys(buildingLimit)[0]).max_level;
			var level = buildingLimit[Object.keys(buildingLimit)[0]] += 1;
			if(level > max_level){
				buildingLimit[Object.keys(buildingLimit)[0]] -= 1
			}

			if (!$rootScope.$$phase) {$rootScope.$apply();}
		}

		$scope.leveldown = function(buildingLimit){
			buildingLimit[Object.keys(buildingLimit)[0]] -= 1
			if (!$scope.$$phase) {$scope.$apply();}
		}

		$scope.start_headquarter = function(){
			headquarter.start();
			$scope.isRunning = headquarter.isRunning();
		}

		$scope.stop_headquarter = function(){
			headquarter.stop();
			$scope.isRunning = headquarter.isRunning();
		}

		$scope.pause_headquarter = function(){
			headquarter.pause();
			$scope.paused = !0;
		}

		$scope.resume_headquarter = function(){
			headquarter.resume();
			$scope.paused = !1;
		}

		$scope.save_headquarter = function(){
			data_headquarter.setHeadquarter($scope.data_headquarter);
			data_villages.setVillages($scope.villages)

			$scope.data_headquarter = data_headquarter.getHeadquarter();
			$scope.villages = data_villages.getVillages();

			if (!$scope.$$phase) {$scope.$apply();}
		}

		$scope.restore_headquarter = function(){
			data_headquarter.setTimeCicle(conf.INTERVAL.HEADQUARTER)

			var villages = {}
			, villagesExtended = {}

			angular.extend(villages, services.modelDataService.getVillages())
			angular.merge(villagesExtended, villages)

			Object.values(villagesExtended).forEach(function(village){
				angular.merge(village, {
					EXECUTEBUILDINGORDER 	: conf.EXECUTEBUILDINGORDER,
					BUILDINGORDER 			: $scope.data_headquarter.BUILDINGORDER,
					BUILDINGLIMIT 			: $scope.data_headquarter.BUILDINGLIMIT,
					BUILDINGLEVELS 			: $scope.data_headquarter.BUILDINGLEVELS
				})
			})
			data_villages.setVillages(villagesExtended);
			$scope.data_headquarter = data_headquarter.getHeadquarter();
			$scope.data_headquarter.COMPLETED_AT ? $scope.completed_at = $scope.data_headquarter.COMPLETED_AT : $scope.completed_at = 0;
			$scope.villages = data_villages.getVillages();
			if (!$scope.$$phase) $scope.$apply();

		}

		$scope.selected_buildingOrder = {};
		$scope.selected_village_buildingOrder = [];

		$scope.selectbuildingOrder = function(buildingOrder){
			$scope.selected_buildingOrder = buildingOrder;
			if (!$scope.$$phase) $scope.$apply();
		}

		$scope.selectvillagebuildingOrder = function(villageId, buildingOrder){
			$scope.selected_village_buildingOrder[villageId] = buildingOrder;
			if (!$scope.$$phase) $scope.$apply();
		}

		$scope.comparevillagebuildingOrder = function(villageId, buildingOrder){
			return $scope.selected_village_buildingOrder[villageId] == buildingOrder;
		}

		$scope.compare = function(buildingOrder){
			return $scope.selected_buildingOrder == buildingOrder;
		}

		$scope.toggleVillage = function(village){
			angular.merge($scope.villages[village.data.villageId], village);
		}

		$rootScope.$on(providers.eventTypeProvider.INTERVAL_CHANGE_HEADQUARTER, function() {
			$scope.data_headquarter = data_headquarter.getHeadquarter();
			$scope.data_headquarter.COMPLETED_AT ? $scope.completed_at = $scope.data_headquarter.COMPLETED_AT : $scope.completed_at = 0;
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		})

		if (!$scope.$$phase) {
			$scope.$apply();
		}

		services.$timeout(function(){
			$window.$data.rootnode.setAttribute("style", "width:850px;");
			$window.setCollapse();
			$window.recalcScrollbar();
			$(".win-foot .btn-orange").forEach(function(d){
				d.setAttribute("style", "min-width:80px")
			})
		}, 500)

	}

	Object.setPrototypeOf(headquarter, {
		build : function(){
			build(injectScope)
		}
	})

})
