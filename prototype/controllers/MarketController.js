define("robotTW2/controllers/MarketController", [
	"robotTW2/services",
	"robotTW2/providers",
	"helper/time",
	"robotTW2/time",
	"robotTW2/databases/data_villages",
	"robotTW2/databases/data_market",
	"robotTW2/autocomplete",
	"robotTW2/notify",
	"helper/math",
	"conf/conf",
	"robotTW2/services/ProvinceService"
], function (
	services,
	providers,
	helper,
	time,
	data_villages,
	data_market,
	autocomplete,
	notify,
	math,
	conf_conf,
	provinceService
) {
		return function MarketController($scope) {
			$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
			$scope.MENU = services.$filter("i18n")("MENU", services.$rootScope.loc.ale);
			$scope.CLEAR = services.$filter("i18n")("CLEAR", services.$rootScope.loc.ale);
			$scope.SELECT = services.$filter("i18n")("SELECT", services.$rootScope.loc.ale);
			$scope.SEARCH_MAP = services.$filter('i18n')('SEARCH_MAP', services.$rootScope.loc.ale);
			$scope.version = services.$filter("i18n")("version", services.$rootScope.loc.ale);

			$scope.local_out_villages = [];
			$scope.data_market = data_market
			$scope.text_version = $scope.version + " " + data_market.version;

			var in_update = undefined
				, key_control = false
				, update = function () {
					!in_update ? in_update = services.$timeout(function () {
						$scope.comandos = Object.keys($scope.data_market.commands).map(function (elem, index, array) {
							$scope.local_out_villages.push(
								{
									"id": $scope.data_market.commands[elem].target_village,
									"label": $scope.data_market.commands[elem].target_name + " (" + $scope.data_market.commands[elem].target_x + "|" + $scope.data_market.commands[elem].target_y + ")",
									"x": $scope.data_market.commands[elem].target_x,
									"y": $scope.data_market.commands[elem].target_y
								});
							if (!$scope.$$phase) { $scope.$apply() }
							return $scope.data_market.commands[elem]
						});
						$scope.comandos.sort(function (a, b) { return ($scope.local_data_villages.find(f => f.id == a.start_village).name.localeCompare($scope.local_data_villages.find(f => f.id == b.start_village).name)) })
						$scope.recalcScrollbar();
						in_update = undefined;
						if (!$scope.$$phase) { $scope.$apply() }
					}, 1000) : null
				}

			$scope.isRunning = services.SpyService.isRunning();

			$scope.local_data_villages = services.VillService.getLocalVillages("market", "label");

			$scope.village_selected = $scope.local_data_villages[Object.keys($scope.local_data_villages)[0]]

			$scope.getLabelStart = function (param) {
				let vid = param.start_village;
				if (!vid) { return }
				return $scope.local_data_villages.find(f => f.id == vid).label
			}

			$scope.getLabelTarget = function (param) {
				let vid = param.target_village;
				if (!vid || !$scope.local_out_villages.find(f => f.id == vid)) { return }
				return $scope.local_out_villages.find(f => f.id == vid).label
			}

			$scope.jumpToVillage = function (vid) {
				if (!vid) { return }
				var village = services.modelDataService.getSelectedCharacter().getVillage(vid)
				if (!village) { return }
				services.$rootScope.$broadcast(providers.eventTypeProvider.MAP_SELECT_VILLAGE, village.getId());
				services.mapService.jumpToVillage(village.getX(), village.getY());
				$scope.closeWindow();
			}

			$scope.jumpOutVillage = function (vid) {
				if (!vid) { return }
				let v = $scope.local_out_villages.find(f => f.id == vid);
				if (!v) { return }
				services.$rootScope.$broadcast(providers.eventTypeProvider.MAP_SELECT_VILLAGE, vid);
				services.mapService.jumpToVillage(v.x, v.y);
				$scope.closeWindow();
			}

			$scope.removeCommand = services.MarketService.removeCommandMarket;

			$scope.$watch("data_logs.market", function () {
				$scope.recalcScrollbar();
				if (!$scope.$$phase) {
					$scope.$apply();
				}
			}, true)

			$scope.$on(providers.eventTypeProvider.CHANGE_COMMANDS, function () {
				if (!key_control) {
					key_control = true
					services.$timeout(function () {
						key_control = false
						update();
					}, 5000)
				}
			})

			$scope.menu = function () {
				services.$rootScope.$broadcast(providers.eventTypeProvider.OPEN_MAIN);
			}

			$scope.$on(providers.eventTypeProvider.INTERVAL_CHANGE, function ($event, data) {
				if (!data || data.name != "MARKET") { return }
				if (!$scope.$$phase) {
					$scope.$apply();
				}
			})

			$scope.$on("$destroy", function () {
				$scope.data_market.set();
			});

			$scope.data_select = services.MainService.getSelects($scope.local_data_villages)

			update();
			$scope.setCollapse();

			return $scope;
		}
	})

