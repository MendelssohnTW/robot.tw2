define("robotTW2/controllers/DefenseController", [
	"robotTW2",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/conf",
	"helper/time",
	], function(
			robotTW2,
			services,
			providers,
			conf,
			helper
	){
	return function DefenseController($rootScope, $scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		$scope.CLEAR = services.$filter("i18n")("CLEAR", $rootScope.loc.ale);
		var self = this;

		var TABS = {
				DEFENSE	: services.$filter("i18n")("defense", $rootScope.loc.ale, "defense"),
				LOG		: services.$filter("i18n")("log", $rootScope.loc.ale, "defense")
		}
		, TAB_ORDER = [
			TABS.DEFENSE,
			TABS.LOG,
			]

		$scope.requestedTab = TABS.DEFENSE;
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
		, update = function(){
			$scope.comandos = robotTW2.commands_defense;
			$scope.comandos.sort(function(a,b){return (a.data_escolhida - time.convertedTime() - a.duration) - (b.data_escolhida - time.convertedTime() - b.duration)})
			if (!$rootScope.$$phase) {
				$rootScope.$apply();
			}
		}

		initTab();
		update();

		$scope.userSetActiveTab = function(tab){
			setActiveTab(tab);
		}

		$scope.getVstart = function(param){
			var vid = param.start_village;
			if(!vid){return}
			return services.modelDataService.getSelectedCharacter().getVillage(vid).data.name
		}

		$scope.getVcoordStart = function(param){

			var vid = param.start_village;
			if(!vid){return}
			var x = services.modelDataService.getSelectedCharacter().getVillage(vid).data.x
			var y = services.modelDataService.getSelectedCharacter().getVillage(vid).data.y
			return "(" + x + "/" + y + ")"
		}

		$scope.getClass = function(type){
			var className = "";
			switch (type) {
			case "support": {
				className = "icon-26x26-support";
				break;
			}
			case "defense": {
				className = "icon-26x26-defense-red";
				break;
			}
			case "relocate": {
				className = "icon-26x26-relocate";
				break;
			}
			}
			return className
		}

		$scope.getHoraSend = function(param){

			return services.$filter("date")(new Date(param.data_escolhida - param.duration), "HH:mm:ss.sss");
		}

		$scope.getHoraAlvo = function(param){

			return services.$filter("date")(new Date(param.data_escolhida), "HH:mm:ss.sss");
		}

		$scope.getDataAlvo = function(param){

			return services.$filter("date")(new Date(param.data_escolhida), "dd/MM/yyyy");
		}

		$scope.getTimeRest = function(param){
			var difTime = param.data_escolhida - time.convertedTime() - param.duration; 
			return helper.readableMilliseconds(difTime)
		}

		$scope.getVcoordTarget = function(param){

			return "(" + param.target_x + "/" + param.target_y + ")"
		}

		$scope.clear_defense = function(){
			services.AttackService.removeAll();
		}

		$scope.removeCommand = services.AttackService.removeCommandAttack;

		$scope.$on(providers.eventTypeProvider.CHANGE_COMMANDS, function() {
			update();
		})
		
		$scope.$watch("data_logs.defense", function(){
			$scope.recalcScrollbar();
			if (!$rootScope.$$phase) {
				$rootScope.$apply();
			}
		}, true)


		$scope.setCollapse();
		$scope.recalcScrollbar();

		return $scope;
	}
})