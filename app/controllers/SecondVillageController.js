define("robotTW2/controllers/SecondVillageController", [
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/conf",
	"helper/time",
	"robotTW2/databases/data_secondvillage"
], function (
	services,
	providers,
	conf,
	helper,
	data_secondvillage
) {
		return function SecondVillageController($scope) {
			$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
			$scope.MENU = services.$filter("i18n")("MENU", services.$rootScope.loc.ale);
			$scope.version = services.$filter("i18n")("version", services.$rootScope.loc.ale);
			var self = this;

			$scope.data_secondvillage = data_secondvillage
			$scope.text_version = $scope.version + " " + data_secondvillage.version;

			$scope.getTimeRest = function () {
				if (data_secondvillage.complete > helper.gameTime()) {
					return helper.readableMilliseconds(data_secondvillage.complete - helper.gameTime())
				} else {
					return helper.readableMilliseconds(conf.MIN_INTERVAL)
				}
			}

			$scope.menu = function () {
				services.$rootScope.$broadcast(providers.eventTypeProvider.OPEN_MAIN);
			}

			$scope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function ($event, data) {
				if (!data || data.name != "SECONDVILLAGE") { return }
				$scope.isRunning = services.DepositService.isRunning();
				if (!$scope.$$phase) {
					$scope.$apply();
				}
			})

			$scope.$watch("data_secondvillage", function () {
				if (!$scope.data_secondvillage) { return }
				data_secondvillage = $scope.data_secondvillage;
				data_secondvillage.set();
			}, true)

			$scope.$on("$destroy", function () {
				$scope.data_secondvillage.set();
			});

			document.getElementById("input-ms").value = helper.readableMilliseconds(data_secondvillage.interval).length == 7 ? "0" + helper.readableMilliseconds(data_secondvillage.interval) : helper.readableMilliseconds(data_secondvillage.interval);

			$scope.setCollapse();

			return $scope;
		}
	})
