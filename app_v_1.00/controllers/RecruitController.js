define("robotTW2/controllers/RecruitController", [
	"helper/time",
	"robotTW2/time",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/conf",
	"conf/unitTypes"
	], function(
			helper,
			time,
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
		
		var TABS = {
				RECRUIT	: services.$filter("i18n")("recruit", $rootScope.loc.ale, "recruit"),
				LOG		: services.$filter("i18n")("log", $rootScope.loc.ale, "recruit")
		}
		, TAB_ORDER = [
			TABS.RECRUIT,
			TABS.LOG,
			]
		
		$scope.isRunning = services.RecruitService.isRunning();
		
		$scope.requestedTab = TABS.RECRUIT;
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
		, return_units = function (){
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
			return $rootScope.data_recruit.complete > time.convertedTime() ? helper.readableMilliseconds($rootScope.data_recruit.complete - time.convertedTime()) : 0; 
		}

		$scope.getText = function(key){
			return services.$filter("i18n")("text_" + key, $rootScope.loc.ale, "recruit");
		}

		$scope.getClass = function(key){
			return "icon-20x20-unit-" + key;
		}

		$scope.start_recruit = function(){
			services.RecruitService.start();
			$scope.isRunning = services.RecruitService.isRunning();
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
		
		$scope.$on(providers.eventTypeProvider.INTERVAL_CHANGE_RECRUIT, function($event, data) {
			if (!$rootScope.$$phase) {
				$rootScope.$apply();
			}
		})
		
		$scope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function($event, data) {
			$scope.isRunning = services.RecruitService.isRunning();
			if (!$rootScope.$$phase) {
				$rootScope.$apply();
			}
		})
		
		$scope.isRunning = services.RecruitService.isRunning();
		$scope.isPaused = services.RecruitService.isPaused();
		$scope.grupoSelected = $rootScope.data_recruit.Groups[Object.keys($rootScope.data_recruit.Groups)[0]]

//		$scope.setGroup($scope.grupo)
		
		$scope.$watch("data_logs.recruit", function(){
			$scope.recalcScrollbar();
			if (!$rootScope.$$phase) {
				$rootScope.$apply();
			}
		}, true)
		
		initTab();

		
		$scope.setCollapse();
		$scope.recalcScrollbar();

		return $scope;
	}
})
