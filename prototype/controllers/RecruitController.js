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
	return function RecruitController($scope) {
		$scope.save = services.$filter("i18n")("SAVE", services.$rootScope.loc.ale);
		$scope.close = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
		$scope.start = services.$filter("i18n")("START", services.$rootScope.loc.ale);
		$scope.pause = services.$filter("i18n")("PAUSE", services.$rootScope.loc.ale);
		$scope.resume = services.$filter("i18n")("RESUME", services.$rootScope.loc.ale);
		$scope.stop = services.$filter("i18n")("STOP", services.$rootScope.loc.ale);
		var self = this;
		
		var TABS = {
				RECRUIT	: services.$filter("i18n")("recruit", services.$rootScope.loc.ale, "recruit"),
				LOG		: services.$filter("i18n")("log", services.$rootScope.loc.ale, "recruit")
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
				if(services.$rootScope.data_recruit.troops_not.some(elem => elem == unitTypes[key])){
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
			return services.$rootScope.data_recruit.complete > time.convertedTime() ? helper.readableMilliseconds(services.$rootScope.data_recruit.complete - time.convertedTime()) : 0; 
		}

		$scope.getText = function(key){
			return services.$filter("i18n")("text_" + key, services.$rootScope.loc.ale, "recruit");
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
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		})
		
		$scope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function($event, data) {
			$scope.isRunning = services.RecruitService.isRunning();
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		})
		
		$scope.isRunning = services.RecruitService.isRunning();
		$scope.isPaused = services.RecruitService.isPaused();
		$scope.grupoSelected = services.$rootScope.data_recruit.Groups[Object.keys(services.$rootScope.data_recruit.Groups)[0]]

//		$scope.setGroup($scope.grupo)
		
		$scope.$watch("data_logs.recruit", function(){
			$scope.recalcScrollbar();
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		}, true)
		
		initTab();

		
		$scope.setCollapse();
		$scope.recalcScrollbar();

		return $scope;
	}
})
