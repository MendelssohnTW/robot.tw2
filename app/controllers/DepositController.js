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

		$scope.blur = function(){
			var t = $("#input-ms").val();
			if(t.length <= 5) {
				t = t + ":00"
			}
			$rootScope.data_deposit.interval = helper.unreadableSeconds(t) * 1000;
		}

		$scope.getTimeRest = function(){
			if($rootScope.data_deposit.complete > helper.gameTime()){
				return helper.readableMilliseconds($rootScope.data_deposit.complete - helper.gameTime())
			} else {
				return helper.readableMilliseconds(conf.MIN_INTERVAL)
			}
		}

		$rootScope.$on(providers.eventTypeProvider.INTERVAL_CHANGE_DEPOSIT, function($event, data) {
			if(document.getElementById("input-ms")){
				document.getElementById("input-ms").value = helper.readableMilliseconds($rootScope.data_deposit.interval).length == 7 ? "0" + helper.readableMilliseconds($rootScope.data_deposit.interval) : helper.readableMilliseconds($rootScope.data_deposit.interval);
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

		document.getElementById("input-ms").value = helper.readableMilliseconds($rootScope.data_deposit.interval).length == 7 ? "0" + helper.readableMilliseconds($rootScope.data_deposit.interval) : helper.readableMilliseconds($rootScope.data_deposit.interval);

		return $scope;
	}
})
