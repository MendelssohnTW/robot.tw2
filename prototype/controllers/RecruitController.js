define("robotTW2/controllers/RecruitController", [
	"helper/time",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/conf",
	"conf/unitTypes"
	], function(
			helper,
			services,
			providers,
			conf,
			unitTypes
	){
	return function RecruitController($rootScope, $scope) {
		$scope.save = services.$filter("i18n")("SAVE", $rootScope.loc.ale);
		$scope.close = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		$scope.start = services.$filter("i18n")("START", $rootScope.loc.ale);
		$scope.pause = services.$filter("i18n")("PAUSE", $rootScope.loc.ale);
		$scope.resume = services.$filter("i18n")("RESUME", $rootScope.loc.ale);
		$scope.stop = services.$filter("i18n")("STOP", $rootScope.loc.ale);
		var self = this;
		
		var return_units = function (){
			var units = {};
			Object.keys(unitTypes).map(function(key){
				if($rootScope.data_recruit.troops_not.some(elem => elem == unitTypes[key])){
					delete units[unitTypes[key]]
				} else {
					units[unitTypes[key]] = 0
				}
			})
			return units
		}

		$scope.setGroup = function (gr){
			$scope.grupoSelected = gr;
		}
		
		$scope.getTimeRest = function(){
			return helper.readableMilliseconds($rootScope.data_recruit.interval - helper.gameTime()); 
		}

		$scope.getText = function(key){
			return services.$filter("i18n")("text_" + key, $rootScope.loc.ale, "recruit");
		}

		$scope.getClass = function(key){
			return "icon-20x20-unit-" + key;
		}

		$scope.start_recruit = function(){
			services.RecruitService.start();
			$scope.isRunning = recruit.isRunning();
		}

		$scope.stop_recruit = function(){
			services.RecruitService.stop();
			$scope.isRunning = services.RecruitService.isRunning();
		}

		$scope.pause_recruit = function(){
			services.RecruitService.pause();
			$scope.paused = !0;
		}
		$scope.resume_recruit = function(){
			services.RecruitService.resume();
			$scope.paused = !1;
		}
		
		$scope.$watch("grupoSelected", function(){
			if(!$scope.grupoSelected){return}
			if(!$scope.grupoSelected.units){
				$scope.grupoSelected.units = return_units();
			}
		})
		
		$rootScope.$on(providers.eventTypeProvider.INTERVAL_CHANGE_RECRUIT, function() {
			if (!$root$cope.$$phase) {
				$root$cope.$apply();
			}
		})
		
		$scope.isRunning = services.RecruitService.isRunning();
		$scope.isPaused = services.RecruitService.isPaused();
		$scope.grupoSelected = $rootScope.data_recruit.Groups[Object.keys($rootScope.data_recruit.Groups)[0]]

//		$scope.setGroup($scope.grupo)
		$scope.setCollapse();
		$scope.recalcScrollbar();

		return $scope;
	}
})