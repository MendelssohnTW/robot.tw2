define("robotTW2/headquarter", [
	"robotTW2/ready",
	"robotTW2/eventQueue",
	"robotTW2/data_villages",
	"robotTW2/data_headquarter",
	"conf/upgradeabilityStates", 
	"conf/locationTypes", 
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
	, x = {}
	, y = {}
	, villages = data_villages.getVillages()
	, listener_building_level_change = undefined
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
	, isUpgradeable = function(village, build, callback) {
		if(village.getBuildingData().getDataForBuilding(build).upgradeability === upgradeabilityStates.POSSIBLE) {
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
			callback(!1, {[village.data.name] : village.getBuildingData().getDataForBuilding(build).upgradeability})
		}
	}
	, cicle_building = function(){
		character = services.modelDataService.getSelectedCharacter()
		, !listener_building_level_change ? listener_building_level_change = $rootScope.$on(providers.eventTypeProvider.BUILDING_LEVEL_CHANGED, function($event, data) {
			if (!isInitialized)
				return !1;
			services.$timeout(function() {
				var village = character.getVillage(data.village_id)
				isRunning = !0
				upgradeBuilding(village)
			}, 1e3)
		}) : listener_building_level_change
		, vills = Object.values(villages).map(function(e){
			return e
		})
		, n = function(){
			if(vills.length){
				var vill = vills.shift();
				upgradeBuilding(vill, function(){
					isRunning ? n() : !1;
				})
			}
		}
		n();

	}
	, upgradeBuilding = function(vill, callback){
		var village = character.getVillage(vill.data.villageId)
		var readyState = village.checkReadyState()
		, buildState = vill.EXECUTEBUILDINGORDER
		, buildingQueue = village.getBuildingQueue()
		, buildAmounts = buildingQueue.getAmountJobs()
		, buildUnlockedSlots = buildingQueue.getUnlockedSlots()
		if (
				!(
						buildAmounts !== buildUnlockedSlots
						&& buildState
						&& buildAmounts < 1
						&& (readyState.buildingQueue || readyState.buildings) 
						&& (village.isInitialized() || services.villageService.initializeVillage(village))
				) 
		) {
			return typeof(callback) == "function" ? callback() : !1;
		}

		var levels = village.buildingData.getBuildingLevels()
		var buildingLevels = angular.copy(Object.keys(levels).map(function(key){return {[key] : levels[key]}}))
		, queues = village.buildingQueue.getQueue()

		vill.BUILDINGLEVELS = buildingLevels;
		if (queues.lenght) {
			queues.forEach(
					function(queue) {
						vill.BUILDINGLEVELS.map(function(value){value[queue]++})
						//vill.BUILDINGLEVELS[queue.building]++
					}
			)
		}


		vill.builds = checkBuildingOrderLimit(vill);

		if(!vill.builds.length) {
			return typeof(callback) == "function" ? callback() : !1;
		}

		var reBuilds = vill.BUILDINGORDER.map(function(key){
			return vill.builds.map(function(key){return Object.keys(key)[0]}).find(f=>f==Object.keys(key)[0])
		}).filter(f => f != undefined)

		var g = [];
		reBuilds.forEach(function(i){
			g.push(vill.builds.map(
					function(key){
						return Object.keys(key)[0] == i ? {[Object.keys(key)[0]] : Object.values(key)[0]} : undefined
					}
			)
			.filter(f => f != undefined)[0]
			)
		})

		var next = function() {
			if(g.length && isRunning){
				var build = g.shift();
				var buildLevel = Object.keys(build)[0]
				services.buildingService.compute(village)
				if(!(buildAmounts !== buildUnlockedSlots && buildAmounts < 1)) {
					return typeof(callback) == "function" ? callback() : !1;
				}
				isUpgradeable(village, buildLevel, function(success, data) {
					if (success) {
						++buildAmounts;
//						var d = Date.now()
//						, e = [{
//						x: village.getX(),
//						y: village.getY(),
//						name: village.getName(),
//						id: village.getId()
//						}, data.job.building, data.job.level, d];
//						eventQueue.trigger("Builder/jobStarted", e)//,
//						//s.unshift(e)//,
//						//j.set("builder-log", s)

						return typeof(callback) == "function" ? callback() : !0;
					} else {
						console.log(Object.keys(build)[0] + "-" + JSON.stringify(data))
						next()
					}
				})
			} else {
				return typeof(callback) == "function" ? callback() : !0;
			}
		}
		next()
	}
	, start = function(){
		if(isRunning){return}
		isRunning = !0
		!interval_builder ? interval_builder = setInterval(cicle_building, data_headquarter.getTimeCicle()) : null;
		ready(cicle_building, ["all_villages_ready"])
	}
	, stop = function(){
		isRunning = !1
		typeof(listener_building_level_change) == "function" ? listener_building_level_change(): null;
		listener_building_level_change = undefined
		clearInterval(interval_builder)
		eventQueue.trigger("Builder/stop")
	}
	, init = function(){
		isInitialized = !0
		start();
	}

	return {
		init			: init,
		start			: start,
		stop			: stop,
		isRunning		: function() {
			return isRunning
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
	"robotTW2/data_villages",
	"robotTW2/data_headquarter",
	"helper/time",
	"robotTW2/conf"
	], function(
			headquarter,
			builderWindow,
			services,
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
		$scope.time_interval_headquarter = services.$filter("i18n")("time_interval_headquarter", $rootScope.loc.ale, "headquarter");
		$scope.settings = services.$filter("i18n")("settings", $rootScope.loc.ale, "headquarter");
		$scope.priority = services.$filter("i18n")("priority", $rootScope.loc.ale, "headquarter");
		$scope.settings_for_villages = services.$filter("i18n")("settings_for_villages", $rootScope.loc.ale, "headquarter");
		$scope.levels = services.$filter("i18n")("levels", $rootScope.loc.ale, "headquarter");
		$scope.init_standard = services.$filter("i18n")("init_standard", $rootScope.loc.ale, "headquarter");
		$scope.ativate = services.$filter("i18n")("ativate", $rootScope.loc.ale, "headquarter");
		$scope.tooltip_input = services.$filter("i18n")("tooltip_input", $rootScope.loc.ale, "headquarter");
		$scope.tooltip_button = services.$filter("i18n")("tooltip_button", $rootScope.loc.ale, "headquarter");
		$scope.save = services.$filter("i18n")("SAVE", $rootScope.loc.ale);
		$scope.close = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		$scope.restore = services.$filter("i18n")("RESTORE", $rootScope.loc.ale);
		$scope.start = services.$filter("i18n")("START", $rootScope.loc.ale);
		$scope.stop = services.$filter("i18n")("STOP", $rootScope.loc.ale);
		$scope.data_headquarter = data_headquarter.getHeadquarter();
		$scope.villages = data_villages.getVillages();

		$window.$data.ativate = $scope.data_headquarter.ATIVATE;

		$scope.interval_headquarter = helper.readableMilliseconds(data_headquarter.getTimeCicle())

		$scope.getKey = function(buildingOrder){
			return services.$filter("i18n")(Object.keys(buildingOrder)[0], $rootScope.loc.ale, "headquarter");
		}

//		$scope.set = function(){
//		$scope.interval_headquarter = $("#input_text_time_interval").val();
//		if($scope.interval_headquarter.length <= 5){
//		$scope.interval_headquarter = $scope.interval_headquarter + ":00"
//		}
//		if (!$rootScope.$$phase) $rootScope.$apply();
//		}

		$scope.getValue = function(buildingOrder){
			return Object.values(buildingOrder)[0];
		}
		$scope.up = function(data, buildingOrder){
			var ant = data.BUILDINGORDER.find(function(a,b){return Object.values(a)[0]==Object.values(buildingOrder)[0]-1})
			ant[Object.keys(ant)[0]] += 1
			buildingOrder[Object.keys(buildingOrder)[0]] -= 1
			data.BUILDINGORDER = data.BUILDINGORDER.map(function(key,index,array){return delete data.BUILDINGORDER[index].$$hashKey ? data.BUILDINGORDER[index] : undefined}).sort(function(a,b){return Object.values(a)[0] - Object.values(b)[0]})
			if (!$rootScope.$$phase) {$rootScope.$apply();}
		}

		$scope.down = function(data, buildingOrder){
			var prox = data.BUILDINGORDER.find(function(a,b){return Object.values(a)[0]==Object.values(buildingOrder)[0]+1})
			prox[Object.keys(prox)[0]] -= 1
			buildingOrder[Object.keys(buildingOrder)[0]] += 1
			data.BUILDINGORDER = data.BUILDINGORDER.map(function(key,index,array){return delete data.BUILDINGORDER[index].$$hashKey ? data.BUILDINGORDER[index] : undefined}).sort(function(a,b){return Object.values(a)[0] - Object.values(b)[0]})
			if (!$rootScope.$$phase) {$rootScope.$apply();}
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
			if (!$rootScope.$$phase) {$rootScope.$apply();}
		}

		$scope.savedata = function(){
			data_headquarter.setHeadquarter($scope.data_headquarter);

			var input_value = $window.$data.rootnode.querySelector("#input-text").value
			if (helper.unreadableSeconds(input_value) * 1e3 < 30*60*1000){
				data_headquarter.setTimeCicle(30*60*1000)
			} else {
				data_headquarter.setTimeCicle(helper.unreadableSeconds(input_value) * 1e3)	
			}

			data_villages.setVillages($scope.villages)

			$scope.data_headquarter = data_headquarter.getHeadquarter();
			$scope.villages = data_villages.getVillages();

			if (!$rootScope.$$phase) {$rootScope.$apply();}
		}

		$scope.restoredata = function(){
			data_headquarter.setTimeCicle(conf.INTERVAL)

//			var dataNew = {
//				INIT_ATIVATE			: false,
//				ATIVATE 				: false,
//				INTERVAL 				: conf.INTERVAL.HEADQUARTER,
//				VERSION					: conf.VERSION.HEADQUARTER,
//				BUILDINGORDER 			: conf.BUILDINGORDER,
//				BUILDINGLIMIT 			: conf.BUILDINGLIMIT,
//				BUILDINGLEVELS 			: conf.BUILDINGLEVELS
//			}
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
			//data_headquarter.setHeadquarter(dataNew);
			data_villages.setVillages(villagesExtended);
			$scope.data_headquarter = data_headquarter.getHeadquarter();
			$scope.villages = data_villages.getVillages();
			if (!$rootScope.$$phase) $rootScope.$apply();

		}

		$scope.selected_buildingOrder = {};
		$scope.selected_village_buildingOrder = [];

		$scope.selectbuildingOrder = function(buildingOrder){
			$scope.selected_buildingOrder = buildingOrder;
			if (!$rootScope.$$phase) $rootScope.$apply();
		}

		$scope.selectvillagebuildingOrder = function(villageId, buildingOrder){
			$scope.selected_village_buildingOrder[villageId] = buildingOrder;
			if (!$rootScope.$$phase) $rootScope.$apply();
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

		if (!$rootScope.$$phase) {
			$rootScope.$apply();
		}

		services.$timeout(function(){
			$window.setCollapse();
			$window.recalcScrollbar();
		}, 500)

	}

	Object.setPrototypeOf(headquarter, {
		build : function(){
			build(injectScope)
		}
	})

})
