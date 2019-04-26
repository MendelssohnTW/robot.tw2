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
	"robotTW2/autocomplete",
	"helper.unreadableSeconds"
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
			autocomplete,
			unreadableSeconds
	){
	return function FarmController($scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
		$scope.START = services.$filter("i18n")("START", services.$rootScope.loc.ale);
		$scope.STOP = services.$filter("i18n")("STOP", services.$rootScope.loc.ale);
		$scope.CREATE = services.$filter("i18n")("CREATE", services.$rootScope.loc.ale);
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
		, presetId
		, r_farm_time
		, time_rest
		, presetListModel = services.modelDataService.getPresetList()
		, presetIds = []
		, rallyPointSpeedBonusVsBarbarians = services.modelDataService.getWorldConfig().getRallyPointSpeedBonusVsBarbarians()
		, getVillage = function getVillage(vid){
			if(!vid){return}
			return angular.copy(services.modelDataService.getSelectedCharacter().getVillage(vid))
		}
		, update = function update() {
			if(!$scope.data_farm.infinite){
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
			var village = services.modelDataService.getSelectedCharacter().getVillage(villageId)
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
		, get_time = function get_time(villageId, bb, units) {
			var village = modelDataService.getVillage(village_id)
			, distance =  math.actualDistance(village.getPosition(), {
				'x'			: bb.x,
				'y'			: bb.y
			})
			, army = {
				'officers'	: {},
				"units"		: units
			}
			, travelTime = calculateTravelTime(army, village, "attack", {
				'barbarian'		: true
			})

			return armyService.getTravelTimeForDistance(army, travelTime, distance, "attack") * 1000
		}
		, assignPresets = function assignPresets(id, callback) {
			var timeout_preset = services.$timeout(function(){
				if(callback && typeof(callback)=="function"){
					callback()	
				}
			}, conf_conf.LOADING_TIMEOUT)

			services.socketService.emit(providers.routeProvider.ASSIGN_PRESETS, {
				'village_id': id,
				'preset_ids': presetIds
			}, function(data){
				services.$timeout.cancel(timeout_preset)
				timeout_preset = undefined
				$("#select_preset")[0].selectedIndex = 0;
				$("#select_preset_out")[0].selectedIndex = 0;
				if(callback && typeof(callback)=="function"){
					callback()	
				}
			});
		}
		, assignPresetForVill = function assignPresetForVill(villageId, key) {
			if($scope.village_selected.id == villageId){
				$scope.data.assignedPresetList[+$scope.data.presets[key].id] = true
				!presetIds.find(f=>f==$scope.data.presets[key].id) ? presetIds.push(parseInt($scope.data.presets[key].id, 10)) : presetIds;
			}
		}
		, triggerUpdate = function triggerUpdate() {
			presetIds = [];
			$scope.data.assignedPresetList = {}
			for (key in $scope.data.presets) {
				if($scope.data.presets.hasOwnProperty(key)){
					angular.extend($scope.data.presets[key], $scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.presets[key].id])
					if(!$scope.data.presets[key].assigned_villages){continue}
					$scope.data.presets[key].assigned_villages.forEach(function(villageId){
						assignPresetForVill(villageId, key)
					});
				}
			}
			$scope.data.selectedOption = $scope.data.presets.find(f=>f.id==Object.keys($scope.data.assignedPresetList)[0])
		}
		, updateBlur = function updateBlur(){
			switch ($scope.toggle_option) {
			case "check_one":
				$scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].max_journey_distance = get_dist($scope.village_selected.id, $scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].max_journey_time, $scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].units)
//				$scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].max_journey_time = get_time($scope.village_selected.id, $scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].max_journey_distance, $scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].units)
				$scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].min_journey_distance = get_dist($scope.village_selected.id, $scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].min_journey_time, $scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].units) || 0
