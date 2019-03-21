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
		$scope.local_data_standard_level = []
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

		$scope.getKey = function(key){
			if(!key){return}
			return services.$filter("i18n")(key, services.$rootScope.loc.ale, "buildings");
		}

		$scope.getMax = function(key, value){
			if(!key){return}
			return value < services.modelDataService.getGameData().getBuildingDataForBuilding(key).max_level ? true: false;
		}

		$scope.getClass = function(key){
			if(!key){return}
			return "icon-20x20-building-" + key;
		}

//		$scope.getValue = function(key){
//		if(!key){return}
//		return Object.values(key)[0];
//		}

		$scope.up = function(key_vill, vill, key, value){
			$scope.selected_village_buildingorder[key_vill] = value;
			var ant = Object.keys(vill.buildingorder).map(
					function(elem){
						return {[elem]: vill.buildingorder[elem]}
					}
			).find(f => Object.values(f)[0] == vill.buildingorder[key] - 1)
			vill.buildingorder[vill.selected.value][Object.keys(ant)[0]] += 1
			vill.buildingorder[vill.selected.value][key] -= 1
//			vill.buildingorder[key] = vill.buildingorder[key].map(function(key,index,array){return delete vill.buildingorder[key][index].$$hashKey ? vill.buildingorder[key][index] : undefined}).sort(function(a,b){return Object.values(a)[0] - Object.values(b)[0]})
			if (!$scope.$$phase) {$scope.$apply();}
		}

		$scope.down = function(key_vill, vill, key, value){
			$scope.selected_village_buildingorder[key_vill] = value;
			var prox = Object.keys(vill.buildingorder).map(
					function(elem){
						return {[elem]: vill.buildingorder[elem]}
					}
			).find(f => Object.values(f)[0] == vill.buildingorder[key] + 1)
			vill.buildingorder[vill.selected.value][Object.keys(prox)[0]] -= 1
			vill.buildingorder[vill.selected.value][key] += 1
//			vill.buildingorder[key] = vill.buildingorder[key].map(function(key,index,array){return delete vill.buildingorder[key][index].$$hashKey ? vill.buildingorder[key][index] : undefined}).sort(function(a,b){return Object.values(a)[0] - Object.values(b)[0]})
			if (!$scope.$$phase) {$scope.$apply();}
		}

		$scope.levelup = function(vill, key){
			var max_level = services.modelDataService.getGameData().getBuildingDataForBuilding(key).max_level;
			var level = vill.buildinglimit[vill.selected.value][key] += 1;
			if(level > max_level){
				vill.buildinglimit[vill.selected.value][key] -= 1
			}

			if (!$scope.$$phase) {$scope.$apply();}
		}

		$scope.leveldown = function(vill, key){
			vill.buildinglimit[vill.selected.value][key] -= 1
			if (!$scope.$$phase) {$scope.$apply();}
		}

		$scope.upstandard = function(key){
			var ant = Object.keys($scope.obj_standard.buildingorder).map(
					function(elem){
						return {[elem]: $scope.obj_standard.buildingorder[elem]}
					}
			).find(f => Object.values(f)[0] == $scope.obj_standard.buildingorder[key] - 1)
			$scope.obj_standard.buildingorder[Object.keys(ant)[0]] += 1
			$scope.obj_standard.buildingorder[key] -= 1
//			vill.buildingorder[vill.selected.value] = vill.buildingorder[vill.selected.value].map(function(key,index,array){return delete vill.buildingorder[vill.selected.value][index].$$hashKey ? vill.buildingorder[vill.selected.value][index] : undefined}).sort(function(a,b){return Object.values(a)[0] - Object.values(b)[0]})
			if (!$scope.$$phase) {$scope.$apply();}
		}

		$scope.downstandard = function(key){
			var prox = Object.keys($scope.obj_standard.buildingorder).map(
					function(elem){
						return {[elem]: $scope.obj_standard.buildingorder[elem]}
					}
			).find(f => Object.values(f)[0] == $scope.obj_standard.buildingorder[key] + 1)
			$scope.obj_standard.buildingorder[Object.keys(prox)[0]] -= 1
			$scope.obj_standard.buildingorder[key] += 1
//			vill.buildingorder[vill.selected.value] = vill.buildingorder[vill.selected.value].map(function(key,index,array){return delete vill.buildingorder[vill.selected.value][index].$$hashKey ? vill.buildingorder[vill.selected.value][index] : undefined}).sort(function(a,b){return Object.values(a)[0] - Object.values(b)[0]})
			if (!$scope.$$phase) {$scope.$apply();}
		}


		$scope.levelupstandard = function(key){
			var max_level = services.modelDataService.getGameData().getBuildingDataForBuilding(key).max_level;
			var level = $scope.obj_standard.buildinglimit[key] += 1;
			if(level > max_level){
				$scope.obj_standard.buildinglimit[key] -= 1
			}
			if (!$scope.$$phase) {$scope.$apply();}
		}

		$scope.leveldownstandard = function(key){
			$scope.obj_standard.buildinglimit[key] -= 1
			if (!$scope.$$phase) {$scope.$apply();}
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

		$scope.selectvillagebuildingorder = function(villageId, value){
			$scope.selected_village_buildingorder[villageId] = value;
		}

		$scope.menu = function () {
			services.$rootScope.$broadcast(providers.eventTypeProvider.OPEN_MAIN);
		}

		$scope.selected_village_buildingorder = {};

		$scope.$on(providers.eventTypeProvider.INTERVAL_CHANGE_HEADQUARTER, update)

		$scope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function ($event, data) {
			if(!data) {return} 
			update();
		})

		update();


