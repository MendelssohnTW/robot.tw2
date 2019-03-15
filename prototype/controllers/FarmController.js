define("robotTW2/controllers/FarmController", [
	"helper/time",
	"robotTW2/time",
	"robotTW2/services",
	"robotTW2/providers",
	"conf/conf",
	"robotTW2/calculateTravelTime",
	"robotTW2/databases/data_villages",
	"robotTW2/databases/data_farm",
	"helper/format",
	"robotTW2/autocomplete"
	], function(
			helper,
			time,
			services,
			providers,
			conf_conf,
			calculateTravelTime,
			data_villages,
			data_farm,
			formatHelper,
			autocomplete
	){
	return function FarmController($scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
		$scope.START = services.$filter("i18n")("START", services.$rootScope.loc.ale);
		$scope.STOP = services.$filter("i18n")("STOP", services.$rootScope.loc.ale);
		$scope.MENU = services.$filter("i18n")("MENU", services.$rootScope.loc.ale);
		$scope.REMOVE = services.$filter("i18n")("REMOVE", services.$rootScope.loc.ale);
		$scope.ADD = services.$filter("i18n")("ADD", services.$rootScope.loc.ale);
		$scope.SELECT = services.$filter("i18n")("SELECT", services.$rootScope.loc.ale);
		$scope.SEARCH_MAP = services.$filter('i18n')('SEARCH_MAP', services.$rootScope.loc.ale);
		$scope.version = services.$filter("i18n")("version", services.$rootScope.loc.ale);

		$scope.update_all_presets = false;
		$scope.local_data_villages = [];
		$scope.data_villages = data_villages;
		$scope.data_farm = data_farm;

		var self = this
		, TABS = {
				FARM 	: services.$filter("i18n")("text_farm", services.$rootScope.loc.ale, "farm"),
				LOG		: services.$filter("i18n")("log", services.$rootScope.loc.ale, "farm")
		}
		, TAB_ORDER = [
			TABS.FARM,
			TABS.LOG,
			]
		, r_farm_time
		, time_rest
		, presetListModel = services.modelDataService.getPresetList()
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
			if($scope.activeTab != TABS.FARM){return}
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
			if($scope.activeTab != TABS.FARM){return}
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
					$scope.data.assignedPresetList[+$scope.data.presets[key].id] = true
					!presetIds.find(f=>f==$scope.data.presets[key].id) ? presetIds.push(parseInt($scope.data.presets[key].id, 10)) : presetIds;
				}
			};
			for (key in $scope.data.presets) {
				if($scope.data.presets.hasOwnProperty(key)){
					angular.extend($scope.data.presets[key], $scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.presets[key].id])
					if(!$scope.data.presets[key].assigned_villages){continue}
					$scope.data.presets[key].assigned_villages.forEach(assignPreset);
				}
			}
			$scope.data.selectedOption = $scope.data.presets.find(f=>f.id==Object.keys($scope.data.assignedPresetList)[0])
			$("#select_preset")[0].selectedIndex = 0;

		}
		, updateBlur = function updateBlur(){
			if($scope.activeTab != TABS.FARM){return}

			switch ($scope.toggle_option) {
			case "check_one":
				$scope.data.selectedOption.max_journey_distance = get_dist($scope.village_selected.id, $scope.data.selectedOption.max_journey_time, $scope.data.selectedOption.units)
				$scope.data.selectedOption.min_journey_distance = get_dist($scope.village_selected.id, $scope.data.selectedOption.min_journey_time, $scope.data.selectedOption.units);
				$scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id] = $scope.data.selectedOption;
				break;
			case "check_all":
				Object.keys($scope.data_villages.villages[$scope.village_selected.id].presets).map(function(elem){
					$scope.data_villages.villages[$scope.village_selected.id].presets[elem].max_journey_distance = get_dist($scope.village_selected.id, $scope.data.selectedOption.max_journey_time, $scope.data_villages.villages[$scope.village_selected.id].presets[elem].units)
					$scope.data_villages.villages[$scope.village_selected.id].presets[elem].max_journey_time = get_time($scope.village_selected.id, $scope.data_villages.villages[$scope.village_selected.id].presets[elem].max_journey_distance, $scope.data_villages.villages[$scope.village_selected.id].presets[elem].units)
					$scope.data_villages.villages[$scope.village_selected.id].presets[elem].min_journey_distance = get_dist($scope.village_selected.id, $scope.data.selectedOption.min_journey_time, $scope.data_villages.villages[$scope.village_selected.id].presets[elem].units) || 0
					$scope.data_villages.villages[$scope.village_selected.id].presets[elem].min_journey_time = get_time($scope.village_selected.id, $scope.data_villages.villages[$scope.village_selected.id].presets[elem].min_journey_distance, $scope.data_villages.villages[$scope.village_selected.id].presets[elem].units) || 0
					$scope.data_villages.villages[$scope.village_selected.id].presets[elem].min_points_farm = $scope.data.selectedOption.min_points_farm
					$scope.data_villages.villages[$scope.village_selected.id].presets[elem].max_points_farm = $scope.data.selectedOption.max_points_farm
					$scope.data_villages.villages[$scope.village_selected.id].presets[elem].max_commands_farm = $scope.data.selectedOption.max_commands_farm
				})
				triggerUpdate();
				break;
			case "check_all_villages":
				Object.keys($scope.data_villages.villages).map(function(village){
					Object.keys($scope.data_villages.villages[village].presets).map(function(elem){
						$scope.data_villages.villages[village].presets[elem].max_journey_distance = get_dist(village, $scope.data.selectedOption.max_journey_time, $scope.data_villages.villages[village].presets[elem].units)
						$scope.data_villages.villages[village].presets[elem].max_journey_time = get_time(village, $scope.data_villages.villages[village].presets[elem].max_journey_distance, $scope.data_villages.villages[village].presets[elem].units)
						$scope.data_villages.villages[village].presets[elem].min_journey_distance = get_dist(village, $scope.data.selectedOption.min_journey_time, $scope.data_villages.villages[village].presets[elem].units) || 0
						$scope.data_villages.villages[village].presets[elem].min_journey_time = get_time(village, $scope.data_villages.villages[village].presets[elem].min_journey_distance, $scope.data_villages.villages[village].presets[elem].units) || 0
						$scope.data_villages.villages[village].presets[elem].min_points_farm = $scope.data.selectedOption.min_points_farm
						$scope.data_villages.villages[village].presets[elem].max_points_farm = $scope.data.selectedOption.max_points_farm
						$scope.data_villages.villages[village].presets[elem].max_commands_farm = $scope.data.selectedOption.max_commands_farm
					})
				})
				triggerUpdate();
				break;
			}

			if (!$scope.$$phase) {$scope.$apply();}
			services.$timeout(blurPreset, 1500)
		}
		, blurPreset = function blurPreset(){
			if($scope.activeTab != TABS.FARM || !$scope.data.selectedOption){return}
			var tmMax = "00:00:00"
				, tmMin = "00:00:00";
			if($scope.data.selectedOption){
				tmMax = helper.readableMilliseconds($scope.data.selectedOption.max_journey_time);
				if(tmMax.length == 7) {
					tmMax = "0" + tmMax;
				}
				tmMin = helper.readableMilliseconds($scope.data.selectedOption.min_journey_time);
				if(tmMin.length == 7) {
					tmMin = "0" + tmMin;
				}
			}
			document.getElementById("max_journey_time").value = tmMax;
			document.getElementById("min_journey_time").value = tmMin;
			if (!$scope.$$phase) {$scope.$apply();}
		}
		, addQuadrant = function addQuadrant(pos){
			if(!$scope.village_selected || !$scope.data.selectedOption) {return}

			switch ($scope.toggle_option) {
			case "check_one":
				$scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants.push(pos)
				$scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants.sort(function(a,b){return a-b})
				break;
			case "check_all":
				$scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants.push(pos)
				$scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants.sort(function(a,b){return a-b})
				Object.keys($scope.data_villages.villages[$scope.village_selected.id].presets).map(function(elem){
					$scope.data_villages.villages[$scope.village_selected.id].presets[elem].quadrants = $scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants;
				})
				break;
			case "check_all_villages":
				$scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants.push(pos)
				$scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants.sort(function(a,b){return a-b})
				Object.keys($scope.data_villages.villages).map(function(village){
					Object.keys($scope.data_villages.villages[village].presets).map(function(elem){
						$scope.data_villages.villages[village].presets[elem].quadrants = $scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants;
					})
				})
				break;
			}
			if (!$scope.$$phase) {$scope.$apply();}
		}
		, remQuadrant = function remQuadrant(pos){
			if(!$scope.village_selected || !$scope.data.selectedOption || !$scope.data_villages.villages[$scope.village_selected.id].presets ||!$scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id]) {return}

			switch ($scope.toggle_option) {
			case "check_one":
				$scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants = $scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants.filter(f => f != pos);
				break;
			case "check_all":
				$scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants = $scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants.filter(f => f != pos);
				Object.keys($scope.data_villages.villages[$scope.village_selected.id].presets).map(function(elem){
					$scope.data_villages.villages[$scope.village_selected.id].presets[elem].quadrants = $scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants
				})
				break;
			case "check_all_villages":
				$scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants = $scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants.filter(f => f != pos);
				Object.keys($scope.data_villages.villages).map(function(village){
					Object.keys($scope.data_villages.villages[village].presets).map(function(elem){
						$scope.data_villages.villages[village].presets[elem].quadrants = $scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants;
					})
				})
				break;
			}
			if (!$scope.$$phase) {$scope.$apply();}
		}
		, updateAll = function updateAll(){
			triggerUpdate();
			services.$timeout(blurPreset, 1500)
		}
		, getDetailsExceptions = function getDetailsExceptions(opt) {
			var my_village_id = services.modelDataService.getSelectedVillage().getId();
			if(opt){
				$scope.data_exception.availableOptions = [];
			}

			if(!$scope.data_exception.availableOptions.length){
				$scope.data_farm.list_exceptions.forEach(function (vid) {
					services.socketService.emit(providers.routeProvider.MAP_GET_VILLAGE_DETAILS, {
						'village_id'	: vid,
						'my_village_id'	: my_village_id,
						'num_reports'	: 5
					}, function (data) {
						if(!$scope.data_exception.availableOptions.find(f=>f.village_id == data.village_id)){
							$scope.data_exception.availableOptions.push(
									{
										village_id 		: data.village_id,
										village_name 	: data.village_name,
										village_x 		: data.village_x,
										village_y 		: data.village_y,
										label			: formatHelper.villageNameWithCoordinates(data)
									}
							)
						}
						$scope.data_exception.selectedOption = $scope.data_exception.availableOptions[0]
						if (!$scope.$$phase) {$scope.$apply()}
					})
				})
			}
		}
		, getFarmTime = function getFarmTime() {
			var tm = helper.readableMilliseconds($scope.data_farm.farm_time);
			if(tm.length == 7) {
				tm = "0" + tm;
			}
			return tm;
		}

		$scope.set_farm_time = function(){
			r_farm_time = $("#farm_time").val()
			if(r_farm_time.length <= 5) {
				r_farm_time = r_farm_time + ":00"
			}
			$scope.data_farm.farm_time = helper.unreadableSeconds(r_farm_time) * 1000;
			blur();
		}

		$scope.getStatus = function(){
			if($scope.status == "running"){
				if(time_rest <= 0){
					return $scope.text_execute;
				} else {
					return $scope.text_wait;
				}
			} 
			return $scope.text_stop;
		}

		$scope.getTimeRest = function(){
			time_rest = $scope.data_farm.complete > time.convertedTime() && services.FarmService.isRunning() ? helper.readableMilliseconds($scope.data_farm.complete - time.convertedTime()) : 0;
			return time_rest;
		}

		$scope.togleInfinite = function(){
			if($scope.infinite){
				$scope.infinite = false
			} else {
				$scope.infinite = true
			}
			$scope.data_farm.infinite = $scope.infinite; 
			$scope.blur();
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

				if(helper.unreadableSeconds(r_farm_time) * 1000 == 0){
					$scope.infinite = true
				}

				$scope.data_farm.farm_time = helper.unreadableSeconds(r_farm_time) * 1000
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

		$scope.assignPresets = function assignPresets() {
			var timeout_preset = services.$timeout(function(){
				triggerUpdate()
			}, conf_conf.LOADING_TIMEOUT)

			services.socketService.emit(providers.routeProvider.ASSIGN_PRESETS, {
				'village_id': $scope.village_selected.id,
				'preset_ids': presetIds
			}, function(data){
				services.$timeout.cancel(timeout_preset)
				timeout_preset = undefined
				$scope.data.selectedOption = undefined;
				triggerUpdate()
			});

		}

		$scope.assignPreset = function assignPreset() {
			let presetId = $scope.data_preset.selectedOption.id;
			!presetIds.find(f=>f==presetId) ? presetIds.push(parseInt(presetId, 10)) : presetIds;
			$scope.assignPresets();
		}

		$scope.unassignPreset = function unassignPreset() {
			let presetId = $scope.data_preset.selectedOption.id;
			presetIds.splice(presetIds.indexOf(presetId), 1);
			$scope.assignPresets();
		}

		$scope.blurMaxJourney = function () {
			if($scope.activeTab == TABS.FARM){
				var r = $("#max_journey_time").val() 
				if(r.length <= 5) {
					r = r + ":00"
				}
				$scope.data.selectedOption.max_journey_time = helper.unreadableSeconds(r) * 1000
				services.modelDataService.getVillage($scope.village_selected)
				$scope.data.selectedOption.max_journey_distance = get_dist(services.modelDataService.getVillage($scope.village_selected.id).data.villageId, $scope.data.selectedOption.max_journey_time, $scope.data.selectedOption.units)
				updateBlur()
			}
		}

		$scope.blurMinJourney = function () {
			if($scope.activeTab == TABS.FARM){
				var r = $("#min_journey_time").val() 
				if(r.length <= 5) {
					r = r + ":00"
				}
				$scope.data.selectedOption.min_journey_time = helper.unreadableSeconds(r) * 1000
				$scope.data.selectedOption.min_journey_distance = get_dist(services.modelDataService.getVillage($scope.village_selected.id).data.villageId, $scope.data.selectedOption.min_journey_time, $scope.data.selectedOption.units) || 0
				updateBlur()
			}
		}

		$scope.updateBlur = updateBlur;

		$scope.shouldShow = function(item){
			return Object.keys($scope.data.assignedPresetList).find(f=>f==item.id);
		}

		$scope.shouldntShow = function(item){
			return !Object.keys($scope.data.assignedPresetList).find(f=>f==item.id);
		}

		/*
		 * Exceptions
		 */

		$scope.deleteException = function () {
			let id_village = $scope.data_exception.selectedOption.village_id
			if($scope.data_farm.list_exceptions.find(f=>f==id_village)){
				$scope.data_farm.list_exceptions = $scope.data_farm.list_exceptions.filter(f => f != id_village)
				getDetailsExceptions(true);
			}
		}

		$scope.addException = function () {
			let id_village = $scope.item.id;
			if(!$scope.data_farm.list_exceptions.find(f=>f==id_village)){
				$scope.data_farm.list_exceptions.push(id_village)
				getDetailsExceptions(true);
			}
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

		$scope.menu = function () {
			services.$rootScope.$broadcast(providers.eventTypeProvider.OPEN_MAIN);
		}

		/*
		 * Quadrants
		 */

		$scope.setQuadrant = function (pos) {
			if(!$scope.village_selected || !$scope.data.selectedOption || !$scope.data_villages.villages[$scope.village_selected.id].presets ||!$scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id]) {return}

			if($scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants.includes(pos)){
				remQuadrant(pos)
			} else {
				addQuadrant(pos)
			}
		}

		$scope.getQuadrant = function (pos) {
			if(!$scope.village_selected || !$scope.data.selectedOption || !$scope.data_villages.villages[$scope.village_selected.id].presets ||!$scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id]) {return}
			return $scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants.includes(pos)
		}

		/* Properties of item	
		 * 		
		displayedName: "name village com coordenadas"
		id: id_village
		leftIcon: "size-34x34 icon-26x26-rte-village"
		name: "name village"
		owner_id: id player
		owner_name: "name player"
		type: "village"
		x: 466
		y: 486

		 */

		$scope.autoCompleteKey = function(event){
			let obj_autocomplete = {
					'type'					: 'village',
					'placeholder'			: $scope.SEARCH_MAP,
					'onEnter'				: function(item, element){ //Filtra somente as aldeias bárbaras - aldeias sem owner_id representam aldeias bárbaras
						$scope.item = item
						element[0].firstElementChild.value = item.displayedName
						if (!$scope.$$phase) {$scope.$apply()}
					},
					'exclude'				: function(elem){
						return elem.owner_id == undefined
					},
					"inputValueReadOnly" 	: "",
					"keepSelected"			: false
			}

			let object_scope = {
					"inputValue" 	: event.srcElement.value,
					"element" 		: $($("#autocomplete_farm")[0]),
					"id" 			: "autocomplete_farm",
					"autoComplete" 	: obj_autocomplete
			}
//			angular.extend($scope, object_scope)
			autocomplete(object_scope, event);
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

//		$scope.$watch("data_preset", function(){
//		if(!$scope.data_preset || !blurPreset){return}
//		$scope.data.selectedOption = $scope.data_preset.selectedOption;
//		blurPreset();
//		}, true)

		$scope.$watch("data_farm", function(){
			if(!$scope.data_farm){return}
			$scope.data_farm.set();
		}, true)

		$scope.$watch("activeTab", function(){
			if($scope.activeTab == TABS.FARM){
				updateAll()
				getDetailsExceptions()
			}
		}, true)

		$scope.$on("$destroy", function() {
			$scope.data_villages.set();
			$scope.data_farm.set();
		});

		Object.keys($scope.data_villages.villages).map(function(key){
			var vill = getVillage(key);
			$scope.local_data_villages.push({
				id : parseInt(key, 10),
				name : vill.data.name,
				label : formatHelper.villageNameWithCoordinates(vill.data),
				value : vill
			})
			$scope.local_data_villages.sort(function(a,b){return a.label.localeCompare(b.label)})
			return $scope.local_data_villages;
		})

		$scope.village_selected = $scope.local_data_villages[0]
		$scope.text_version = $scope.version + " " + $scope.data_farm.version;
		$scope.infinite = $scope.data_farm.infinite;
		$scope.toggle_option = "check_one";
		$scope.requestedTab = TABS.FARM;
		$scope.TABS = TABS;
		$scope.TAB_ORDER = TAB_ORDER;
		$scope.check_one = true;
		$scope.check_all = false;
		$scope.check_all_villages = false;
		$scope.item = {}
		$scope.date_ref = new Date(0);
		$scope.tmMax = "0";
		$scope.tmMin = "0";
		$scope.isRunning = services.FarmService.isRunning();
		$scope.isPaused = services.FarmService.isPaused();
		$scope.t_farm_time = getFarmTime();
		let loads_p = angular.copy(services.presetListService.getPresets());
		let presets_load = Object.keys(loads_p).map(function(key){return loads_p[key]});
		$scope.data = {
				'assignedPresetList': {},
				'presets'			: presets_load,
				'hotkeys'			: services.storageService.getItem(services.presetService.getStorageKey()),
				"selectedOption" 	: {},
				"selectedOptionOut"	: {}
		}

		$scope.data_select = {
				"availableOptions" : $scope.local_data_villages,
				"selectedOption" : $scope.village_selected
		}

		$scope.data_exception = {
				"availableOptions" : [],
				"selectedOption" : {}
		}

//		$scope.setCollapse();

		initTab();
		getDetailsExceptions();

		triggerUpdate()
		update()

		return $scope;
	}
})
