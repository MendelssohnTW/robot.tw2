define("robotTW2/controllers/SpyCompletionController", [
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
		return function SpyCompletionController($scope) {
			$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
			$scope.SCHEDULE = services.$filter("i18n")("SCHEDULE", services.$rootScope.loc.ale);

			var self = this;

			services.$rootScope.$broadcast("open_get_selected_village")

			$scope.date_init = services.$filter("date")(new Date(time.convertedTime()), "yyyy-MM-dd")
			$scope.hour_init = services.$filter("date")(new Date(time.convertedTime()), "HH:mm:ss")
			$scope.ms_init = 0;

			$scope.sendAttackSpy = function () {
				if ($scope.availableSpies === 0 || $scope.option.length === 0 || $scope.rangeSlider.value === 0) {
					return;
				}
				var durationInSeconds = unreadableSeconds($scope.duration);
				var get_data = document.querySelector("#input-date").value;
				var get_time = document.querySelector("#input-time").value;
				var get_ms = document.querySelector("#input-ms").value;
				if (get_time.length <= 5) {
					get_time = get_time + ":00";
				}
				if (get_data != undefined && get_time != undefined) {
					$scope.milisegundos_duracao = durationInSeconds * 1000;
					$scope.tempo_escolhido = new Date(get_data + " " + get_time + "." + get_ms).getTime();
					if ($scope.tempo_escolhido > time.convertedTime() + $scope.milisegundos_duracao) {
						$scope.startId = services.modelDataService.getSelectedVillage().data.villageId;
						services.SpyService.sendCommandAttackSpy($scope)
						$scope.closeWindow();
					} else {
						notify("date_error");
					}
				} else {
					return;
				}
			}

			$scope.$on("$destroy", function () {
				services.$rootScope.$broadcast("close_get_selected_village")
			});

			if (!$scope.$$phase) {
				$scope.$apply();
			}

			return $scope;
		}
	})