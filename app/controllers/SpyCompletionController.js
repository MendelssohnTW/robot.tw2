define("robotTW2/controllers/SpyCompletionController", [
	"robotTW2/services",
	"robotTW2/time"
	], function(
			services,
			time
	){
	return function SpyCompletionController($scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
		$scope.SCHEDULE = services.$filter("i18n")("SCHEDULE", services.$rootScope.loc.ale);
		
		var self = this;

		services.$rootScope.$broadcast("open_get_selected_village")
		
		$scope.date_init = services.$filter("date")(new Date(time.convertedTime()), "yyyy-MM-dd")
		$scope.hour_init = services.$filter("date")(new Date(time.convertedTime()), "HH:mm:ss")
		$scope.ms_init = 0;

		$scope.sendAttackSpy = function(){
			$scope.startId = services.modelDataService.getSelectedVillage().data.villageId;
			services.SpyService.sendCommandAttackSpy($scope)
		}
		
		$scope.$on("$destroy", function() {
			services.$rootScope.$broadcast("close_get_selected_village")
		});


		if (!$scope.$$phase) {
			$scope.$apply();
		}

		return $scope;
	}
})