//				$scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].min_journey_time = get_time($scope.village_selected.id, $scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].min_journey_distance, $scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].units) || 0
				$scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].min_points_farm = $scope.data.selectedOption.min_points_farm
				$scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].max_points_farm = $scope.data.selectedOption.max_points_farm
				$scope.data_villages.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].max_commands_farm = $scope.data.selectedOption.max_commands_farm
				$scope.data_villages.set();
				break;
			case "check_all":
				Object.keys($scope.data_villages.villages[$scope.village_selected.id].presets).map(function(elem){
					$scope.data_villages.villages[$scope.village_selected.id].presets[elem].max_journey_distance = get_dist($scope.village_selected.id, $scope.data_villages.villages[$scope.village_selected.id].presets[elem].max_journey_time, $scope.data_villages.villages[$scope.village_selected.id].presets[elem].units)
//					$scope.data_villages.villages[$scope.village_selected.id].presets[elem].max_journey_time = get_time($scope.village_selected.id, $scope.data_villages.villages[$scope.village_selected.id].presets[elem].max_journey_distance, $scope.data_villages.villages[$scope.village_selected.id].presets[elem].units)
					$scope.data_villages.villages[$scope.village_selected.id].presets[elem].min_journey_distance = get_dist($scope.village_selected.id, $scope.data_villages.villages[$scope.village_selected.id].presets[elem].min_journey_time, $scope.data_villages.villages[$scope.village_selected.id].presets[elem].units) || 0
//					$scope.data_villages.villages[$scope.village_selected.id].presets[elem].min_journey_time = get_time($scope.village_selected.id, $scope.data_villages.villages[$scope.village_selected.id].presets[elem].min_journey_distance, $scope.data_villages.villages[$scope.village_selected.id].presets[elem].units) || 0
					$scope.data_villages.villages[$scope.village_selected.id].presets[elem].min_points_farm = $scope.data.selectedOption.min_points_farm
					$scope.data_villages.villages[$scope.village_selected.id].presets[elem].max_points_farm = $scope.data.selectedOption.max_points_farm
					$scope.data_villages.villages[$scope.village_selected.id].presets[elem].max_commands_farm = $scope.data.selectedOption.max_commands_farm
				})
				$scope.data_villages.set();
				break;
			case "check_all_villages":
				Object.keys($scope.data_villages.villages).map(function(village){
					Object.keys($scope.data_villages.villages[village].presets).map(function(elem){
						$scope.data_villages.villages[village].presets[elem].max_journey_distance = get_dist(village, $scope.data_villages.villages[village].presets[elem].max_journey_time, $scope.data_villages.villages[village].presets[elem].units)
//						$scope.data_villages.villages[village].presets[elem].max_journey_time = get_time(village, $scope.data_villages.villages[village].presets[elem].max_journey_distance, $scope.data_villages.villages[village].presets[elem].units)
						$scope.data_villages.villages[village].presets[elem].min_journey_distance = get_dist(village, $scope.data_villages.villages[village].presets[elem].min_journey_time, $scope.data_villages.villages[village].presets[elem].units) || 0
//						$scope.data_villages.villages[village].presets[elem].min_journey_time = get_time(village, $scope.data_villages.villages[village].presets[elem].min_journey_distance, $scope.data_villages.villages[village].presets[elem].units) || 0
						$scope.data_villages.villages[village].presets[elem].min_points_farm = $scope.data.selectedOption.min_points_farm
						$scope.data_villages.villages[village].presets[elem].max_points_farm = $scope.data.selectedOption.max_points_farm
						$scope.data_villages.villages[village].presets[elem].max_commands_farm = $scope.data.selectedOption.max_commands_farm
					})
				})
				$scope.data_villages.set();
				break;
			}
			triggerUpdate();

			services.$timeout(blurPreset, 1500)
		}
		, blurPreset = function blurPreset(){
			if(!$scope.data.selectedOption || !document.getElementById("max_journey_time") || !document.getElementById("min_journey_time")){return}
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
		, update_all = function update_all(){
			$scope.data_select.selectedOption = $scope.local_data_villages.find(f=>f.id==services.modelDataService.getSelectedCharacter().getSelectedVillage().getId())
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
			$scope.data_farm.farm_time = unreadableSeconds(r_farm_time) * 1000;
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
			time_rest = $scope.data_farm.complete > time.convertedTime() ? helper.readableMilliseconds($scope.data_farm.complete - time.convertedTime()) : 0;
			return time_rest;
		}

		$scope.toggleInfinite = function(){
			if($scope.data_farm.infinite){
				$scope.data_farm.infinite = false
			} else {
				$scope.data_farm.infinite = true
			}
			$scope.blur();
		}

		$scope.toggleAttacked = function(){
			if($scope.data_farm.attacked){
				$scope.data_farm.attacked = false
			} else {
				$scope.data_farm.attacked = true
			}
			$scope.blur();
		}

		$scope.toggleUnitDirection = function(){
			if($scope.data_farm.unit_direction){
				$scope.data_farm.unit_direction = false
			} else {
				$scope.data_farm.unit_direction = true
			}
			$scope.blur();
		}

		$scope.toggleSpeedDirection = function(){
			if($scope.data_farm.speed_direction){
				$scope.data_farm.speed_direction = false
			} else {
				$scope.data_farm.speed_direction = true
			}
			$scope.blur();
		}

		$scope.toggleCicleDistinct = function(){
			if($scope.data_farm.cicle_distinct){
				$scope.data_farm.cicle_distinct = false
			} else {
				$scope.data_farm.cicle_distinct = true
			}
			$scope.blur();
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
			if(!$scope.data_farm.infinite){
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

				if(unreadableSeconds(r_farm_time) * 1000 == 0){
					$scope.data_farm.infinite = true
				}

				$scope.data_farm.farm_time = unreadableSeconds(r_farm_time) * 1000
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

		$scope.assignPreset = function assignPreset() {
			let presetId = $scope.data.selectedOptionOut.id;
			!presetIds.find(f=>f==presetId) ? presetIds.push(parseInt(presetId, 10)) : presetIds;
			assignPresets($scope.village_selected.id, triggerUpdate);
		}

		$scope.assignAllPreset = function assignAllPreset() {
			$scope.data.presets.forEach(function(preset){
				!presetIds.find(f=>f==preset.id) ? presetIds.push(preset.id) : presetIds;
			});
			assignPresets($scope.village_selected.id, triggerUpdate);
		}

		$scope.assignAllPresetAllVillages = function assignAllPresetAllVillages() {
			$scope.data.presets.forEach(function(preset){
				!presetIds.find(f=>f==preset.id) ? presetIds.push(preset.id) : presetIds;
			});
			
			$scope.local_data_villages.forEach(function(vill){
				assignPresets(vill.id);	
			})
			
			triggerUpdate()
		}

		$scope.unassignPreset = function unassignPreset() {
			let presetId = $scope.data.selectedOption.id;
			presetIds.splice(presetIds.indexOf(presetId), 1);
			assignPresets($scope.village_selected.id, triggerUpdate);
		}
		
		$scope.unassignAllPreset = function unassignAllPreset() {
			presetIds = []
			assignPresets($scope.village_selected.id, triggerUpdate);
		}
		
		$scope.unassignAllPresetAllVillages = function unassignAllPresetAllVillages() {
			presetIds = []
			$scope.local_data_villages.forEach(function(vill){
				assignPresets(vill.id);	
			})
			
			triggerUpdate()
		}
		
		$scope.createPresets = function createPresets(){
			function create_preset(preset, id){

				let units = {};
				let officers = {};
				services.modelDataService.getGameData().getOrderedUnitNames().forEach(function(unitName) {
					units[unitName] = 0;
				});

				services.modelDataService.getGameData().getOrderedOfficerNames().forEach(function(officerName) {
					officers[officerName] = false;
				});

				let qtd = Object.values(preset)[0];
				let unit = Object.keys(preset)[0];
				units[unit] = qtd;
				let trad_unit = services.$filter("i18n")(unit, services.$rootScope.loc.ale, "units")
				, d_preset = {
					"catapult_target": null,
					"icon": parseInt("0c0b0c", 16),
					"name": $scope.name_preset + " " + trad_unit,
					"officers": officers,
					"units": units,
					"village_id": id
				}
				services.socketService.emit(providers.routeProvider.SAVE_NEW_PRESET, d_preset);
			}
			
			function df(opt){

//				if(!opt){
//					if(!services.modelDataService.getPresetList().isLoadedValue){
//						services.socketService.emit(providers.routeProvider.GET_PRESETS, {}, function(){
//							return df(true)
//						});
//					} else {
//						return df(true)
//					}
//					return
//				}

				let list_presets = [
					{"spear": $scope.qtd_preset},
					{"sword": $scope.qtd_preset},
					{"archer": $scope.qtd_preset},
					{"axe": $scope.qtd_preset},
					{"light_cavalry": $scope.qtd_preset},
					{"mounted_archer": $scope.qtd_preset},
					{"heavy_cavalry": $scope.qtd_preset}
					]

				let psts_load = angular.copy(services.presetListService.getPresets())

				let pri_vill = services.modelDataService.getSelectedCharacter().getVillage($scope.village_selected.id)
				for (var preset in list_presets){
					if(list_presets.hasOwnProperty(preset)){
						if(psts_load == undefined || Object.values(psts_load).length == 0 || !Object.values(psts_load).map(function(elem){
							return elem.name
						}).find(f => f == $scope.name_preset + " " + services.$filter("i18n")(Object.keys(list_presets[preset])[0], services.$rootScope.loc.ale, "units"))){
							create_preset(list_presets[preset], pri_vill.getId())
						}
					}
				}
			}
			
			df()
		}

		$scope.blurMaxJourney = function () {
			var r = $("#max_journey_time").val() 
			if(r.length <= 5) {
				r = r + ":00"
			}
			let v_d = $scope.data_villages.villages[$scope.village_selected.id]
			, vill_d = v_d.presets[$scope.data.selectedOption.id]
			switch ($scope.toggle_option) {
			case "check_one":
				vill_d.max_journey_time = unreadableSeconds(r) * 1000
				vill_d.max_journey_distance = get_dist(services.modelDataService.getSelectedCharacter().getVillage($scope.village_selected.id).data.villageId, vill_d.max_journey_time, vill_d.units)
				break;
			case "check_all":
				Object.keys(v_d.presets).map(function(elem){
					v_d.presets[elem].max_journey_time = unreadableSeconds(r) * 1000
					v_d.presets[elem].max_journey_distance = get_dist(services.modelDataService.getSelectedCharacter().getVillage($scope.village_selected.id).data.villageId, v_d.presets[elem].max_journey_time, v_d.presets[elem].units)
				})
				break;
			case "check_all_villages":
				Object.keys($scope.data_villages.villages).map(function(village){
					Object.keys($scope.data_villages.villages[village].presets).map(function(elem){
						$scope.data_villages.villages[village].presets[elem].max_journey_time = unreadableSeconds(r) * 1000
						$scope.data_villages.villages[village].presets[elem].max_journey_distance = get_dist(village, $scope.data_villages.villages[village].presets[elem].max_journey_time, $scope.data_villages.villages[village].presets[elem].units)
					})
				})
				break;
			}
			updateBlur()
		}

		$scope.blurMinJourney = function () {
			var r = $("#min_journey_time").val() 
			if(r.length <= 5) {
				r = r + ":00"
			}
			let v_d = $scope.data_villages.villages[$scope.village_selected.id]
			, vill_d = v_d.presets[$scope.data.selectedOption.id]
			switch ($scope.toggle_option) {
			case "check_one":
				Object.keys(v_d.presets).map(function(elem){
					vill_d.min_journey_time = unreadableSeconds(r) * 1000
					vill_d.min_journey_distance = get_dist(services.modelDataService.getSelectedCharacter().getVillage($scope.village_selected.id).data.villageId, vill_d.min_journey_time, vill_d.units)
				})
				break;
			case "check_all":
				v_d.presets[elem].min_journey_time = unreadableSeconds(r) * 1000
				v_d.presets[elem].min_journey_distance = get_dist(services.modelDataService.getSelectedCharacter().getVillage($scope.village_selected.id).data.villageId, v_d.presets[elem].min_journey_time, v_d.presets[elem].units)
				break;
			case "check_all_villages":
				Object.keys($scope.data_villages.villages).map(function(village){
					Object.keys($scope.data_villages.villages[village].presets).map(function(elem){
						$scope.data_villages.villages[village].presets[elem].min_journey_time = unreadableSeconds(r) * 1000
						$scope.data_villages.villages[village].presets[elem].min_journey_distance = get_dist(village, $scope.data_villages.villages[village].presets[elem].min_journey_time, $scope.data_villages.villages[village].presets[elem].units)
					})
				})
				break;
			}
			updateBlur()
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
			$scope.data_villages.set();
		}, true)

		$scope.$watch("data_logs.farm", function(){
			$scope.recalcScrollbar();
			if (!$scope.$$phase) {$scope.$apply()}
		}, true)

		$scope.$watch("data.selectedOption", function(){
			if(!$scope.data.selectedOption){return}
			blurPreset()
		}, true)

		$scope.$watch("data_select", function(){
			if(!$scope.data_select){return}
			$scope.village_selected = $scope.data_select.selectedOption;
			services.villageService.setSelectedVillage($scope.data_select.selectedOption.id)
			update_all()
		}, true)

		$scope.$watch("data_farm", function(){
			if(!$scope.data_farm){return}
			$scope.data_farm.set();
		}, true)

		$scope.$on("$destroy", function() {
			$scope.data_villages.set();
			$scope.data_farm.set();
		});

		$scope.$on(providers.eventTypeProvider.VILLAGE_SELECTED_CHANGED, update_all);
		$scope.$on(providers.eventTypeProvider.ARMY_PRESET_ASSIGNED, triggerUpdate);
		$scope.$on(providers.eventTypeProvider.ARMY_PRESET_SAVED, triggerUpdate);

		$scope.local_data_villages = services.VillService.getLocalVillages("farm", "label");

		$scope.village_selected = $scope.local_data_villages.find(f=>f.id==services.modelDataService.getSelectedCharacter().getSelectedVillage().getId())
		$scope.text_version = $scope.version + " " + $scope.data_farm.version;
		$scope.toggle_option = "check_one";
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
		let presets_load = Object.keys(loads_p).map(function(key){return angular.copy(loads_p[key])});
		$scope.data = {
				'assignedPresetList': {},
				'presets'			: presets_load,
				'hotkeys'			: services.storageService.getItem(services.presetService.getStorageKey()),
				"selectedOption" 	: {},
				"selectedOptionOut"	: {}
		}

		$scope.data_select = services.MainService.getSelects($scope.local_data_villages, $scope.local_data_villages.find(f=>f.id==services.modelDataService.getSelectedCharacter().getSelectedVillage().getId()))

		$scope.data_exception = {
			"availableOptions" : [],
			"selectedOption" : {}
		}
		
		$scope.name_preset = "*Farm";
		$scope.qtd_preset = Math.min.apply(null, [(Math.max.apply(null, [Math.trunc(($scope.local_data_villages.length / 10) * 10), 10])), 200]);

		getDetailsExceptions();

		triggerUpdate()
		update()

		$scope.setCollapse();

		return $scope;
	}
})
