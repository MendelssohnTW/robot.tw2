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
		$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
		$scope.START = services.$filter("i18n")("START", services.$rootScope.loc.ale);
		$scope.STOP = services.$filter("i18n")("STOP", services.$rootScope.loc.ale);
		$scope.version = services.$filter("i18n")("version", services.$rootScope.loc.ale);

		$scope.local_data_villages = [];
		$scope.local_data_select = []
		$scope.local_data_standard_order = []
		$scope.local_data_standard_limit = []
		$scope.data_headquarter = data_headquarter
		$scope.data_villages = data_villages;

		$scope.text_version = $scope.version + " " + data_headquarter.version;

		$scope.status = "stopped";


		var self = this
		, tt = false
		, buildingTypes = services.modelDataService.getGameData().getBuildingTypes()
		, buildings = services.modelDataService.getGameData().getBuildings()
		, update = function () {
			services.HeadquarterService.isRunning() && services.HeadquarterService.isPaused() ? $scope.status = "paused" : services.HeadquarterService.isRunning() && (typeof(services.HeadquarterService.isPaused) == "function" && !services.HeadquarterService.isPaused()) ? $scope.status = "running" : $scope.status = "stopped";
			if (!$scope.$$phase) {$scope.$apply();}
		}
		, set_list = function(obj, str, desc){
			if(!obj){return}
			let list = []
			Object.keys(obj).map(function(key){
				list.push({
					"name": key,
					"label": services.$filter("i18n")(key, services.$rootScope.loc.ale, str),
					"value": obj[key],
				})
			})
			if(desc){
				list.sort(function(a,b){return b.value - a.value})
			} else {
				list.sort(function(a,b){return a.value - b.value})
			}
			return list;
		}
		, update_standard = function(){
			$scope.local_data_villages.forEach(function(vill){
				vill.value.buildingorder.standard = $scope.data_headquarter.standard.buildingorder
				vill.value.buildinglimit.standard = $scope.data_headquarter.standard.buildinglimit
			})
			$scope.local_data_standard_order = []
			$scope.local_data_standard_limit = []

			$scope.local_data_standard_order = set_list($scope.data_headquarter.standard.buildingorder, "buildings")
			$scope.local_data_standard_limit = set_list($scope.data_headquarter.standard.buildinglimit, "buildings")

			if (!$scope.$$phase) {$scope.$apply();}
		}
		, update_select = function(){
			$scope.local_data_select_order = []
			$scope.local_data_select_limit = []

			$scope.data_select_villages.selectedOption.value.selected = $scope.data_select.selectedOption

			$scope.local_data_select_order = set_list($scope.data_select_villages.selectedOption.value.buildingorder[$scope.data_select_villages.selectedOption.value.selected.value], "buildings")
			$scope.local_data_select_limit = set_list($scope.data_select_villages.selectedOption.value.buildinglimit[$scope.data_select_villages.selectedOption.value.selected.value], "buildings")

			if (!$scope.$$phase) {$scope.$apply();}
		}
		, getVillageData = function getVillageData(vid){
			if(!vid){return}
			return $scope.local_data_villages.find(f=>f.villageId==vid);
		}

		$scope.getLabel = function(vid){
			if(!vid){return}
			return $scope.local_data_villages.find(f=>f.id==vid).label
		}

		$scope.openVillageInfo = function(vid){
			services.windowDisplayService.openVillageInfo(vid);
		}

		$scope.jumpToVillage = function(vid){
			if(!vid){return}
			var data = services.VillageService.getVillage(vid)
			if(!data){return}
			var x = data.x
			var y = data.y
			services.VillageService.setVillage(village)
			services.mapService.jumpToVillage(x, y);
			$scope.closeWindow();
		}

		$scope.getVcoordStart = function(vid){
			if(!vid){return}
			var data = getVillageData(vid);
			if(!data){return "(...|...)"}
			var x = data.x
			var y = data.y
			var name = data.name
			return "(" + x + "|" + y + ")"
		}

		$scope.getName = function(vid){
			if(!vid){return}
			var data = getVillageData(vid);
			if(!data){return}
			return data.name
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

		$scope.upselect = function(item){
			var ant = $scope.local_data_select_order.find(f => f.value == item.value - 1)
			$scope.data_select_villages.selectedOption.value.buildingorder[item.name] -= 1
			$scope.data_select_villages.selectedOption.value.buildingorder[ant.name] += 1
			update_select();
		}

		$scope.downselect = function(key_vill, vill, key, value){
			var prox = $scope.local_data_select_order.find(f => f.value == item.value + 1)
			$scope.data_select_villages.selectedOption.value.buildingorder[item.name] += 1
			$scope.data_select_villages.selectedOption.value.buildingorder[ant.name] -= 1
			update_select();
		}

		$scope.levelupselect = function(key){
			var max_level = services.modelDataService.getGameData().getBuildingDataForBuilding(key).max_level;
			if($scope.data_select_villages.selectedOption.value.buildinglimit[$scope.data_select.selectedOption.value][key] < max_level){
				$scope.data_select_villages.selectedOption.value.buildinglimit[$scope.data_select.selectedOption.value][key] += 1
			}
			update_select();
		}

		$scope.leveldownselect = function(key){
			if($scope.data_select_villages.selectedOption.value.buildinglimit[$scope.data_select.selectedOption.value][key] > 0){
				$scope.data_select_villages.selectedOption.value.buildinglimit[$scope.data_select.selectedOption.value][key] -= 1
			}
			update_select();
		}

		$scope.upstandard = function(item){
			var ant = $scope.local_data_standard_order.find(f => f.value == item.value - 1)
			$scope.data_headquarter.standard.buildingorder[item.name] -= 1
			$scope.data_headquarter.standard.buildingorder[ant.name] += 1
			update_standard();
		}

		$scope.downstandard = function(item){
			var prox = $scope.local_data_standard_order.find(f => f.value == item.value + 1)
			$scope.data_headquarter.standard.buildingorder[item.name] += 1
			$scope.data_headquarter.standard.buildingorder[prox.name] -= 1
			update_standard();
		}

		$scope.levelupstandard = function(key){
			var max_level = services.modelDataService.getGameData().getBuildingDataForBuilding(key).max_level;
			if($scope.data_headquarter.standard.buildinglimit[key] < max_level){
				$scope.data_headquarter.standard.buildinglimit[key] += 1;
			}
			update_standard();
		}

		$scope.leveldownstandard = function(key){
			if($scope.data_headquarter.standard.buildinglimit[key] > 0){
				$scope.data_headquarter.standard.buildinglimit[key] -= 1
			}
			update_standard();
		}

		$scope.start_headquarter = function(){
			services.HeadquarterService.start();
			update()
		}

		$scope.stop_headquarter = function(){
			services.HeadquarterService.stop();
			$scope.data_headquarter.complete = 0
			update()
		}

		$scope.pause_headquarter = function(){
			services.HeadquarterService.pause();
			$scope.paused = !0;
		}

		$scope.resume_headquarter = function(){
			services.HeadquarterService.resume();
			$scope.paused = !1;
		}

		$scope.restore_headquarter = function(){
			$scope.data_headquarter.interval = conf.INTERVAL.HEADQUARTER
			Object.values($scope.data_villages.villages).forEach(function(village){
				angular.merge(village, {
					headquarter_activate 	: true,
					buildingorder 			: $scope.data_headquarter.buildingorder,
					buildinglimit 			: $scope.data_headquarter.buildinglimit
				})
			})
			$scope.data_villages.set();
			if (!$scope.$$phase) $scope.$apply();
		}

		$scope.menu = function () {
			services.$rootScope.$broadcast(providers.eventTypeProvider.OPEN_MAIN);
		}

		$scope.$on(providers.eventTypeProvider.INTERVAL_CHANGE_HEADQUARTER, update)

		$scope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function ($event, data) {
			if(!data) {return} 
			update();
		})

		update();

		$scope.$watch("data_logs.headquarter", function(){
			$scope.recalcScrollbar();
			if (!$scope.$$phase) {$scope.$apply()}
		}, true)

		$scope.$watch("data_headquarter", function(){
			if(!$scope.data_headquarter){return}
			data_headquarter = $scope.data_headquarter;
			data_headquarter.set();
		}, true)

		$scope.$watch("data_select_villages", function(){
			if(!$scope.data_select_villages){return}
			$scope.data_select = services.MainService.getSelects($scope.local_data_select, $scope.data_select_villages.selectedOption.value.selected)
			update_select()
		}, true)

		$scope.$watch("data_select", function(){
			if(!$scope.data_select){return}
			update_select()
		}, true)

		$scope.$on("$destroy", function() {
			$scope.data_villages.set();
		});

		$scope.local_data_villages = services.VillageService.getLocalVillages("headquarter", "label");

		$scope.local_data_villages.forEach(function(vill){
			vill.value.buildingorder.standard = $scope.data_headquarter.standard.buildingorder
			vill.value.buildinglimit.standard = $scope.data_headquarter.standard.buildinglimit
		})

		Object.keys($scope.data_headquarter.selects).map(
				function(key){ 
					$scope.local_data_select.push($scope.data_headquarter.selects[key]) 
					$scope.local_data_select.sort(function(a,b){return a.name.localeCompare(b.name)}) 
					return $scope.local_data_select; 
				}
		)

		$scope.data_select_villages = services.MainService.getSelects($scope.local_data_villages)
		$scope.data_select = services.MainService.getSelects($scope.local_data_select, $scope.data_select_villages.selectedOption.value.selected)

		update_standard()

		$scope.setCollapse();

		return $scope;
	}
})
