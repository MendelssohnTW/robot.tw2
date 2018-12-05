define("robotTW2/controllers/DepositController", [
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
	return function DepositController($rootScope, $scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		var self = this;

		$scope.getTimeRest = function(){
			if($rootScope.data_secondvillage.complete > helper.gameTime()){
				return helper.readableMilliseconds($rootScope.data_secondvillage.complete - helper.gameTime())
			} else {
				return 0;
			}
		}

		$rootScope.$on(providers.eventTypeProvider.INTERVAL_CHANGE_DEPOSIT, function($event, data) {
			if(document.getElementById("input-ms")){
				document.getElementById("input-ms").value = helper.readableMilliseconds($rootScope.data_secondvillage.interval).length == 7 ? "0" + helper.readableMilliseconds($rootScope.data_secondvillage.interval) : helper.readableMilliseconds($rootScope.data_secondvillage.interval);
				if (!$rootScope.$$phase) {
					$rootScope.$apply();
				}
			}
		})

		$rootScope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function($event, data) {
			$scope.isRunning = services.DepositService.isRunning();
			if (!$rootScope.$$phase) {
				$rootScope.$apply();
			}
		})

		document.getElementById("input-ms").value = helper.readableMilliseconds($rootScope.data_secondvillage.interval).length == 7 ? "0" + helper.readableMilliseconds($rootScope.data_secondvillage.interval) : helper.readableMilliseconds($rootScope.data_secondvillage.interval);

		return $scope;
	}
})
