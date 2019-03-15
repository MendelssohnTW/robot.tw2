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
	return function DepositController($scope) {
		
		$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
		$scope.MENU = services.$filter("i18n")("MENU", services.$rootScope.loc.ale);
		$scope.version = services.$filter("i18n")("version", services.$rootScope.loc.ale);
		var self = this;

		$scope.data_deposit = data_deposit;
		$scope.text_version = $scope.version + " " + data_deposit.version;
		
		$scope.getTimeRest = function(){
			if($scope.data_deposit.complete > time.convertedTime()){
				return helper.readableMilliseconds($scope.data_deposit.complete - time.convertedTime())
			} else {
				return 0;
			}
		}
		
		$scope.menu = function () {
			services.$rootScope.$broadcast(providers.eventTypeProvider.OPEN_MAIN);
		}

		$scope.$on(providers.eventTypeProvider.INTERVAL_CHANGE_DEPOSIT, function($event, data) {
			if(document.getElementById("input-ms")){
				document.getElementById("input-ms").value = helper.readableMilliseconds($scope.data_deposit.interval).length == 7 ? "0" + helper.readableMilliseconds($scope.data_deposit.interval) : helper.readableMilliseconds($scope.data_deposit.interval);
				if (!$scope.$$phase) {
					$scope.$apply();
				}
			}
		})

		$scope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function($event, data) {
			$scope.isRunning = services.DepositService.isRunning();
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		})
		
		$scope.$watch("data_deposit", function(){
			if(!$scope.data_deposit){return}
			data_deposit = $scope.data_deposit;
			data_deposit.set();
		}, true)

		document.getElementById("input-ms").value = helper.readableMilliseconds($scope.data_deposit.interval).length == 7 ? "0" + helper.readableMilliseconds($scope.data_deposit.interval) : helper.readableMilliseconds($scope.data_deposit.interval);

		$scope.setCollapse();
		
		return $scope;
	}
})
