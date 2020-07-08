define("robotTW2/controllers/RecruitController", [
	"helper/time",
	"robotTW2/time",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/conf",
	"conf/unitTypes",
	"robotTW2/databases/data_recruit",
	"robotTW2/databases/data_villages",
	"helper/format"
], function (
	helper,
	time,
	services,
	providers,
	conf,
	unitTypes,
	data_recruit,
	data_villages,
	formatHelper
) {
		return function RecruitController($scope) {
			$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
			$scope.MENU = services.$filter("i18n")("MENU", services.$rootScope.loc.ale);
			$scope.START = services.$filter("i18n")("START", services.$rootScope.loc.ale);
			$scope.STOP = services.$filter("i18n")("STOP", services.$rootScope.loc.ale);
			$scope.version = services.$filter("i18n")("version", services.$rootScope.loc.ale);

			$scope.data_recruit = data_recruit
			$scope.text_version = $scope.version + " " + data_recruit.version;
			$scope.data_villages = data_villages;
			$scope.local_data_groups = []
			$scope.local_data_villages = []

			$scope.isRunning = services.RecruitService.isRunning();

			var self = this
				, return_units = function () {
					var units = {};
					Object.keys(unitTypes).map(function (key) {
						if (data_recruit.troops_not.some(elem => elem == unitTypes[key])) {
							delete units[unitTypes[key]]
						} else {
							units[unitTypes[key]] = 0
						}
					})
					return units
				}
				, getVillage = function getVillage(vid) {
					if (!vid) { return }
					return angular.copy(services.modelDataService.getSelectedCharacter().getVillage(vid))
				}
				, update_all = function () {
					$scope.local_data_villages = services.VillService.getLocalVillages("recruit", "label");
					$scope.data_select = services.MainService.getSelects($scope.local_data_villages, $scope.local_data_villages.find(f => f.id == services.modelDataService.getSelectedCharacter().getSelectedVillage().getId()), "id")
				}

			$scope.getTimeRest = function () {
				return $scope.data_recruit.complete > time.convertedTime() && $scope.isRunning ? helper.readableMilliseconds($scope.data_recruit.complete - time.convertedTime()) : 0;
			}

			$scope.getText = function (key) {
				return services.$filter("i18n")("text_" + key, services.$rootScope.loc.ale, "recruit");
			}

			$scope.getClass = function (key) {
				return "icon-20x20-unit-" + key;
			}

			$scope.start_recruit = function () {
				services.RecruitService.start();
				$scope.isRunning = services.RecruitService.isRunning();
			}

			$scope.stop_recruit = function () {
				services.RecruitService.stop();
				$scope.isRunning = services.RecruitService.isRunning();
				$scope.data_recruit.complete = 0
			}

			$scope.pause_recruit = function () {
				services.RecruitService.pause();
				$scope.paused = !0;
			}

			$scope.resume_recruit = function () {
				services.RecruitService.resume();
				$scope.paused = !1;
			}

			$scope.menu = function () {
				services.$rootScope.$broadcast(providers.eventTypeProvider.OPEN_MAIN);
			}

			$scope.$watch("data_groups", function () {
				if (!$scope.data_groups) { return }
				if (!$scope.data_groups.selectedOption.units) {
					$scope.data_groups.selectedOption.units = return_units();
				}
			})

			$scope.$on(providers.eventTypeProvider.INTERVAL_CHANGE, function ($event, data) {
				if (!data || data.name != "RECRUIT") { return }
				if (!$scope.$$phase) {
					$scope.$apply();
				}
			})

			$scope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function ($event, data) {
				if (!data || data.name != "RECRUIT") { return }
				$scope.isRunning = services.RecruitService.isRunning();
				if (!$scope.$$phase) {
					$scope.$apply();
				}
			})

			$scope.selectAllVillages = function () {
				Object.keys($scope.data_villages.villages).map(function (key) {
					$scope.data_villages.villages[key].recruit_activate = true;
				})
				update_all();
			}

			$scope.unselectAllVillages = function () {
				Object.keys($scope.data_villages.villages).map(function (key) {
					$scope.data_villages.villages[key].recruit_activate = false;
				})
				update_all();
			}

			Object.keys($scope.data_recruit.groups).map(function (key) {
				if (!$scope.data_recruit.groups[key].units) {
					$scope.data_recruit.groups[key].units = return_units();
				}
				$scope.local_data_groups.push($scope.data_recruit.groups[key])
				$scope.local_data_groups.sort(function (a, b) { return a.name.localeCompare(b.name) })
				return $scope.local_data_groups;
			})

			$scope.data_groups = services.MainService.getSelects($scope.local_data_groups)

			//		$scope.$watch("data_villages", function () {
			//			if(!$scope.data_villages) {return}
			//			services.DefenseService.stop();
			//			$scope.data_villages.set();
			//			services.DefenseService.start(true);
			//		}, true)

			$scope.$watch("data_select.selectedOption", function () {
				if (!$scope.data_select) { return }
				services.villageService.setSelectedVillage($scope.data_select.selectedOption.id)
			}, true)

			$scope.isRunning = services.RecruitService.isRunning();
			$scope.isPaused = services.RecruitService.isPaused();

			//		$scope.$watch("data_recruit", function(){
			//			if(!$scope.data_recruit){return}
			//			data_recruit = $scope.data_recruit;
			//			data_recruit.set();
			//		}, true)

			$scope.$on("$destroy", function () {
				$scope.data_recruit.set();
			});

			$scope.$on(providers.eventTypeProvider.VILLAGE_SELECTED_CHANGED, update_all);

			update_all();

			$scope.setCollapse();

			return $scope;
		}
	})
