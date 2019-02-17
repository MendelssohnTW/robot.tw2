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
		$scope.restore = services.$filter("i18n")("RESTORE", services.$rootScope.loc.ale);
		$scope.close = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
		$scope.start = services.$filter("i18n")("START", services.$rootScope.loc.ale);
		$scope.pause = services.$filter("i18n")("PAUSE", services.$rootScope.loc.ale);
		$scope.resume = services.$filter("i18n")("RESUME", services.$rootScope.loc.ale);
		$scope.stop = services.$filter("i18n")("STOP", services.$rootScope.loc.ale);

		var self = this;
		$scope.data_headquarter = data_headquarter
		$scope.data_villages = data_villages;

		var update = function () {
			services.HeadquarterService.isRunning() && services.HeadquarterService.isPaused() ? $scope.status = "paused" : services.HeadquarterService.isRunning() && (typeof(services.HeadquarterService.isPaused) == "function" && !services.HeadquarterService.isPaused()) ? $scope.status = "running" : $scope.status = "stopped";
			$scope.data_villages = data_villages;
			if (!$scope.$$phase) {$scope.$apply();}
		}

//		$scope.toggleSelect = function(selected){
//		console.log(selected)
//		if (!$scope.$$phase) {$scope.$apply();}
//		}

		function getVillageData(vid){
			if(!vid){return}
			return services.modelDataService.getSelectedCharacter().getVillage(vid).data
		}

		$scope.openVillageInfo = function(vid){
			services.windowDisplayService.openVillageInfo(vid);
		}

		$scope.jumpToVillage = function(vid){
			var x = getVillageData(vid).x
			var y = getVillageData(vid).y
			mapService.jumpToVillage(x, y);
		}

		$scope.getVcoordStart = function(vid){
			if(!vid){return}
			var x = getVillageData(vid).x
			var y = getVillageData(vid).y
			var name = getVillageData(vid).name
			return "(" + x + "/" + y + ")"
		}

		$scope.getName = function(vid){
			if(!vid){return}
			return getVillageData(vid).name
		}

		$scope.getTimeRest = function(){
			return $scope.data_headquarter.complete > time.convertedTime() ? helper.readableMilliseconds($scope.data_headquarter.complete - time.convertedTime()) : 0;
		}

		$scope.getKey = function(buildingOrder){
			return services.$filter("i18n")(Object.keys(buildingOrder)[0], services.$rootScope.loc.ale, "headquarter");
		}

		$scope.getClass = function(buildingOrder){
			return "icon-20x20-building-" + Object.keys(buildingOrder)[0];
		}

		$scope.getValue = function(buildingOrder){
			return Object.values(buildingOrder)[0];
		}

		$scope.up = function(vill, buildingOrder){
			var ant = vill.buildingorder[vill.selected.value].find(function(a,b){return Object.values(a)[0]==Object.values(buildingOrder)[0]-1})
			ant[Object.keys(ant)[0]] += 1
			buildingOrder[Object.keys(buildingOrder)[0]] -= 1
			vill.buildingorder[vill.selected.value] = vill.buildingorder[vill.selected.value].map(function(key,index,array){return delete vill.buildingorder[vill.selected.value][index].$$hashKey ? vill.buildingorder[vill.selected.value][index] : undefined}).sort(function(a,b){return Object.values(a)[0] - Object.values(b)[0]})
			if (!$scope.$$phase) {$scope.$apply();}
		}

		$scope.down = function(vill, buildingOrder){
			var prox = vill.buildingorder[vill.selected.value].find(function(a,b){return Object.values(a)[0]==Object.values(buildingOrder)[0]+1})
			prox[Object.keys(prox)[0]] -= 1
			buildingOrder[Object.keys(buildingOrder)[0]] += 1
			vill.buildingorder[vill.selected.value] = vill.buildingorder[vill.selected.value].map(function(key,index,array){return delete vill.buildingorder[vill.selected.value][index].$$hashKey ? vill.buildingorder[vill.selected.value][index] : undefined}).sort(function(a,b){return Object.values(a)[0] - Object.values(b)[0]})
			if (!$scope.$$phase) {$scope.$apply();}
		}

		$scope.levelup = function(vill, buildingLimit){
			var max_level = services.modelDataService.getGameData().getBuildingDataForBuilding(Object.keys(vill.buildingLimit)[0]).max_level;
			var level = vill.buildingLimit[Object.keys(vill.buildingLimit)[0]] += 1;
			if(level > max_level){
				vill.buildingLimit[Object.keys(vill.buildingLimit)[0]] -= 1
			}

			if (!$scope.$$phase) {$scope.$apply();}
		}

		$scope.leveldown = function(vill, buildingLimit){
			vill.buildingLimit[Object.keys(vill.buildingLimit)[0]] -= 1
			if (!$scope.$$phase) {$scope.$apply();}
		}

		$scope.start_headquarter = function(){
			services.HeadquarterService.start();
			update()
		}

		$scope.stop_headquarter = function(){
			services.HeadquarterService.stop();
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
			Object.values(data_villages.villages).forEach(function(village){
				angular.merge(village, {
					executebuildingorder 	: conf.executebuildingorder,
					buildingorder 			: $scope.data_headquarter.buildingorder,
					buildinglimit 			: $scope.data_headquarter.buildinglimit,
					buildinglevels 			: $scope.data_headquarter.buildinglevels
				})
			})
//			data_villages.set();
			if (!$scope.$$phase) $scope.$apply();
		}

		$scope.selectvillagebuildingOrder = function(villageId, buildingOrder){
			$scope.selected_village_buildingOrder[villageId] = buildingOrder;
		}

		$scope.selected_village_buildingOrder = {};

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

		$scope.$watch("data_villages", function(){
			if(!$scope.data_villages){return}
			data_villages = $scope.data_villages;
			data_villages.set();
		}, true)

		$scope.$watch("data_headquarter", function(){
			if(!$scope.data_headquarter){return}
			data_headquarter = $scope.data_headquarter;
			data_headquarter.set();
		}, true)


		$scope.recalcScrollbar();
		$scope.setCollapse();

		return $scope;
	}
})
