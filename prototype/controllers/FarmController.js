define("robotTW2/controllers/FarmController", [
	"helper/time",
	"robotTW2/time",
	"robotTW2/services",
	"robotTW2/providers",
	"conf/conf",
	"robotTW2/calculateTravelTime",
	"robotTW2/databases/data_villages",
	"robotTW2/databases/data_farm",
	"helper/format"
	], function(
			helper,
			time,
			services,
			providers,
			conf_conf,
			calculateTravelTime,
			data_villages,
			data_farm,
			formatHelper
	){
	return function FarmController($scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
		$scope.START = services.$filter("i18n")("START", services.$rootScope.loc.ale);
		$scope.STOP = services.$filter("i18n")("STOP", services.$rootScope.loc.ale);
		$scope.PAUSE = services.$filter("i18n")("PAUSE", services.$rootScope.loc.ale);
		$scope.RESUME = services.$filter("i18n")("RESUME", services.$rootScope.loc.ale);
		$scope.SELECT = services.$filter("i18n")("SELECT", services.$rootScope.loc.ale);
		$scope.version = services.$filter("i18n")("version", services.$rootScope.loc.ale);

		var self = this
		, TABS = {
				FARM 	: services.$filter("i18n")("farm", services.$rootScope.loc.ale, "farm"),
				PRESET 	: services.$filter("i18n")("text_presets", services.$rootScope.loc.ale, "farm"),
				LOG		: services.$filter("i18n")("log", services.$rootScope.loc.ale, "farm")
		}
		, TAB_ORDER = [
			TABS.FARM,
			TABS.PRESET,
			TABS.LOG,
			]

		$scope.update_all_presets = false;
		$scope.local_data_villages = [];
		$scope.requestedTab = TABS.FARM;
		$scope.TABS = TABS;
		$scope.TAB_ORDER = TAB_ORDER;
		$scope.data_villages = data_villages;
		$scope.data_farm = data_farm;
		$scope.text_version = $scope.version + " " + $scope.data_farm.version;
		$scope.list_exceptions = {};
		$scope.infinite = $scope.data_farm.infinite;
		$scope.toggle_option = "check_one";
		$scope.check_one = true;
		$scope.check_all = false;
		$scope.check_all_villages = false;
		

		var presetListModel = services.modelDataService.getPresetList()
		, presetIds = []
		, rallyPointSpeedBonusVsBarbarians = services.modelDataService.getWorldConfig().getRallyPointSpeedBonusVsBarbarians()
		, getVillage = function getVillage(vid){
			if(!vid){return}
			return angular.copy(services.modelDataService.getSelectedCharacter().getVillage(vid))
		}
		, getVillageData = function getVillageData(vid){
			if(!vid){return}
			return $scope.local_data_villages.find(f=>f.id==vid).value;
		}
		, setActiveTab = function setActiveTab(tab) {
			$scope.activeTab	= tab;
			$scope.requestedTab	= null;
		}
		, initTab = function initTab() {
			if (!$scope.activeTab) {
				setActiveTab($scope.requestedTab);
			}
		}
		, update = function update() {
			if(!$scope.infinite){
				if(!$scope.data_farm.farm_time_start || $scope.data_farm.farm_time_start < time.convertedTime()) {
					$scope.data_farm.farm_time_start = time.convertedTime();
				}
				if(!$scope.data_farm.farm_time_stop || $scope.data_farm.farm_time_stop < $scope.data_farm.farm_time_start) {
					$scope.data_farm.farm_time_stop = $scope.data_farm.farm_time_start + 86400000;
				}
			}
			services.FarmService.isRunning() && services.FarmService.isPaused() ? $scope.status = "paused" : services.FarmService.isRunning() && (typeof(services.FarmService.isPaused) == "function" && !services.FarmService.isPaused()) ? $scope.status = "running" : $scope.status = "stopped";
			if (!$scope.$$phase) {$scope.$apply();}
		}
		, get_dist = function get_dist(villageId, journey_time, units) {
			if($scope.activeTab != TABS.PRESET){return}
			var village = getVillageData(villageId)
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
		, get_time = function get_time(villageId, distance, units) {
			if($scope.activeTab != TABS.PRESET){return}
			var village = getVillageData(villageId)
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
		, triggerUpdate = function triggerUpdate() {
			presetIds = [];
			$scope.data.assignedPresetList = {}
			var presetId,
			assignPreset = function assignPreset(villageId) {
				if($scope.village_selected.id == villageId){
					$scope.data.assignedPresetList[+presetId] = true
					!presetIds.find(f=>f==presetId) ? presetIds.push(parseInt(presetId, 10)) : presetIds;
				}
			};
			for (presetId in $scope.data.presets) {
//				$scope.data.presets[presetId] = angular.merge({}, $scope.data_villages.villages[$scope.village_selected.data.villageId].presets[presetId])
				angular.extend($scope.data.presets[presetId], $scope.data_villages.villages[$scope.village_selected.id].presets[presetId])
				if(!$scope.data.presets[presetId].assigned_villages){continue}
				$scope.data.presets[presetId].assigned_villages.forEach(assignPreset);
			}
			setFirstPreset();
			
		}
		, updateBlur = function updateBlur(){
			if($scope.activeTab != TABS.PRESET){return}

			switch ($scope.toggle_option) {
			case "check_one":
				$scope.preset_selected.max_journey_distance = get_dist($scope.village_selected.id, $scope.preset_selected.max_journey_time, $scope.preset_selected.units)
				$scope.preset_selected.min_journey_distance = get_dist($scope.village_selected.id, $scope.preset_selected.min_journey_time, $scope.preset_selected.units);
				angular.extend($scope.data_villages.villages[$scope.village_selected.id].presets[$scope.preset_selected.id], $scope.preset_selected)
				angular.extend($scope.data_villages.villages[$scope.village_selected.id].presets, $scope.data_villages.villages[$scope.village_selected.id].presets)
				break;
			case "check_all":
				Object.keys($scope.data_villages.villages[$scope.village_selected.id].presets).map(function(elem){
					$scope.data_villages.villages[$scope.village_selected.id].presets[elem].max_journey_distance = get_dist($scope.village_selected.id, $scope.preset_selected.max_journey_time, $scope.data_villages.villages[$scope.village_selected.id].presets[elem].units)
					$scope.data_villages.villages[$scope.village_selected.id].presets[elem].max_journey_time = get_time($scope.village_selected.id, $scope.data_villages.villages[$scope.village_selected.id].presets[elem].max_journey_distance, $scope.data_villages.villages[$scope.village_selected.id].presets[elem].units)
					$scope.data_villages.villages[$scope.village_selected.id].presets[elem].min_journey_distance = get_dist($scope.village_selected.id, $scope.preset_selected.min_journey_time, $scope.data_villages.villages[$scope.village_selected.id].presets[elem].units) || 0
					$scope.data_villages.villages[$scope.village_selected.id].presets[elem].min_journey_time = get_time($scope.village_selected.id, $scope.data_villages.villages[$scope.village_selected.id].presets[elem].min_journey_distance, $scope.data_villages.villages[$scope.village_selected.id].presets[elem].units) || 0
					$scope.data_villages.villages[$scope.village_selected.id].presets[elem].min_points_farm = $scope.preset_selected.min_points_farm
					$scope.data_villages.villages[$scope.village_selected.id].presets[elem].max_points_farm = $scope.preset_selected.max_points_farm
					$scope.data_villages.villages[$scope.village_selected.id].presets[elem].max_commands_farm = $scope.preset_selected.max_commands_farm
				})
				triggerUpdate();
				break;
			case "check_all_villages":
				Object.keys($scope.data_villages.villages).map(function(village){
					Object.keys($scope.data_villages.villages[village].presets).map(function(elem){
						$scope.data_villages.villages[$scope.village_selected.id].presets[elem].max_journey_distance = get_dist($scope.village_selected.id, $scope.preset_selected.max_journey_time, $scope.data_villages.villages[$scope.village_selected.id].presets[elem].units)
						$scope.data_villages.villages[$scope.village_selected.id].presets[elem].max_journey_time = get_time($scope.village_selected.id, $scope.data_villages.villages[$scope.village_selected.id].presets[elem].max_journey_distance, $scope.data_villages.villages[$scope.village_selected.id].presets[elem].units)
						$scope.data_villages.villages[$scope.village_selected.id].presets[elem].min_journey_distance = get_dist($scope.village_selected.id, $scope.preset_selected.min_journey_time, $scope.data_villages.villages[$scope.village_selected.id].presets[elem].units) || 0
						$scope.data_villages.villages[$scope.village_selected.id].presets[elem].min_journey_time = get_time($scope.village_selected.id, $scope.data_villages.villages[$scope.village_selected.id].presets[elem].min_journey_distance, $scope.data_villages.villages[$scope.village_selected.id].presets[elem].units) || 0
						$scope.data_villages.villages[$scope.village_selected.id].presets[elem].min_points_farm = $scope.preset_selected.min_points_farm
						$scope.data_villages.villages[$scope.village_selected.id].presets[elem].max_points_farm = $scope.preset_selected.max_points_farm
						$scope.data_villages.villages[$scope.village_selected.id].presets[elem].max_commands_farm = $scope.preset_selected.max_commands_farm
					})
				})
				triggerUpdate();
				break;
			}

			if (!$scope.$$phase) {$scope.$apply();}
			services.$timeout(blurPreset, 1500)
		}
		, blurPreset = function blurPreset(){
			if($scope.activeTab != TABS.PRESET){return}
			var tmMax = helper.readableMilliseconds($scope.preset_selected.max_journey_time);
			if(tmMax.length == 7) {
				tmMax = "0" + tmMax;
			}
			document.getElementById("max_journey_time").value = tmMax;	
			var tmMin = helper.readableMilliseconds($scope.preset_selected.min_journey_time);
			if(tmMin.length == 7) {
				tmMin = "0" + tmMin;
			}
			document.getElementById("min_journey_time").value = tmMin;

			if (!$scope.$$phase) {$scope.$apply();}

		}
		, addQuadrant = function addQuadrant(pos){
			if(!$scope.village_selected || !$scope.preset_selected) {return}

			if($scope.update_all_presets){
				Object.keys($scope.data_villages.villages[$scope.village_selected.id].presets).map(function(elem){
					$scope.data_villages.villages[$scope.village_selected.id].presets[elem].quadrants.push(pos)
					$scope.data_villages.villages[$scope.village_selected.id].presets[elem].quadrants.sort(function(a,b){return a-b})
				})
//				$scope.data_villages.villages[$scope.village_selected.id].presets = obj;
			} else {
				$scope.data_villages.villages[$scope.village_selected.id].presets[$scope.preset_selected.id].quadrants.push(pos)
				$scope.data_villages.villages[$scope.village_selected.id].presets[$scope.preset_selected.id].quadrants.sort(function(a,b){return a-b})
			}
			if (!$scope.$$phase) {$scope.$apply();}
		}
		, remQuadrant = function remQuadrant(pos){
			if(!$scope.village_selected || !$scope.preset_selected || !$scope.data_villages.villages[$scope.village_selected.id].presets ||!$scope.data_villages.villages[$scope.village_selected.id].presets[$scope.preset_selected.id]) {return}

			if($scope.update_all_presets){
				Object.keys($scope.data_villages.villages[$scope.village_selected.id].presets).map(function(elem){
					$scope.data_villages.villages[$scope.village_selected.id].presets[elem].quadrants = $scope.data_villages.villages[$scope.village_selected.id].presets[elem].quadrants.filter(f => f != pos);
				})
//				$scope.data_villages.villages[$scope.village_selected.id].presets = obj;
			} else {
				$scope.data_villages.villages[$scope.village_selected.id].presets[$scope.preset_selected.id].quadrants = $scope.data_villages.villages[$scope.village_selected.id].presets[$scope.preset_selected.id].quadrants.filter(f => f != pos);
			}
			if (!$scope.$$phase) {$scope.$apply();}
		}
		, updateAll = function updateAll(){
			triggerUpdate();
			services.$timeout(blurPreset, 1500)
		}
		, getDetailsExceptions = function getDetailsExceptions() {
			var my_village_id = services.modelDataService.getSelectedVillage().getId();

			if(!Object.keys($scope.list_exceptions).length){
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
		}
		, setFirstPreset = function setFirstPreset(){
			let availableOptions  = Object.values($scope.data.presets).map(function(elem){return elem})
			$scope.preset_selected = availableOptions[0];
			$scope.data_preset = {
					"availableOptions" : availableOptions,
					"selectedOption" : $scope.preset_selected
			}
		}

		$scope.togleInfinite = function(){
			if($scope.infinite){
				$scope.infinite = false
			} else {
				$scope.infinite = true
			}
			$scope.data_farm.infinite = $scope.infinite; 
			update();
		}

		$scope.userSetActiveTab = function(tab){
			setActiveTab(tab);
		}

		$scope.toggleOption = function(option){
			$scope.toggle_option = option;

			switch (option) {
			case "check_one":
				$scope.check_one = true;
				$scope.check_all = false;
				$scope.check_all_villages = false;
				break;
			case "check_all":
				$scope.check_one = false;
				$scope.check_all = true;
				$scope.check_all_villages = false;
				break;
			case "check_all_villages":
				$scope.check_one = false;
				$scope.check_all = false;
				$scope.check_all_villages = true;
				break;
			}
			if (!$scope.$$phase) {$scope.$apply();}
		}

		$scope.blur = function (callback) {
			if($scope.activeTab != TABS.FARM){return}
			$scope.farm_time = $("#farm_time").val()
			if($scope.farm_time.length <= 5) {
				$scope.farm_time = $scope.farm_time + ":00"
			}
			$scope.data_farm.farm_time = helper.unreadableSeconds($scope.farm_time) * 1000 

			if(!$scope.infinite){
				$scope.inicio_de_farm = $("#inicio_de_farm").val()
				$scope.termino_de_farm = $("#termino_de_farm").val()
				$scope.data_termino_de_farm = $("#data_termino_de_farm").val()
				$scope.data_inicio_de_farm = $("#data_inicio_de_farm").val()

				var tempo_escolhido_inicio = new Date($scope.data_inicio_de_farm + " " + $scope.inicio_de_farm).getTime();
				var tempo_escolhido_termino = new Date($scope.data_termino_de_farm + " " + $scope.termino_de_farm).getTime();

				if(tempo_escolhido_inicio > tempo_escolhido_termino || !tempo_escolhido_termino) {
					tempo_escolhido_termino = new Date(tempo_escolhido_inicio + 2 * 86400000)
					$scope.termino_de_farm = services.$filter("date")(tempo_escolhido_termino, "HH:mm:ss");
					$scope.data_termino_de_farm = services.$filter("date")(tempo_escolhido_termino, "yyyy-MM-dd");
				}

				document.getElementById("data_termino_de_farm").value = services.$filter("date")(new Date(tempo_escolhido_termino), "yyyy-MM-dd");
				document.getElementById("data_inicio_de_farm").value = services.$filter("date")(new Date(tempo_escolhido_inicio), "yyyy-MM-dd");
				document.getElementById("termino_de_farm").value = services.$filter("date")(new Date(tempo_escolhido_termino), "HH:mm:ss");
				document.getElementById("inicio_de_farm").value = services.$filter("date")(new Date(tempo_escolhido_inicio), "HH:mm:ss");

				if(helper.unreadableSeconds($scope.farm_time) * 1000 == 0){
					$scope.infinite = true
				}

				$scope.data_farm.farm_time = helper.unreadableSeconds($scope.farm_time) * 1000
				$scope.data_farm.farm_time_start = tempo_escolhido_inicio
				$scope.data_farm.farm_time_stop = tempo_escolhido_termino
			}

			update()

			if(callback != undefined && typeof(callback) == "function") {
				callback()
			}
		}

		/*
		 * Presets
		 */

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
				'village_id': $scope.village_selected,
				'preset_ids': presetIds
			}, function(data){
				services.$timeout.cancel(timeout_preset)
				timeout_preset = undefined
				$scope.preset_selected = undefined;
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
			$scope.preset_selected =	$scope.data.presets[preset_id]
		}

		$scope.blurMaxJourney = function () {
			if($scope.activeTab == TABS.PRESET){
				var r = $("#max_journey_time").val() 
				if(r.length <= 5) {
					r = r + ":00"
				}

				$scope.data_farm.farm_time

				$scope.preset_selected.max_journey_time = helper.unreadableSeconds(r) * 1000
				services.modelDataService.getVillage($scope.village_selected)
				$scope.preset_selected.max_journey_distance = get_dist(services.modelDataService.getVillage($scope.village_selected.id).data.villageId, $scope.preset_selected.max_journey_time, $scope.preset_selected.units)
				updateBlur()
			}
		}

		$scope.blurMinJourney = function () {
			if($scope.activeTab == TABS.PRESET){
				var r = $("#min_journey_time").val() 
				if(r.length <= 5) {
					r = r + ":00"
				}
				$scope.preset_selected.min_journey_time = helper.unreadableSeconds(r) * 1000
				$scope.preset_selected.min_journey_distance = get_dist(services.modelDataService.getVillage($scope.village_selected.id).data.villageId, $scope.preset_selected.min_journey_time, $scope.preset_selected.units) || 0
				updateBlur()
			}
		}

		$scope.updateBlur = updateBlur;


		/*
		 * Villages
		 */

		$scope.getVillageInfo = function(villageId){
			var data = getVillageData(villageId).data
			return formatHelper.villageNameWithCoordinates(data)
		}

		$scope.setVillage = function (villageId) {
			$scope.data.assignedPresetList = {};
			$scope.village_selected = $scope.local_data_villages.find(f=>f.id==villageId);
		}

		/*
		 * Exceptions
		 */

		$scope.deleteException = function (id_village) {
			$scope.data_farm.list_exceptions = $scope.data_farm.list_exceptions.filter(f => f != id_village)
			getDetailsExceptions();
		}

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
			if(!$scope.village_selected || !$scope.preset_selected || !$scope.data_villages.villages[$scope.village_selected.id].presets ||!$scope.data_villages.villages[$scope.village_selected.id].presets[$scope.preset_selected.id]) {return}

			if($scope.data_villages.villages[$scope.village_selected.id].presets[$scope.preset_selected.id].quadrants.includes(pos)){
				remQuadrant(pos)
			} else {
				addQuadrant(pos)
			}
		}

		$scope.getQuadrant = function (pos) {
			if(!$scope.village_selected || !$scope.preset_selected || !$scope.data_villages.villages[$scope.village_selected.id].presets ||!$scope.data_villages.villages[$scope.village_selected.id].presets[$scope.preset_selected.id]) {return}
			return $scope.data_villages.villages[$scope.village_selected.id].presets[$scope.preset_selected.id].quadrants.includes(pos)
		}

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

		$scope.$watch("data_villages", function () {
			if(!$scope.data_villages) {return}
			data_villages = $scope.data_villages;
			data_villages.set();
		}, true)

		$scope.$watch("data_logs.farm", function(){
			$scope.recalcScrollbar();
			if (!$scope.$$phase) {$scope.$apply()}
		}, true)

		$scope.$watch("data_select", function(){
			if(!$scope.data_select){return}
			$scope.village_selected = $scope.data_select.selectedOption;
			updateAll()
		}, true)

		$scope.$watch("data_preset", function(){
			if(!$scope.data_preset || !blurPreset){return}
			$scope.preset_selected = $scope.data_preset.selectedOption;
			blurPreset();
			updateBlur();
		}, true)

		$scope.$watch("data_farm", function(){
			if(!$scope.data_farm){return}
			$scope.data_farm = $scope.data_farm;
			$scope.data_farm.set();
		}, true)

		$scope.$watch("activeTab", function(){
			if($scope.activeTab == TABS.PRESET){
				updateAll()
			} else if ($scope.activeTab == TABS.FARM){
				getDetailsExceptions()
			}
		}, true)

		$scope.$on("$destroy", function() {
			$scope.data_villages.set();
			$scope.data_farm.set();
		});

		$scope.setCollapse();

		initTab();
		getDetailsExceptions();

		Object.keys($scope.data_villages.villages).map(function(key){
			var vill = getVillage(key);
			$scope.local_data_villages.push({
				id : key,
				name : vill.data.name,
				label : formatHelper.villageNameWithCoordinates(vill.data),
				value : vill
			})
			return $scope.local_data_villages;
		})

		$scope.date_ref = new Date(0);
		$scope.tmMax = "0";
		$scope.tmMin = "0";
		$scope.village_selected = $scope.local_data_villages[Object.keys($scope.local_data_villages)[0]]
		$scope.isRunning = services.FarmService.isRunning();
		$scope.isPaused = services.FarmService.isPaused();
		
		let presets_load = angular.copy(services.presetListService.getPresets());
		$scope.data = {
				'assignedPresetList': {},
				'presets'			: presets_load,
				'hotkeys'			: services.storageService.getItem(services.presetService.getStorageKey()),
				"selectedOption"	: Object.values(presets_load)[0]
		}
		
		$scope.data_select = {
				"availableOptions" : $scope.local_data_villages,
				"selectedOption" : $scope.village_selected
		}
		
		triggerUpdate()
		update()

		return $scope;
	}
})
