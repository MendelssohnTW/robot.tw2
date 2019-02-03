define("robotTW2/controllers/SecondVillageController", [
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/conf",
	"helper/time",
	], function(
			services,
			providers,
			conf,
			helper
	){
	return function SecondVillageController($scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
		var self = this;

		$scope.getTimeRest = function(){
			if(services.$rootScope.data_secondvillage.complete > helper.gameTime()){
				return helper.readableMilliseconds(services.$rootScope.data_secondvillage.complete - helper.gameTime())
			} else {
				return helper.readableMilliseconds(conf.MIN_INTERVAL)
			}
		}

		$scope.$on(providers.eventTypeProvider.INTERVAL_CHANGE_DEPOSIT, function($event, data) {
			if(document.getElementById("input-ms")){
				document.getElementById("input-ms").value = helper.readableMilliseconds(services.$rootScope.data_secondvillage.interval).length == 7 ? "0" + helper.readableMilliseconds(services.$rootScope.data_secondvillage.interval) : helper.readableMilliseconds(services.$rootScope.data_secondvillage.interval);
				if (!$scope.$$phase) {
					$scope.$apply();
				}
			}
		})

		$scope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function($event, data) {
			$scope.isRunning = services.DepositService.isRunning();
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		})

		document.getElementById("input-ms").value = helper.readableMilliseconds(services.$rootScope.data_secondvillage.interval).length == 7 ? "0" + helper.readableMilliseconds(services.$rootScope.data_secondvillage.interval) : helper.readableMilliseconds(services.$rootScope.data_secondvillage.interval);

		return $scope;
	}
})