//		$scope.$on(providers.eventTypeProvider.SELECT_SELECTED, setFilters);

		$scope.$watch("data_logs.headquarter", function(){
			$scope.recalcScrollbar();
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		}, true)

//		$scope.$watch("data_villages", function($event, data){
//		if(!$scope.data_villages){return}
//		$scope.data_villages.set();
//		}, true)

		$scope.$watch("data_headquarter", function(){
			if(!$scope.data_headquarter){return}
			data_headquarter = $scope.data_headquarter;
			data_headquarter.set();
		}, true)

		$scope.$on("$destroy", function() {
			$scope.data_villages.set();
		});

		Object.keys($scope.data_headquarter.selects).map(function(key){
			$scope.local_data_select.push($scope.data_headquarter.selects[key])
			$scope.local_data_select.sort(function(a,b){return a.name.localeCompare(b.name)})
			return $scope.local_data_select;
		})

		$scope.local_data_villages = services.VillageService.getLocalVillages("headquarter", "label");

		$scope.data_select = services.MainService.getSelects($scope.local_data_select)
		
		Object.keys($scope.data_headquarter.standard[$scope.data_select.selectedOption.value].buildingorder).map(function(key){
			$scope.local_data_standard_order.push({
				"name": key,
				"label": services.$filter("i18n")(key, services.$rootScope.loc.ale, "buildings"),
				"value": $scope.local_data_select.buildingorder[key],
			})
			$scope.local_data_standard_order.sort(function(a,b){return a.name.localeCompare(b.name)})
			return $scope.local_data_standard_order;
		})

		Object.keys($scope.data_headquarter.standard[$scope.data_select.selectedOption.value].buildinglimit).map(function(key){
			$scope.local_data_standard_level.push({
				"name": key,
				"label": services.$filter("i18n")(key, services.$rootScope.loc.ale, "buildings"),
				"value": $scope.local_data_select.buildinglimit[key],
			})
			$scope.local_data_standard_level.sort(function(a,b){return a.name.localeCompare(b.name)})
			return $scope.local_data_standard_level;
		})

		$scope.data_standard_order = services.MainService.getSelects($scope.local_data_standard_order)
		$scope.data_standard_level = services.MainService.getSelects($scope.local_data_standard_level)

		
		$scope.$watch("data_standard_order", function(){
			if(!$scope.data_standard_order){return}
		}, true)
		
		$scope.$watch("data_standard_level", function(){
			if(!$scope.data_standard_level){return}
		}, true)

		$scope.setCollapse();

		return $scope;
	}
})
