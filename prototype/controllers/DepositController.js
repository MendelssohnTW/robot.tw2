define("robotTW2/controllers/DepositController", [
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/conf",
	"robotTW2/time",
	"helper/time"
	], function(
			services,
			providers,
			conf,
			convertedTime,
			helper
	){
	return function DepositController($rootScope, $scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		var self = this;

		$scope.getTimeRest = function(){
			if($rootScope.data_deposit.complete > convertedTime()){
				return helper.readableMilliseconds($rootScope.data_deposit.complete - convertedTime())
			} else {
				return 0;
			}
		}

		$scope.$on(providers.eventTypeProvider.INTERVAL_CHANGE_DEPOSIT, function($event, data) {
			if(document.getElementById("input-ms")){
				document.getElementById("input-ms").value = helper.readableMilliseconds($rootScope.data_deposit.interval).length == 7 ? "0" + helper.readableMilliseconds($rootScope.data_deposit.interval) : helper.readableMilliseconds($rootScope.data_deposit.interval);
				if (!$rootScope.$$phase) {
					$rootScope.$apply();
				}
			}
		})

		$scope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function($event, data) {
			$scope.isRunning = services.DepositService.isRunning();
			if (!$rootScope.$$phase) {
				$rootScope.$apply();
			}
		})

		document.getElementById("input-ms").value = helper.readableMilliseconds($rootScope.data_deposit.interval).length == 7 ? "0" + helper.readableMilliseconds($rootScope.data_deposit.interval) : helper.readableMilliseconds($rootScope.data_deposit.interval);

		return $scope;
	}
})
