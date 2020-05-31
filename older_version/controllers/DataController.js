define("robotTW2/controllers/DataController", [
	"robotTW2/services",
	"robotTW2/providers",
	"helper/time",
	"robotTW2/conf",
	"robotTW2/time",
	"robotTW2/databases/data_data",
	], function(
			services,
			providers,
			helper,
			conf,
			time,
			data_data
	){
	return function DataController($scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
		$scope.START = services.$filter("i18n")("START", services.$rootScope.loc.ale);
		$scope.STOP = services.$filter("i18n")("STOP", services.$rootScope.loc.ale);
		$scope.version = services.$filter("i18n")("version", services.$rootScope.loc.ale);
		
		var self = this;

		$scope.getTimeRestVillages = function(){
			if(data_data.complete_villages > time.convertedTime()){
				return helper.readableMilliseconds(data_data.complete_villages - time.convertedTime())
			} else {
				return 0;
			}
		}

		$scope.getTimeRestTribes = function(){
			if(data_data.complete_tribes > time.convertedTime()){
				return helper.readableMilliseconds(data_data.complete_tribes - time.convertedTime())
			} else {
				return 0;
			}
		}

		$scope.$on(providers.eventTypeProvider.INTERVAL_CHANGE_DATA, function($event, data) {
			if(document.getElementById("input-ms-villages")){
				document.getElementById("input-ms-villages").value = helper.readableMilliseconds(data_data.interval.villages).length == 7 ? "0" + helper.readableMilliseconds(data_data.interval.villages) : helper.readableMilliseconds(data_data.interval.villages);
			}
			if(document.getElementById("input-ms-tribes")){
				document.getElementById("input-ms-tribes").value = helper.readableMilliseconds(data_data.interval.tribes).length == 7 ? "0" + helper.readableMilliseconds(data_data.interval.tribes) : helper.readableMilliseconds(data_data.interval.tribes);
			}
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		})

		$scope.start_data = function () {
			services.DataService.start();
			$scope.isRunning = services.DataService.isRunning();
		}
		
		$scope.stop_data = function () {
			services.DataService.stopAll();
		}

		$scope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function($event, data) {
			$scope.isRunning = services.DataService.isRunning();
			if (!$rootScope.$$phase) {
				$rootScope.$apply();
			}
		})
		
		$scope.$watch("data_logs.data", function(){
			$scope.recalcScrollbar();
			if (!$rootScope.$$phase) {
				$rootScope.$apply();
			}
		}, true)

		$scope.setCollapse();
		$scope.recalcScrollbar();

		return $scope;
	}
})