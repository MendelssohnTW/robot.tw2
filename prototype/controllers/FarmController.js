define("robotTW2/controllers/FarmController", [
	"helper/time",
	"robotTW2/time",
	"robotTW2/services",
	"robotTW2/providers",
	"conf/conf",
	"robotTW2/calculateTravelTime",
	"robotTW2/databases/data_villages",
	"robotTW2/databases/data_farm",
	], function(
			helper,
			time,
			services,
			providers,
			conf_conf,
			calculateTravelTime,
			data_villages,
			data_farm
	){
	return function FarmController($scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
		$scope.START = services.$filter("i18n")("START", services.$rootScope.loc.ale);
		$scope.STOP = services.$filter("i18n")("STOP", services.$rootScope.loc.ale);
		$scope.PAUSE = services.$filter("i18n")("PAUSE", services.$rootScope.loc.ale);
		$scope.RESUME = services.$filter("i18n")("RESUME", services.$rootScope.loc.ale);
		var self = this;

		var TABS = {
				FARM 	: services.$filter("i18n")("farm", services.$rootScope.loc.ale, "farm"),
				PRESET 	: services.$filter("i18n")("preset", services.$rootScope.loc.ale, "farm"),
				LOG		: services.$filter("i18n")("log", services.$rootScope.loc.ale, "farm")
		}
		, TAB_ORDER = [
			TABS.FARM,
			TABS.PRESET,
			TABS.LOG,
			]

		$scope.update_all_presets = false;

		$scope.requestedTab = TABS.FARM;
		$scope.TABS = TABS;
		$scope.TAB_ORDER = TAB_ORDER;
		
		$scope.data_villages = data_villages;
		$scope.data_farm = data_farm;

		var setActiveTab = function setActiveTab(tab) {
			$scope.activeTab								= tab;
			$scope.requestedTab								= null;
		}
		, initTab = function initTab() {
			if (!$scope.activeTab) {
				setActiveTab($scope.requestedTab);
			}
		}
		, presetListModel = services.modelDataService.getPresetList()
		, presetIds = []
		, rallyPointSpeedBonusVsBarbarians = services.modelDataService.getWorldConfig().getRallyPointSpeedBonusVsBarbarians()
		, update = function () {
			if($scope.data_farm.farm_time_start < time.convertedTime()) {
				$scope.data_farm.farm_time_start = time.convertedTime();
			}
			if($scope.data_farm.farm_time_stop < $scope.data_farm.farm_time_start) {
				$scope.data_farm.farm_time_stop = $scope.data_farm.farm_time_start + 86400000;
			}
			services.FarmService.isRunning() && services.FarmService.isPaused() ? $scope.status = "paused" : services.FarmService.isRunning() && (typeof(services.FarmService.isPaused) == "function" && !services.FarmService.isPaused()) ? $scope.status = "running" : $scope.status = "stopped";
			if (!$scope.$$phase) {$scope.$apply();}
		}
		, get_dist = function (villageId, journey_time, units) {
			var village = services.modelDataService.getVillage(villageId)
			, units = units
			, army = {
				'officers'	: {},
				"units"		: units
			}
			, travelTime = calculateTravelTime(army, village, "attack", {
				'barbarian'		: true
			})

			return Math.trunc((journey_time / 1000 / travelTime) / 2) || 0;
		}
		, get_time = function (villageId, distance, units) {
			var village = services.modelDataService.getVillage(villageId)
			, units = units
			, army = {
				'officers'	: {},
				"units"		: units
			}
			, travelTime = calculateTravelTime(army, village, "attack", {
				'barbarian'		: true
			})

			return services.armyService.getTravelTimeForDistance(army, travelTime, distance, "attack") * 1000 * 2
		}
		, triggerUpdate = function triggerUpdate(callback) {
			presetIds = [];
			$scope.data.assignedPresetList = {}
			var presetId,
			assignPreset = function assignPreset(villageId) {
				if($scope.villageSelected.data.villageId === villageId){
					$scope.data.assignedPresetList[+presetId] = true
					!presetIds.find(f=>f==presetId) ? presetIds.push(parseInt(presetId, 10)) : presetIds;
				}
			};
			for (presetId in $scope.data.presets) {
//				$scope.data.presets[presetId] = angular.merge({}, $scope.data_villages.villages[$scope.villageSelected.data.villageId].presets[presetId])
				angular.extend($scope.data.presets[presetId], $scope.data_villages.villages[$scope.villageSelected.data.villageId].presets[presetId])
				if(!$scope.data.presets[presetId].assigned_villages){continue}
				$scope.data.presets[presetId].assigned_villages.forEach(assignPreset);
			}
			if(typeof(callback) == "function"){
				callback()
			}
		}
		, updateBlur = function(){
			if($scope.activeTab != TABS.PRESET){return}
			$scope.villageSelected
//			var vills = $scope.data_villages.villages;
//			var villSel = $scope.villageSelected.data.villageId;
			if($scope.update_all_presets){
				var obj = {};
				Object.keys($scope.villageSelected.presets).map(function(elem){
					obj[elem] = $scope.villageSelected.presets[elem];
					obj[elem].max_journey_distance = get_dist($scope.villageSelected.data.villageId, $scope.presetSelected.max_journey_time, obj[elem].units)
					obj[elem].max_journey_time = get_time($scope.villageSelected.data.villageId, obj[elem].max_journey_distance, obj[elem].units)
					obj[elem].min_journey_distance = get_dist($scope.villageSelected.data.villageId, $scope.presetSelected.min_journey_time, obj[elem].units) || 0
					obj[elem].min_journey_time = get_time($scope.villageSelected.data.villageId, obj[elem].min_journey_distance, obj[elem].units) || 0
					obj[elem].min_points_farm = $scope.presetSelected.min_points_farm
					obj[elem].max_points_farm = $scope.presetSelected.max_points_farm
					obj[elem].max_commands_farm = $scope.presetSelected.max_commands_farm
				})
				$scope.villageSelected.presets = obj;
				if (!$scope.$$phase) {$scope.$apply();}
			} else {
				$scope.presetSelected.max_journey_distance = get_dist($scope.villageSelected.data.villageId, $scope.presetSelected.max_journey_time, $scope.presetSelected.units)
				$scope.presetSelected.min_journey_distance = get_dist($scope.villageSelected.data.villageId, $scope.presetSelected.min_journey_time, $scope.presetSelected.units);
				angular.extend($scope.villageSelected.presets[$scope.presetSelected.id], $scope.presetSelected)
				angular.extend($scope.villageSelected.presets, $scope.villageSelected.presets)
				if (!$scope.$$phase) {$scope.$apply();}
			}

			if (!$scope.$$phase) {$scope.$apply();}
			if($scope.update_all_presets){
				triggerUpdate(function(){
					$scope.setPresetSelected(Object.keys($scope.data.assignedPresetList).map(
							function(elem){
								if($scope.data.assignedPresetList[elem]) {return elem} else {return undefined}
							}).filter(f=>f!=undefined)[0]
					)
				});
			}
			services.$timeout(blurPreset, 1500)
		}
		, blurPreset = function(){
			if($scope.activeTab != TABS.PRESET){return}
			var tmMax = helper.readableMilliseconds($scope.presetSelected.max_journey_time);
			if(tmMax.length == 7) {
				tmMax = "0" + tmMax;
			}
			document.getElementById("max_journey_time").value = tmMax;	
			var tmMin = helper.readableMilliseconds($scope.presetSelected.min_journey_time);
			if(tmMin.length == 7) {
				tmMin = "0" + tmMin;
			}
			document.getElementById("min_journey_time").value = tmMin;

			if (!$scope.$$phase) {$scope.$apply();}

		}
		, addQuadrant = function(pos){
			if(!$scope.villageSelected || !$scope.presetSelected) {return}

			if($scope.update_all_presets){
				var obj = {};
				Object.keys($scope.villageSelected.presets).map(function(elem){
					obj[elem] = $scope.villageSelected.presets[elem];
					obj[elem].quadrants.push(pos)
					obj[elem].quadrants.sort(function(a,b){return a-b})
				})
				$scope.villageSelected.presets = obj;
			} else {
				$scope.villageSelected.presets[$scope.presetSelected.id].quadrants.push(pos)
				$scope.villageSelected.presets[$scope.presetSelected.id].quadrants.sort(function(a,b){return a-b})
			}
		}
		, remQuadrant = function(pos){
			if(!$scope.villageSelected || !$scope.presetSelected || !$scope.villageSelected.presets ||!$scope.villageSelected.presets[$scope.presetSelected.id]) {return}

			if($scope.update_all_presets){
				var obj = {};
				Object.keys($scope.villageSelected.presets).map(function(elem){
					obj[elem] = $scope.villageSelected.presets[elem];
					obj[elem].quadrants = obj[elem].quadrants.filter(f => f != pos);
				})
				$scope.villageSelected.presets = obj;
			} else {
				$scope.villageSelected.presets[$scope.presetSelected.id].quadrants = $scope.villageSelected.presets[$scope.presetSelected.id].quadrants.filter(f => f != pos);
			}
		}

		initTab();
		
		

		$scope.userSetActiveTab = function(tab){
			setActiveTab(tab);
		}

		$scope.toggleValueState = function(update_all_presets){
			$scope.update_all_presets = update_all_presets;
			if (!$scope.$$phase) {$scope.$apply();}
		}

		$scope.blur = function (callback) {
			if($scope.activeTab == TABS.FARM){
				$scope.farm_time = $("#farm_time").val()
				$scope.inicio_de_farm = $("#inicio_de_farm").val()
				$scope.termino_de_farm = $("#termino_de_farm").val()
				$scope.data_termino_de_farm = $("#data_termino_de_farm").val()
				$scope.data_inicio_de_farm = $("#data_inicio_de_farm").val()

				if($scope.farm_time.length <= 5) {
					$scope.farm_time = $scope.farm_time + ":00"
				}

				var tempo_escolhido_inicio = new Date($scope.data_inicio_de_farm + " " + $scope.inicio_de_farm).getTime();
				var tempo_escolhido_termino = new Date($scope.data_termino_de_farm + " " + $scope.termino_de_farm).getTime();

				if(tempo_escolhido_inicio > tempo_escolhido_termino) {
					tempo_escolhido_termino = new Date(tempo_escolhido_inicio + 2 * 86400000)
					$scope.termino_de_farm = services.$filter("date")(tempo_escolhido_termino, "HH:mm:ss");
					$scope.data_termino_de_farm = services.$filter("date")(tempo_escolhido_termino, "yyyy-MM-dd");
				}

				document.getElementById("data_termino_de_farm").value = services.$filter("date")(new Date(tempo_escolhido_termino), "yyyy-MM-dd");
				document.getElementById("data_inicio_de_farm").value = services.$filter("date")(new Date(tempo_escolhido_inicio), "yyyy-MM-dd");
				document.getElementById("termino_de_farm").value = services.$filter("date")(new Date(tempo_escolhido_termino), "HH:mm:ss");
				document.getElementById("inicio_de_farm").value = services.$filter("date")(new Date(tempo_escolhido_inicio), "HH:mm:ss");

				$scope.data_farm.farm_time = helper.unreadableSeconds($scope.farm_time) * 1000
				$scope.data_farm.farm_time_start = tempo_escolhido_inicio
				$scope.data_farm.farm_time_stop = tempo_escolhido_termino

				update()
			}

			if(callback != undefined && typeof(callback) == "function") {
				callback()
			}
		}

		$scope.$watch("activeTab", function(){
			if($scope.activeTab == TABS.PRESET){
				triggerUpdate(function(){
					$scope.setPresetSelected(Object.keys($scope.data.assignedPresetList).map(
							function(elem){
								if($scope.data.assignedPresetList[elem]) {return elem} else {return undefined}
							}).filter(f=>f!=undefined)[0]
					)
				});
				services.$timeout(blurPreset, 1500)
			} else if ($scope.activeTab == TABS.FARM){
				getDetailsExceptions()
			}
		}, true)

		/*
		 * Presets
		 */

		$scope.data = {
			'assignedPresetList': {},
			'presets'			: angular.copy(services.presetListService.getPresets()),
			'hotkeys'			: services.storageService.getItem(services.presetService.getStorageKey())
		}

		$scope.showPresetDeleteModal = function showPresetDeleteModal(preset) {
			services.presetService.showPresetDeleteModal(preset).then(onDeletePreset);
		}

		$scope.showPresetEditModal = function showPresetEditModal(preset) {
			services.presetService.showPresetEditModal(angular.copy(preset));
		}

		$scope.showPresetInfoModal = function showPresetInfoModal(preset) {
			services.presetService.showPresetInfoModal(preset);
		}

		$scope.hasPresets = function hasPresets() {
			return !!Object.keys($scope.data.presets)[0];
		}

		$scope.createPreset = function createPreset() {
			services.presetService.createPreset();
		}

		$scope.assignPresets = function assignPresets() {
			var timeout_preset = services.$timeout(function(){
				triggerUpdate()
			}, conf_conf.LOADING_TIMEOUT)

			services.socketService.emit(providers.routeProvider.ASSIGN_PRESETS, {
				'village_id': $scope.villageSelected.data.villageId,
				'preset_ids': presetIds
			}, function(data){
				services.$timeout.cancel(timeout_preset)
				timeout_preset = undefined
				$scope.presetSelected = undefined;
				triggerUpdate()
			});

		}

		$scope.assignPreset = function assignPreset(presetId) {
			!presetIds.find(f=>f==presetId) ? presetIds.push(parseInt(presetId, 10)) : presetIds;
			$scope.assignPresets();
		}

		$scope.unassignPreset = function unassignPreset(presetId) {
			presetIds.splice(presetIds.indexOf(presetId), 1);
			$scope.assignPresets();
		}

		$scope.setPresetSelected = function (preset_id) {
			$scope.presetSelected =	$scope.data.presets[preset_id]
		}

		$scope.blurMaxJourney = function () {
			if($scope.activeTab == TABS.PRESET){
				var r = $("#max_journey_time").val() 
				if(r.length <= 5) {
					r = r + ":00"
				}

				$scope.data_farm.farm_time

				$scope.presetSelected.max_journey_time = helper.unreadableSeconds(r) * 1000
				$scope.presetSelected.max_journey_distance = get_dist($scope.data_villages.villages[$scope.villageSelected.data.villageId].data.villageId, $scope.presetSelected.max_journey_time, $scope.presetSelected.units)
				updateBlur()
			}
		}

		$scope.blurMinJourney = function () {
			if($scope.activeTab == TABS.PRESET){
				var r = $("#min_journey_time").val() 
				if(r.length <= 5) {
					r = r + ":00"
				}
				$scope.presetSelected.min_journey_time = helper.unreadableSeconds(r) * 1000
				$scope.presetSelected.min_journey_distance = get_dist($scope.data_villages.villages[$scope.villageSelected.data.villageId].data.villageId, $scope.presetSelected.min_journey_time, $scope.presetSelected.units) || 0
				updateBlur()
			}
		}

		$scope.updateBlur = updateBlur;

		$scope.$watch("presetSelected", function(){
			if(!$scope.presetSelected || !blurPreset){return}
			blurPreset();
		}, true)

//		$scope.$watch("villageSelected", function(){
//		if(!$scope.villageSelected || !Object.keys($scope.data.assignedPresetList).length){return}
//		!$scope.presetSelected ? $scope.presetSelected = $scope.data_villages.villages[$scope.villageSelected.data.villageId].presets[Object.keys($scope.data.assignedPresetList).map(
//		function(elem){
//		if($scope.data.assignedPresetList[elem]) {return elem} else {return undefined}
//		}).filter(f=>f!=undefined)[0]] : $scope.presetSelected;
//		}, true)


		/*
		 * Villages
		 */

		$scope.getVillageInfo = function(villageId){
			var village = services.modelDataService.getVillage(villageId);
			return village.data.name + " - (" + village.data.x + "|" + village.data.x + ")"
		}
		
		$scope.setVillage = function (villageId) {
			$scope.data.assignedPresetList = {};
			var village = services.modelDataService.getVillage(villageId);
			$scope.villageSelected = village;
		}


		/*
		 * Exceptions
		 */

		$scope.deleteException = function (id_village) {
			$scope.data_farm.list_exceptions = $scope.data_farm.list_exceptions.filter(f => f != id_village)
			getDetailsExceptions();
		}

		function getDetailsExceptions() {
			var my_village_id = services.modelDataService.getSelectedVillage().getId();
			$scope.list_exceptions = {};
			$scope.data_farm.list_exceptions.forEach(function (vid) {
				services.socketService.emit(providers.routeProvider.MAP_GET_VILLAGE_DETAILS, {
					'village_id'	: vid,
					'my_village_id'	: my_village_id,
					'num_reports'	: 5
				}, function (data) {
					$scope.list_exceptions[data.village_id] = {
							village_name : data.village_name,
							village_x : data.village_x,
							village_y : data.village_y
					}
					if (!$scope.$$phase) $scope.$apply();
				})
			})
		}

		getDetailsExceptions();

		$scope.start_farm = function () {
			$scope.blur(function () {
				services.FarmService.start();
				$scope.isRunning = services.FarmService.isRunning();
			});
		}
		$scope.stop_farm = function () {
			services.FarmService.stop();
		}
		$scope.pause_farm = function () {
			services.FarmService.pause();
			$scope.paused = !0;
		}
		$scope.resume_farm = function () {
			services.FarmService.resume();
			$scope.paused = !1;
		}

		/*
		 * Quadrants
		 */

		$scope.setQuadrant = function (pos) {
			if(!$scope.villageSelected || !$scope.presetSelected || !$scope.villageSelected.presets ||!$scope.villageSelected.presets[$scope.presetSelected.id]) {return}

			if($scope.villageSelected.presets[$scope.presetSelected.id].quadrants.includes(pos)){
				remQuadrant(pos)
			} else {
				addQuadrant(pos)
			}
		}

		$scope.getQuadrant = function (pos) {
			if(!$scope.villageSelected || !$scope.presetSelected || !$scope.villageSelected.presets ||!$scope.villageSelected.presets[$scope.presetSelected.id]) {return}
			return $scope.villageSelected.presets[$scope.presetSelected.id].quadrants.includes(pos)
		}

		$scope.date_ref = new Date(0);
		$scope.tmMax = "0";
		$scope.tmMin = "0";

		$scope.getFarmTime = function () {

			var tm = helper.readableMilliseconds($scope.data_farm.farm_time);
			if(tm.length == 7) {
				tm = "0" + tm;
			}
			return tm;
		}

		$scope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function ($event, data) {
			if(!data) {return} 
			update();
		})

		$scope.villageSelected = $scope.data_villages.villages[Object.keys($scope.data_villages.villages)[0]]

		triggerUpdate()

		$scope.$watch("data_villages", function () {
			if(!$scope.data_villages) {return}
			data_villages = $scope.data_villages;
			data_villages.set();
		}, true)
		
		$scope.$watch("data_farm", function () {
			if(!$scope.data_farm) {return}
			data_farm = $scope.data_farm;
			data_farm.set();
		}, true)


		$scope.isRunning = services.FarmService.isRunning();
		$scope.isPaused = services.FarmService.isPaused();
		update()

		$scope.$watch("data_logs.farm", function(){
			$scope.recalcScrollbar();
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		}, true)


		$scope.recalcScrollbar();
		$scope.setCollapse();

		return $scope;
	}
})
