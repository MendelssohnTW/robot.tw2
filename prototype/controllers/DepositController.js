define("robotTW2/controllers/DepositController", [
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/conf",
	"robotTW2/time",
	"helper/time",
	"robotTW2/databases/data_deposit",
	], function(
			services,
			providers,
			conf,
			time,
			helper,
			data_deposit
	){
	return function DepositController($rootScope, $scope) {
		$scope.data_deposit = data_deposit;
		$scope.CLOSE = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		var self = this;

		$scope.getTimeRest = function(){
			if($scope.data_deposit.complete > time.convertedTime()){
				return helper.readableMilliseconds($scope.data_deposit.complete - time.convertedTime())
			} else {
				return 0;
			}
		}

		$scope.$on(providers.eventTypeProvider.INTERVAL_CHANGE_DEPOSIT, function($event, data) {
			if(document.getElementById("input-ms")){
				document.getElementById("input-ms").value = helper.readableMilliseconds($scope.data_deposit.interval).length == 7 ? "0" + helper.readableMilliseconds($scope.data_deposit.interval) : helper.readableMilliseconds($scope.data_deposit.interval);
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
		
		$scope.$watch("data_deposit", function(){
			if(!$scope.data_deposit){return}
			data_deposit = $scope.data_deposit;
			data_deposit.set();
		}, true)

		document.getElementById("input-ms").value = helper.readableMilliseconds($scope.data_deposit.interval).length == 7 ? "0" + helper.readableMilliseconds($scope.data_deposit.interval) : helper.readableMilliseconds($scope.data_deposit.interval);

		return $scope;
	}
})
