define("robotTW2/controllers/DefenseController", [
	"robotTW2",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/conf",
	"robotTW2/time",
	"helper/time",
	"robotTW2/unitTypesRenameRecon",
	"robotTW2/databases/data_villages",
	"robotTW2/databases/data_defense",
	"helper/format"
	], function(
			robotTW2,
			services,
			providers,
			conf,
			time,
			helper,
			unitTypesRenameRecon,
			data_villages,
			data_defense,
			formatHelper
	){
	return function DefenseController($scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
		$scope.MENU = services.$filter("i18n")("MENU", services.$rootScope.loc.ale);
		$scope.CLEAR = services.$filter("i18n")("CLEAR", services.$rootScope.loc.ale);
		$scope.version = services.$filter("i18n")("version", services.$rootScope.loc.ale);

		$scope.local_data_villages = [];
		$scope.local_list_defense = [];
		$scope.data_defense = data_defense;
		$scope.data_villages = data_villages;
		$scope.text_version = $scope.version + " " + data_defense.version;

		var self = this,
		loaded = false
		,TABS = {
				DEFENSE	: services.$filter("i18n")("defense", services.$rootScope.loc.ale, "defense"),
				TROOPS	: services.$filter("i18n")("troops", services.$rootScope.loc.ale, "defense")
		}
		, TAB_ORDER = [
			TABS.DEFENSE,
			TABS.TROOPS
			]
		, setActiveTab = function setActiveTab(tab) {
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
		, update_all = function(){
			
			$scope.local_list_defense = [];
			$scope.local_data_villages = services.VillageService.getLocalVillages("defense", "label");

			var id = 0;

			Object.keys($scope.data_defense.list_defense).map(function(key){
				$scope.local_list_defense.push({
					id : id++,
					name : key,
					value : $scope.data_defense.list_defense[key]
				})
				return $scope.local_list_defense;
			})

			$scope.village_selected = $scope.local_data_villages[0]

			$scope.data_units = services.MainService.getSelects($scope.local_list_defense)
			$scope.data_select = services.MainService.getSelects($scope.local_data_villages)

		}

		$scope.userSetActiveTab = function(tab){
			setActiveTab(tab);
		}

		$scope.jumpToVillage = function(vid){
			if(!vid){return}
			var village = services.VillageService.getVillage(vid)
			if(!village){return}
			let x = village.data.x
			let y = village.data.y
			services.VillageService.setVillage(village)
			services.mapService.jumpToVillage(x, y);
			$scope.closeWindow();
		}

		$scope.getLabelStart = function(param){
			let vid = param.start_village;
			if(!vid){return}
			return $scope.local_data_villages.find(f=>f.id==vid).label
		}

		$scope.getLabelTarget = function(param){
			let vid = param.target_village;
			if(!vid){return}
			return $scope.local_data_villages.find(f=>f.id==vid).label
		}

		$scope.getClass = function(name){
			if(!name){return}
			return "icon icon-34x34-unit-" + name;
		}

		$scope.getHoraSend = function(param){
			return services.$filter("date")(new Date(param.data_escolhida - param.time_sniper_ant), "HH:mm:ss.sss");
		}

		$scope.getDataSend = function(param){
			return services.$filter("date")(new Date(param.data_escolhida - param.time_sniper_ant), "dd/MM/yyyy");
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

		$scope.getDataRetorno = function(param){
			return services.$filter("date")(new Date(param.data_escolhida + param.time_sniper_post), "dd/MM/yyyy");
		}

		$scope.getTimeRest = function(param){
			var difTime = param.data_escolhida - time.convertedTime() - param.time_sniper_ant; 
			if(!difTime){return}
			return helper.readableMilliseconds(difTime)
		}

		$scope.clear_defense = function(){
			services.DefenseService.removeAll();
		}

		$scope.selectAllUnits = function(){
			Object.keys($scope.data_defense.list_defense).map(function(key){
				$scope.data_defense.list_defense[key] = true;
			})
			$scope.data_defense.set();
			update_all();
		}

		$scope.unselectAllUnits = function(){
			Object.keys($scope.data_defense.list_defense).map(function(key){
				$scope.data_defense.list_defense[key] = false;
			})
			$scope.data_defense.set();
			update_all();
		}

		$scope.selectAllVillages = function(){
			Object.keys($scope.data_villages.villages).map(function(key){
				$scope.data_villages.villages[key].defense_activate = true;
			})
			$scope.data_villages.set();
			update_all();
		}

		$scope.unselectAllVillages = function(){
			Object.keys($scope.data_villages.villages).map(function(key){
				$scope.data_villages.villages[key].defense_activate = false;
			})
			$scope.data_villages.set();
			update_all();
		}

		$scope.menu = function () {
			services.$rootScope.$broadcast(providers.eventTypeProvider.OPEN_MAIN);
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
			if(!$scope.data_defense || !loaded){return}
			services.DefenseService.stop();
			$scope.data_defense.set();
			services.DefenseService.start();
		}, true)

		$scope.$watch("data_villages", function () {
			if(!$scope.data_villages || !loaded) {return}
			services.DefenseService.stop();
			$scope.data_villages.set();
			services.DefenseService.start(true);
		}, true)

		$scope.requestedTab = TABS.DEFENSE;
		$scope.TABS = TABS;
		$scope.TAB_ORDER = TAB_ORDER;

		loaded = true;
		update_all();
		initTab();
		update();

		$scope.setCollapse();

		return $scope;
	}
})