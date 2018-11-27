define("robotTW2/controllers/DepositController", [
	"robotTW2/services",
	"robotTW2/providers",
	"helper/time",
	], function(
			services,
			providers,
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
			return $rootScope.data_deposit.time_complete > helper.gameTime() ? helper.readableMilliseconds($rootScope.data_deposit.time_complete - helper.gameTime()) : 0;
		}
		
		$rootScope.$on(providers.eventTypeProvider.INTERVAL_CHANGE_DEPOSIT, function() {
			document.getElementById("input-ms").value = helper.readableMilliseconds($rootScope.data_deposit.interval).length == 7 ? "0" + helper.readableMilliseconds($rootScope.data_deposit.interval) : helper.readableMilliseconds($rootScope.data_deposit.interval);
			if (!$rootScope.$$phase) {
				$rootScope.$apply();
			}
		})
		
		document.getElementById("input-ms").value = helper.readableMilliseconds($rootScope.data_deposit.interval).length == 7 ? "0" + helper.readableMilliseconds($rootScope.data_deposit.interval) : helper.readableMilliseconds($rootScope.data_deposit.interval);
		
		return $scope;
	}
})