define("robotTW2/controllers/MarketCompletionController", [
	"robotTW2/services",
	"robotTW2/time",
	"helper/time",
	"robotTW2/notify",
	"robotTW2/unreadableSeconds"
], function (
	services,
	time,
	helper,
	notify,
	unreadableSeconds
) {
		return function MarketCompletionController($scope) {
			$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
			$scope.SCHEDULE = services.$filter("i18n")("SCHEDULE", services.$rootScope.loc.ale);

			var self = this;

			services.$rootScope.$broadcast("open_get_selected_village_market")

			$scope.date_init = services.$filter("date")(new Date(time.convertedTime()), "yyyy-MM-dd")
			$scope.hour_init = services.$filter("date")(new Date(time.convertedTime()), "HH:mm:ss")
			$scope.ms_init = 0;

			$scope.sendMarket = function () {
				if ($scope.merchants.free === 0 || ($scope.rangeSlider.wood.value === 0 && $scope.rangeSlider.clay.value === 0 && $scope.rangeSlider.iron.value === 0)) {
					return;
				}
				let durationInSeconds = unreadableSeconds($scope.duration);
				$scope.milisegundos_duracao = durationInSeconds * 1000;
				$scope.startId = services.modelDataService.getSelectedVillage().data.villageId;
				services.MarketService.sendCommandMarket($scope)
			}

			$scope.$on("$destroy", function () {
				services.$rootScope.$broadcast("close_get_selected_village_market")
			});

			if (!$scope.$$phase) {
				$scope.$apply();
			}

			return $scope;
		}
	})