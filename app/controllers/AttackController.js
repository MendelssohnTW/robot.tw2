define("robotTW2/controllers/AttackController", [
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/conf",
	"robotTW2/time",
	"helper/time"
	], function(
			services,
			providers,
			conf,
			convertedTime,
			helper
	){
	return function AttackController($rootScope, $scope) {
		var data_attack = $rootScope.data_attack;
		$scope.CLOSE = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		$scope.CLEAR = services.$filter("i18n")("CLEAR", $rootScope.loc.ale);
		var self = this;

		var TABS = {
				ATTACK 	: services.$filter("i18n")("attack", $rootScope.loc.ale, "attack"),
				LOG		: services.$filter("i18n")("log", $rootScope.loc.ale, "attack")
		}
		, TAB_ORDER = [
			TABS.ATTACK,
			TABS.LOG,
			]

		$scope.requestedTab = TABS.ATTACK;
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
			$scope.comandos = Object.keys($rootScope.data_attack.commands).map(function(elem, index, array){
				return $rootScope.data_attack.commands[elem]
			});
			$scope.comandos.sort(function(a,b){return (a.data_escolhida - convertedTime() - a.duration) - (b.data_escolhida - convertedTime() - b.duration)})
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
			case "attack": {
				className = "icon-26x26-attack-red";
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
			var difTime = param.data_escolhida - convertedTime() - param.duration; 
			return helper.readableMilliseconds(difTime)
		}

		$scope.getVcoordTarget = function(param){

			return "(" + param.target_x + "/" + param.target_y + ")"
		}

		$scope.clear_attack = function(){
			services.AttackService.removeAll();
		}

		$scope.removeCommand = services.AttackService.removeCommandAttack;

		$scope.$on(providers.eventTypeProvider.CHANGE_COMMANDS, function() {
			update();
			
		})
		
		$scope.$watch("data_logs.attack", function(){
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