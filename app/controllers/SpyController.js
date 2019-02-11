define("robotTW2/controllers/SpyController", [
	"robotTW2/services",
	"robotTW2/providers",
	"helper/time",
	"robotTW2/time",
	], function(
			services,
			providers,
			helper,
			time
	){
	return function SpyController($scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
		var self = this;
		
		$scope.isRunning = services.SpyService.isRunning();
		
		$scope.blur = function(){
			var t = $("#input-ms").val();
			if(t.length <= 5) {
				t = t + ":00"
			}
			services.$rootScope.data_spy.interval = helper.unreadableSeconds(t) * 1000;
		}
		
		$scope.getTimeRest = function(){
			return services.$rootScope.data_spy.complete > time.convertedTime() ? helper.readableMilliseconds(services.$rootScope.data_spy.complete - time.convertedTime()) : 0;
		}

		
		$scope.$on(providers.eventTypeProvider.INTERVAL_CHANGE_SPY, function($event, data) {
			document.getElementById("input-ms").value = helper.readableMilliseconds(services.$rootScope.data_spy.interval).length == 7 ? "0" + helper.readableMilliseconds(services.$rootScope.data_spy.interval) : helper.readableMilliseconds(services.$rootScope.data_spy.interval);
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		})
		
		$scope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function($event, data) {
			$scope.isRunning = services.SpyService.isRunning();
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		})
		
		$scope.$watch("data_logs.spy", function(){
			$scope.recalcScrollbar();
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		}, true)

		
		document.getElementById("input-ms").value = helper.readableMilliseconds(services.$rootScope.data_spy.interval).length == 7 ? "0" + helper.readableMilliseconds(services.$rootScope.data_spy.interval) : helper.readableMilliseconds(services.$rootScope.data_spy.interval);
		
		$scope.setCollapse();
		$scope.recalcScrollbar();
		
		return $scope;
	}
})
