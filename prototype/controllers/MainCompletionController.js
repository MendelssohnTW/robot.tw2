define("robotTW2/controllers/MainCompletionController", [
	"robotTW2",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/conf",
	"robotTW2/databases/data_main",
	"robotTW2/calibrate_time"
	], function(
			robotTW2,
			services,
			providers,
			conf,
			data_main,
			calibrate_time
	){
	return function MainCompletionController($scope) {
		
		$scope.openMain = function(){
			services.$rootScope.$broadcast(providers.eventTypeProvider.OPEN_MAIN);
		}

		services.$rootScope.$broadcast(providers.eventTypeProvider.INSERT_BUTTON);
		
		return $scope;
	}
})
