define("robotTW2/controllers/HeadquarterController", [
	"helper/time",
	"robotTW2/time",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/conf",
	"robotTW2/databases/data_villages",
	"robotTW2/databases/data_headquarter",
	], function(
			helper,
			time,
			services,
			providers,
			conf,
			data_villages,
			data_headquarter
	){
	return function HeadquarterController($scope) {
		$scope.MENU = services.$filter("i18n")("MENU", services.$rootScope.loc.ale);
		$scope.SAVE = services.$filter("i18n")("SAVE", services.$rootScope.loc.ale);
		$scope.INCLUDE = services.$filter("i18n")("INCLUDE", services.$rootScope.loc.ale);
		$scope.APPLY = services.$filter("i18n")("APPLY", services.$rootScope.loc.ale);
		$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
		$scope.START = services.$filter("i18n")("START", services.$rootScope.loc.ale);
		$scope.STOP = services.$filter("i18n")("STOP", services.$rootScope.loc.ale);
		$scope.version = services.$filter("i18n")("version", services.$rootScope.loc.ale);

		$scope.local_data_villages = [];
		$scope.local_data_select = []
		$scope.data_headquarter = data_headquarter
		$scope.data_villages = data_villages;
		$scope.text_version = $scope.version + " " + data_headquarter.version;
		$scope.toggle_option = "check_one";
		$scope.status = "stopped";

		var buildingTypes = services.modelDataService.getGameData().getBuildingTypes()
		, buildings = services.modelDataService.getGameData().getBuildings()
		, set_list_obj = function(obj, str, desc){
			if(!obj){return}
			let list = []
			Object.keys(obj).map(function(key){
				list.push({
					"name": key,
					"label": services.$filter("i18n")(key, services.$rootScope.loc.ale, str),
					"value": obj[key],
				})
			})
			if(desc == "name"){
				list.sort(function(a,b){return a.name.localeCompare(b.name)})
			} else if(desc == true){
				list.sort(function(a,b){return a.value - b.value})
			} else {
				list.sort(function(a,b){return a.value - b.value})
			}
			return list;
		}
		, set_list = function(obj, str){
			if(!obj){return}
			let list = []
			Object.keys(obj).map(function(key){
				list.push({
					"name": Object.keys(obj[key])[0],
					"label": services.$filter("i18n")(Object.keys(obj[key])[0], services.$rootScope.loc.ale, str),
					"value": Object.values(obj[key])[0],
				})
			})
			return list;
		}
		, update_local_data_select = function(){
			if(!$scope.local_data_select || !$scope.local_data_select.length){
				$scope.local_data_select = []
				Object.keys($scope.data_headquarter.selects).map(
						function(key){ 
							$scope.local_data_select.push($scope.data_headquarter.selects[key]) 
							$scope.local_data_select.sort(function(a,b){return a.name.localeCompare(b.name)}) 
							return $scope.local_data_select; 
						}
				)
			}
			$scope.data_type = services.MainService.getSelects($scope.local_data_select, $scope.data_select.selectedOption.value.selected)
		}
		, update_data_select = function(){
			$scope.data_select = services.MainService.getSelects($scope.local_data_villages, $scope.local_data_villages.find(f=>f.id==services.modelDataService.getSelectedCharacter().getSelectedVillage().getId()))
		}
		, update_select = function(){
			$scope.local_data_select_order = []
			$scope.local_data_select_limit = []
			$scope.local_data_select_list = []

			$scope.data_select.selectedOption.value.selected = $scope.data_type.selectedOption

			$scope.local_data_select_order = set_list_obj($scope.data_select.selectedOption.value.buildingorder[$scope.data_select.selectedOption.value.selected.value], "buildings")
			$scope.local_data_select_limit = set_list_obj($scope.data_select.selectedOption.value.buildinglimit[$scope.data_select.selectedOption.value.selected.value], "buildings", "name")
			$scope.local_data_select_list = set_list($scope.data_select.selectedOption.value.buildinglist[$scope.data_select.selectedOption.value.selected.value], "buildings")
		}
		
		$scope.getTimeRest = function(){
			return $scope.data_headquarter.complete > time.convertedTime() && services.HeadquarterService.isRunning() ? helper.readableMilliseconds($scope.data_headquarter.complete - time.convertedTime()) : 0;
		}

		$scope.getMax = function(item){
			if(!item){return}
			return item.value < services.modelDataService.getGameData().getBuildingDataForBuilding(item.name).max_level ? true: false;
		}
		
		$scope.getClass = function(key){
			if(!key){return}
			return "icon-20x20-building-" + key;
		}

		$scope.$watch("data_logs.headquarter", function(){
			$scope.recalcScrollbar();
			if (!$scope.$$phase) {$scope.$apply()}
		}, true)

		$scope.$watch("data_select", function(){
			if(!$scope.data_select){return}
			update_local_data_select()
			services.villageService.setSelectedVillage($scope.data_select.selectedOption.id)
		}, true)

		$scope.$watch("data_type", function(){
			if(!$scope.data_type){return}
			update_select()
		}, true)

		$scope.$on("$destroy", function() {
			$scope.data_villages.set();
			$scope.data_headquarter.set();
		});

		$scope.$on(providers.eventTypeProvider.VILLAGE_SELECTED_CHANGED, update_data_select);

		$scope.local_data_villages = services.VillService.getLocalVillages("headquarter", "label");
		update_data_select()
//		update_local_data_select()

		return $scope;
	}
})