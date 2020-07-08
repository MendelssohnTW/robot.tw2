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
], function (
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
) {
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

			var self = this
				, update = function () {
					$scope.comandos = services.DefenseService.get_commands();
					$scope.comandos.sort(function (a, b) { return (a.data_escolhida - time.convertedTime() - a.time_sniper_ant) - (b.data_escolhida - time.convertedTime() - b.time_sniper_ant) })
					if (!$scope.$$phase) {
						$scope.$apply();
					}
				}
				, update_all = function () {
					$scope.local_data_villages = services.VillService.getLocalVillages("defense", "label");
					$scope.data_select = services.MainService.getSelects($scope.local_data_villages, $scope.local_data_villages.find(f => f.id == services.modelDataService.getSelectedCharacter().getSelectedVillage().getId()), "id")
				}

			$scope.jumpToVillage = function (vid) {
				if (!vid) { return }
				var village = services.modelDataService.getSelectedCharacter().getVillage(vid)
				if (!village) { return }
				services.$rootScope.$broadcast(providers.eventTypeProvider.MAP_SELECT_VILLAGE, village.getId());
				services.mapService.jumpToVillage(village.getX(), village.getY());
				$scope.closeWindow();
			}

			$scope.getLabelStart = function (param) {
				let vid = param.start_village;
				if (!vid) { return }
				return $scope.local_data_villages.find(f => f.id == vid).label
			}

			$scope.getLabelTarget = function (param) {
				let vid = param.target_village;
				if (!vid) { return }
				return $scope.local_data_villages.find(f => f.id == vid).label
			}

			$scope.getClass = function (name) {
				if (!name) { return }
				return "icon icon-34x34-unit-" + name;
			}

			$scope.getTimeRest = function (param) {
				var difTime = param.data_escolhida - time.convertedTime() - param.time_sniper_ant;
				if (!difTime) { return }
				return helper.readableMilliseconds(difTime)
			}

			$scope.clear_defense = function () {
				services.DefenseService.removeAll();
			}

			$scope.selectAllUnits = function () {
				let value = $scope.data_defense.list_defense[$scope.data_units.selectedOption.name]
				Object.keys($scope.data_defense.list_defense).map(function (key) {
					$scope.data_defense.list_defense[key] = value;
				})
				//			$scope.data_defense.set();
				//			update_all();
			}

			$scope.selectAllVillages = function () {
				let defense_activate = $scope.data_villages.villages[$scope.data_select.selectedOption.id].defense_activate
					, sniper_attack = $scope.data_villages.villages[$scope.data_select.selectedOption.id].sniper_attack
					, sniper_defense = $scope.data_villages.villages[$scope.data_select.selectedOption.id].sniper_defense
					, sniper_resources = $scope.data_villages.villages[$scope.data_select.selectedOption.id].sniper_resources;
				Object.keys($scope.data_villages.villages).map(function (key) {
					$scope.data_villages.villages[key].defense_activate = defense_activate;
					$scope.data_villages.villages[key].sniper_attack = sniper_attack;
					$scope.data_villages.villages[key].sniper_defense = sniper_defense;
					$scope.data_villages.villages[key].sniper_resources = sniper_resources;
				})
				//			$scope.data_villages.set();
				//			update_all();
			}

			$scope.menu = function () {
				services.$rootScope.$broadcast(providers.eventTypeProvider.OPEN_MAIN);
			}

			$scope.removeCommand = services.DefenseService.removeCommandDefense;

			$scope.$on(providers.eventTypeProvider.CHANGE_COMMANDS_DEFENSE, function () {
				update();
			})

			$scope.$watch("data_logs.defense", function () {
				$scope.recalcScrollbar();
				if (!$scope.$$phase) {
					$scope.$apply();
				}
			}, true)

			var first_1 = true
				, first_2 = true;

			//		$scope.$watch("data_defense.selectedOption", function(){
			//			if(!$scope.data_defense || first_1){
			//				first_1 = undefined
			//				return
			//			}
			//			services.DefenseService.stop();
			//			$scope.data_defense.set();
			//			services.DefenseService.start();
			//		}, true)

			$scope.$watch("data_select.selectedOption", function () {
				if (!$scope.data_select) { return }
				services.villageService.setSelectedVillage($scope.data_select.selectedOption.id)
			}, true)

			//		$scope.$watch("data_villages", function () {
			//			if(!$scope.data_villages || first_2) {
			//				first_2 = undefined
			//				return
			//			}
			//			$scope.data_villages.set();
			//		}, true)

			$scope.$on("$destroy", function () {
				$scope.data_villages.set();
				$scope.data_defense.set();
			});


			//		$scope.$on(providers.eventTypeProvider.VILLAGE_SELECTED_CHANGED, update_all);

			$scope.local_data_villages = services.VillService.getLocalVillages("defense", "label");
			$scope.data_select = services.MainService.getSelects($scope.local_data_villages, $scope.local_data_villages.find(f => f.id == services.modelDataService.getSelectedCharacter().getSelectedVillage().getId()), "id")


			//		update_all();
			update();

			$scope.setCollapse();

			return $scope;
		}
	})