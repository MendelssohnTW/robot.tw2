define("robotTW2/controllers/FarmCompletionController", [
	"robotTW2/services",
	"helper/time",
	], function(
			services,
			helper
	){
	return function FarmCompletionController($scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
		
		var self = this
		, addExcept = function (id) {
			!services.$rootScope.data_farm.list_exceptions.find(f => f == id) ? services.$rootScope.data_farm.list_exceptions.push(id) : null;
		}
		, removeExcept = function (id) {
			services.$rootScope.data_farm.list_exceptions = services.$rootScope.data_farm.list_exceptions.filter(f => f != id)
		}
		
		$scope.checked = false;
		
		$scope.toggleValue = function(checked){
			if(checked){
				addExcept($scope.reportData.defVillageId);
			} else {
				removeExcept($scope.reportData.defVillageId);
			}
		}
		
		$scope.$watch('reportData', function () {
			if(!$scope.reportData || !$scope.reportData.defVillageId) {return}
			if(services.$rootScope.data_farm.list_exceptions.find(f => f == $scope.reportData.defVillageId)){
				$scope.checked = true;
			} else {
				$scope.checked = false;
			}
		});

		return $scope;
	}
})
