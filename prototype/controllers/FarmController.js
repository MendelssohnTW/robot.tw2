define("robotTW2/controllers/FarmController", [
	"helper/time",
	"robotTW2/time",
	"robotTW2/services",
	"robotTW2/providers",
	"conf/conf"
	], function(
			helper,
			convertedTime,
			services,
			providers,
			conf_conf
	){
	return function FarmController($rootScope, $scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		$scope.START = services.$filter("i18n")("START", $rootScope.loc.ale);
		$scope.STOP = services.$filter("i18n")("STOP", $rootScope.loc.ale);
		$scope.PAUSE = services.$filter("i18n")("PAUSE", $rootScope.loc.ale);
		$scope.RESUME = services.$filter("i18n")("RESUME", $rootScope.loc.ale);
		var self = this;

		var TABS = {
				FARM 	: services.$filter("i18n")("farm", $rootScope.loc.ale, "farm"),
				PRESET 	: services.$filter("i18n")("preset", $rootScope.loc.ale, "farm"),
				LOG		: services.$filter("i18n")("log", $rootScope.loc.ale, "farm")
		}
		, TAB_ORDER = [
			TABS.FARM,
			TABS.PRESET,
			TABS.LOG,
			]

		$scope.requestedTab = TABS.FARM;
		$scope.TABS = TABS;
		$scope.TAB_ORDER = TAB_ORDER;

		var setActiveTab = function setActiveTab(tab) {
			$scope.activeTab								= tab;
			$scope.requestedTab								= null;
		}
		, initTab = function initTab() {
			if (!$scope.activeTab) {
				setActiveTab($scope.requestedTab);
			}
		}
		, presetListModel	= services.modelDataService.getPresetList()
		, presetIds = []
		, rallyPointSpeedBonusVsBarbarians = services.modelDataService.getWorldConfig().getRallyPointSpeedBonusVsBarbarians()
		, update = function () {

			if($rootScope.data_farm.farm_time_start < convertedTime()) {
				$rootScope.data_farm.farm_time_start = convertedTime();
			}

			if($rootScope.data_farm.farm_time_stop < $rootScope.data_farm.farm_time_start) {
				$rootScope.data_farm.farm_time_stop = $rootScope.data_farm.farm_time_start + 86400000;
			}

			services.FarmService.isRunning() && services.FarmService.isPaused() ? $scope.status = "paused" : services.FarmService.isRunning() && (typeof(services.FarmService.isPaused) == "function" && !services.FarmService.isPaused()) ? $scope.status = "running" : $scope.status = "stopped";
			if (!$scope.$$phase) {$scope.$apply();}
		}
		, get_dist = function (max_journey_time) {
			var village = services.modelDataService.getVillage($scope.villageSelected.data.villageId);
			var bonus = rallyPointSpeedBonusVsBarbarians[village.getBuildingData() ? village.getBuildingData().getDataForBuilding("rally_point").level :  1] * 100
			function return_min(tempo) {
				if (tempo != undefined) {
					var ar_tempo = tempo.split(":");
					var hr = parseInt(ar_tempo[0]) || 0;
					var min = parseInt(ar_tempo[1]) || 0;
					var seg = parseInt(ar_tempo[2]) || 0;
					return (hr * 60 + min +  seg / 60);
				} else {
					return 0;
				}
			}
			var list_select = []
			, timetable = services.modelDataService.getGameData().data.units.map(function (obj) {
				return [obj.name, obj.speed]
			})
			var units = $scope.presetSelected.units;
			for (un in units) {
				if (units.hasOwnProperty(un)) {
					if(units[un] > 0) {
						for(ch in timetable) {
							if (timetable.hasOwnProperty(ch)) {
								if (timetable[ch][0] == un) {
									list_select.push(timetable[ch]);
								}
							}
						}
					}
				}
			}

			if (list_select.length > 0) {
				list_select.sort(function (a, b) {return a[1] - b[1]});
				return Math.trunc((((max_journey_time / 60 / 1000 / list_select.pop()[1]) * (bonus / 100) * 0.75)) / 2);
			}
			return 0;
		}

		initTab();

		$scope.userSetActiveTab = function(tab){
			setActiveTab(tab);
			if($scope.activeTab == TABS.PRESET){
				$scope.presetSelected = $scope.data_villages.villages[$scope.villageSelected.data.villageId].presets[Object.keys($scope.data.assignedPresetList).map(
						function(elem){
							if($scope.data.assignedPresetList[elem]) {return elem} else {return undefined}
						}).filter(f=>f!=undefined)[0]];
				services.$timeout(blurPreset, 15000)
			}
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

				$rootScope.data_farm.farm_time = helper.unreadableSeconds($scope.farm_time) * 1000
				$rootScope.data_farm.farm_time_start = tempo_escolhido_inicio
				$rootScope.data_farm.farm_time_stop = tempo_escolhido_termino

				update()
			}

			if(callback != undefined && typeof(callback) == "function") {
				callback()
			}
		}

		/*
		 * Presets
		 */

		$scope.data = {
				'assignedPresetList': {},
				'presets'			: services.presetListService.getPresets(),
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

		var triggerUpdate = function triggerUpdate() {
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
				$scope.data.presets[presetId].assigned_villages.forEach(assignPreset);
			}
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

				$rootScope.data_farm.farm_time

				$scope.presetSelected.max_journey_time = helper.unreadableSeconds(r) * 1000
				$scope.presetSelected.max_journey_distance = get_dist($scope.presetSelected.max_journey_time)
			}
		}

		$scope.blurMinJourney = function () {
			if($scope.activeTab == TABS.PRESET){
				var r = $("#min_journey_time").val() 
				if(r.length <= 5) {
					r = r + ":00"
				}
				$scope.presetSelected.min_journey_time = helper.unreadableSeconds(r) * 1000
				$scope.presetSelected.min_journey_distance = get_dist($scope.presetSelected.min_journey_time)
			}
		}

		$scope.getName = function(assigned_preset){
			return $scope.data.presets[assigned_preset].name;
		}

		$scope.getIcon = function(assigned_preset){
			return $scope.data.presets[assigned_preset].icon;
		}

		var blurPreset = function(){
			if($scope.activeTab != TABS.PRESET){return}
			$scope.presetSelected.max_journey_distance = get_dist($scope.presetSelected.max_journey_time)
			$scope.presetSelected.min_journey_distance = get_dist($scope.presetSelected.min_journey_time)
			angular.extend($scope.villageSelected.presets, {[$scope.presetSelected.id]: $scope.presetSelected})
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

		};

		$scope.blurPreset = blurPreset;

		$scope.$watch("presetSelected", function(){
			if(!$scope.presetSelected || !blurPreset){return}
			blurPreset();
		}, true)

		$scope.$watch("villageSelected", function(){
			if(!$scope.villageSelected || !Object.keys($scope.data.assignedPresetList).length){return}
			!$scope.presetSelected ? $scope.presetSelected = $scope.data_villages.villages[$scope.villageSelected.data.villageId].presets[Object.keys($scope.data.assignedPresetList).map(
					function(elem){
						if($scope.data.assignedPresetList[elem]) {return elem} else {return undefined}
					}).filter(f=>f!=undefined)[0]] : $scope.presetSelected;
		}, true)


		/*
		 * Villages
		 */

		$scope.getVillage = function (id) {
			var village = services.modelDataService.getSelectedCharacter().getVillage(id);
			if(!village) {return null}
			return village.getName() + " / (" + village.getX() + "|" + village.getY() + ")"
		}

		$scope.setVillage = function (village) {
			$scope.data.assignedPresetList = {};
			$scope.villageSelected = village;
			triggerUpdate();
		}


		/*
		 * Exceptions
		 */

//		var my_village_id = services.modelDataService.getSelectedVillage().getId();

//		$scope.deleteException = function (id_village) {
//		$rootScope.data_farm.list_exceptions = $rootScope.data_farm.list_exceptions.filter(f => f != id_village)
//		getDetailsExceptions();
//		}

//		function getDetailsExceptions() {
//		$scope.list_exceptions = {};
//		$rootScope.data_farm.list_exceptions.forEach(function (vid) {
//		services.socketService.emit(providers.routeProvider.MAP_GET_VILLAGE_DETAILS, {
//		'village_id'	: vid,
//		'my_village_id'	: my_village_id,
//		'num_reports'	: 5
//		}, function (data) {
//		$scope.list_exceptions[data.village_id] = {
//		village_name : data.village_name,
//		village_x : data.village_x,
//		village_y : data.village_y
//		}
//		if (!$rootScope.$$phase) $rootScope.$apply();
//		})
//		})
//		}

//		getDetailsExceptions();

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

		var addQuadrant = function(pos){
			if(!$scope.villageSelected || !$scope.presetSelected) {return}
			$scope.villageSelected.presets[$scope.presetSelected.id].quadrants.push(pos)
			$scope.villageSelected.presets[$scope.presetSelected.id].quadrants.sort(function(a,b){return a-b})
		}

		var remQuadrant = function(pos){
			if(!$scope.villageSelected || !$scope.presetSelected || !$scope.villageSelected.presets ||!$scope.villageSelected.presets[$scope.presetSelected.id]) {return}
			$scope.villageSelected.presets[$scope.presetSelected.id].quadrants = $scope.villageSelected.presets[$scope.presetSelected.id].quadrants.filter(f => f != pos);
		}

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

			var tm = helper.readableMilliseconds($rootScope.data_farm.farm_time);
			if(tm.length == 7) {
				tm = "0" + tm;
			}
			return tm;
		}

		$rootScope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function ($event, data) {
			if(!data) {return} 
			update();
		})

		$scope.villageSelected = $rootScope.data_villages.villages[Object.keys($rootScope.data_villages.villages)[0]]

		triggerUpdate()

		$scope.isRunning = services.FarmService.isRunning();
		$scope.isPaused = services.FarmService.isPaused();
		update()

		$rootScope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function($event, data) {
			if (!$rootScope.$$phase) {
				$rootScope.$apply();
			}
		})

		$scope.recalcScrollbar();
		$scope.setCollapse();

		return $scope;
	}
})
