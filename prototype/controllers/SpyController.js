define("robotTW2/controllers/SpyController", [
	"robotTW2/services",
	"robotTW2/providers",
	"helper/time",
	"robotTW2/time",
	"robotTW2/databases/data_spy"
	], function(
			services,
			providers,
			helper,
			time,
			data_spy
	){
	return function SpyController($scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
		var self = this;
		
		$scope.data_spy = data_spy
		$scope.text_version = $scope.version + " " + data_spy.version;
		
		$scope.isRunning = services.SpyService.isRunning();
		
		$scope.blur = function(){
			var t = $("#input-ms").val();
			if(t.length <= 5) {
				t = t + ":00"
			}
			data_spy.interval = helper.unreadableSeconds(t) * 1000;
		}
		
		$scope.getTimeRest = function(){
			return data_spy.complete > time.convertedTime() ? helper.readableMilliseconds(data_spy.complete - time.convertedTime()) : 0;
		}

		
		$scope.$on(providers.eventTypeProvider.INTERVAL_CHANGE_SPY, function($event, data) {
			document.getElementById("input-ms").value = helper.readableMilliseconds(data_spy.interval).length == 7 ? "0" + helper.readableMilliseconds(data_spy.interval) : helper.readableMilliseconds(data_spy.interval);
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
		
		$scope.$watch("data_spy", function(){
			if(!$scope.data_spy){return}
			data_spy = $scope.data_spy;
			data_spy.set();
		}, true)
		
		$scope.$on("$destroy", function() {
			$scope.data_spy.set();
		});
		
		document.getElementById("input-ms").value = helper.readableMilliseconds(data_spy.interval).length == 7 ? "0" + helper.readableMilliseconds(data_spy.interval) : helper.readableMilliseconds(data_spy.interval);
		
		$scope.setCollapse();
		
		return $scope;
	}
})
