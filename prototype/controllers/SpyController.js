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
	return function SpyController($rootScope, $scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		var self = this;
		
		$scope.isRunning = services.SpyService.isRunning();
		
		$scope.blur = function(){
			var t = $("#input-ms").val();
			if(t.length <= 5) {
				t = t + ":00"
			}
			$rootScope.data_spy.interval = helper.unreadableSeconds(t) * 1000;
		}
		
		$scope.getTimeRest = function(){
			return $rootScope.data_spy.complete > time.convertedTime() ? helper.readableMilliseconds($rootScope.data_spy.complete - time.convertedTime()) : 0;
		}

		
		$scope.$on(providers.eventTypeProvider.INTERVAL_CHANGE_SPY, function($event, data) {
			document.getElementById("input-ms").value = helper.readableMilliseconds($rootScope.data_spy.interval).length == 7 ? "0" + helper.readableMilliseconds($rootScope.data_spy.interval) : helper.readableMilliseconds($rootScope.data_spy.interval);
			if (!$rootScope.$$phase) {
				$rootScope.$apply();
			}
		})
		
		$scope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function($event, data) {
			$scope.isRunning = services.SpyService.isRunning();
			if (!$rootScope.$$phase) {
				$rootScope.$apply();
			}
		})
		
		$scope.$watch("data_logs.spy", function(){
			$scope.recalcScrollbar();
			if (!$rootScope.$$phase) {
				$rootScope.$apply();
			}
		}, true)

		
		document.getElementById("input-ms").value = helper.readableMilliseconds($rootScope.data_spy.interval).length == 7 ? "0" + helper.readableMilliseconds($rootScope.data_spy.interval) : helper.readableMilliseconds($rootScope.data_spy.interval);
		
		$scope.setCollapse();
		$scope.recalcScrollbar();
		
		return $scope;
	}
})
