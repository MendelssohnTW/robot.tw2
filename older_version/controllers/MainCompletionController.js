define("robotTW2/controllers/MainCompletionController", [
	"robotTW2",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/conf",
	"robotTW2/databases/data_main"
	], function(
			robotTW2,
			services,
			providers,
			conf,
			data_main
	){
	return function MainCompletionController($scope) {
		
		$scope.openMain = function(){
			services.$rootScope.$broadcast(providers.eventTypeProvider.OPEN_MAIN);
		}

		
		
		return $scope;
	}
})
