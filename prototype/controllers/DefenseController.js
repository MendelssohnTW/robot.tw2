define("robotTW2/controllers/DefenseController", [
	"robotTW2",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/conf",
	"robotTW2/time",
	"helper/time",
	"robotTW2/unitTypesRenameRecon",
	"robotTW2/databases/data_villages",
	"robotTW2/databases/data_defense"
	], function(
			robotTW2,
			services,
			providers,
			conf,
			time,
			helper,
			unitTypesRenameRecon,
			data_villages,
			data_defense
	){
	return function DefenseController($scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
		$scope.CLEAR = services.$filter("i18n")("CLEAR", services.$rootScope.loc.ale);
		var self = this,
		local_data_villages = {};
		$scope.data_defense = data_defense;
		$scope.text_version = $scope.version + " " + data_defense.version;

		var TABS = {
				DEFENSE	: services.$filter("i18n")("defense", services.$rootScope.loc.ale, "defense"),
				TROOPS	: services.$filter("i18n")("troops", services.$rootScope.loc.ale, "defense"),
				LOG		: services.$filter("i18n")("log", services.$rootScope.loc.ale, "defense")
		}
		, TAB_ORDER = [
			TABS.DEFENSE,
			TABS.TROOPS,
			TABS.LOG,
			]
		
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
		
		if(!data_defense.recon){
			data_defense.recon = unitTypesRenameRecon;
		}

		$scope.requestedTab = TABS.DEFENSE;
		$scope.TABS = TABS;
		$scope.TAB_ORDER = TAB_ORDER;
		
		$scope.getKey = function(unit_name){
			return services.$filter("i18n")(unit_name, services.$rootScope.loc.ale, "recon");
		}
		
		$scope.getClass = function(unit_name){
			return "icon-34x34-unit-" + unit_name;
		}

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
			$scope.comandos = services.DefenseService.get_commands();
			$scope.comandos.sort(function(a,b){return (a.data_escolhida - time.convertedTime() - a.time_sniper_ant) - (b.data_escolhida - time.convertedTime() - b.time_sniper_ant)})
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
			return services.$filter("date")(new Date(param.data_escolhida - param.time_sniper_ant), "HH:mm:ss.sss");
		}

		$scope.getHoraAlvo = function(param){
			return services.$filter("date")(new Date(param.data_escolhida), "HH:mm:ss.sss");
		}

		$scope.getDataAlvo = function(param){
			return services.$filter("date")(new Date(param.data_escolhida), "dd/MM/yyyy");
		}

		$scope.getHoraRetorno = function(param){
			return services.$filter("date")(new Date(param.data_escolhida + param.time_sniper_post), "HH:mm:ss.sss");
		}

		$scope.getTimeRest = function(param){
			var difTime = param.data_escolhida - time.convertedTime() - param.time_sniper_ant; 
			return helper.readableMilliseconds(difTime)
		}

		$scope.getVcoordTarget = function(param){
			return "(" + param.target_x + "/" + param.target_y + ")"
		}

		$scope.clear_defense = function(){
			services.DefenseService.removeAll();
		}

		$scope.removeCommand = services.DefenseService.removeCommandDefense;

		$scope.$on(providers.eventTypeProvider.CHANGE_COMMANDS_DEFENSE, function() {
			update();
		})
		
		$scope.$watch("data_logs.defense", function(){
			$scope.recalcScrollbar();
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		}, true)
		
		$scope.$watch("data_defense", function(){
			if(!$scope.data_defense){return}
			data_defense = $scope.data_defense;
			data_defense.set();
		}, true)

		$scope.setCollapse();

		return $scope;
	}
})