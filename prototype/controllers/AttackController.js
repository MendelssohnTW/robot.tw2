define("robotTW2/controllers/AttackController", [
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/conf",
	"robotTW2/time",
	"helper/time",
	"robotTW2/databases/data_villages",
	"robotTW2/databases/data_attack"
	], function(
			services,
			providers,
			conf,
			time,
			helper,
			data_villages,
			data_attack
	){
	return function AttackController($scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
		$scope.CLEAR = services.$filter("i18n")("CLEAR", services.$rootScope.loc.ale);
		var self = this,
		local_data_villages = {};
		$scope.data_attack = data_attack;
		$scope.text_version = $scope.version + " " + data_attack.version;

		var TABS = {
				ATTACK 	: services.$filter("i18n")("attack", services.$rootScope.loc.ale, "attack"),
				LOG		: services.$filter("i18n")("log", services.$rootScope.loc.ale, "attack")
		}
		, TAB_ORDER = [
			TABS.ATTACK,
			TABS.LOG,
			]

		$scope.requestedTab = TABS.ATTACK;
		$scope.TABS = TABS;
		$scope.TAB_ORDER = TAB_ORDER;
		
		function getVillage(vid){
			if(!vid){return}
			return services.modelDataService.getSelectedCharacter().getVillage(vid).data
		}

		function getVillageData(vid){
			if(!vid){return}
			return local_data_villages[vid].data;
		}
		
		Object.keys(data_villages).map(function(key){
			let data = getVillage(key);
			angular.extend(local_data_villages, {[key] : {"data": data}})
			return local_data_villages;
		})

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
			$scope.comandos = Object.keys(data_attack.commands).map(function(elem, index, array){
				return data_attack.commands[elem]
			});
			$scope.comandos.sort(function(a,b){return (a.data_escolhida - time.convertedTime() - a.duration) - (b.data_escolhida - time.convertedTime() - b.duration)})
			if (!$scope.$$phase) {
				$scope.$apply();
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
			return getVillageData(vid).data.name
		}

		$scope.getVcoordStart = function(param){

			var vid = param.start_village;
			if(!vid){return}
			var x = getVillageData(vid).data.x
			var y = getVillageData(vid).data.y
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
			var difTime = param.data_escolhida - time.convertedTime() - param.duration; 
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
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		}, true)
		
		$scope.$watch("data_attack", function(){
			if(!$scope.data_attack){return}
			data_attack = $scope.data_attack;
			data_attack.set();
		}, true)
		
		$scope.$on("$destroy", function() {
			$scope.data_attack.set();
		});


		$scope.setCollapse();
		$scope.recalcScrollbar();

		return $scope;
	}
})