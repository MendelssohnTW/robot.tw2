define("robotTW2/controllers/DataController", [
	"robotTW2/services",
	"robotTW2/providers",
	"helper/time",
	"robotTW2/conf",
	], function(
			services,
			providers,
			helper,
			conf
	){
	return function DataController($rootScope, $scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		var self = this;

		$scope.getTimeRest = function(){
			if($rootScope.data_data.complete > convertedTime()){
				return helper.readableMilliseconds($rootScope.data_data.complete - convertedTime())
			} else {
				return 0;
			}
		}

		$rootScope.$on(providers.eventTypeProvider.INTERVAL_CHANGE_DATA, function($event, data) {
			if(document.getElementById("input-ms")){
				document.getElementById("input-ms").value = helper.readableMilliseconds($rootScope.data_data.interval).length == 7 ? "0" + helper.readableMilliseconds($rootScope.data_data.interval) : helper.readableMilliseconds($rootScope.data_data.interval);
				if (!$rootScope.$$phase) {
					$rootScope.$apply();
				}
			}
		})

		$scope.start_data = function () {
			services.DataService.start();
			$scope.isRunning = services.DataService.isRunning();
		}
		
		$scope.stop_data = function () {
			services.DataService.stop();
		}

		$rootScope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function($event, data) {
			$scope.isRunning = services.DataService.isRunning();
			if (!$rootScope.$$phase) {
				$rootScope.$apply();
			}
		})

		$scope.interval_data = helper.readableMilliseconds($rootScope.data_data.interval)

		$scope.setCollapse();
		$scope.recalcScrollbar();

		return $scope;
	}
})