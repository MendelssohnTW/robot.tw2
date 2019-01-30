define("robotTW2/controllers/FarmCompletionController", [
	"robotTW2/services",
	"helper/time",
	], function(
			services,
			helper
	){
	return function FarmCompletionController($rootScope, $scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		
		var self = this
		, addExcept = function (id) {
			!$rootScope.data_farm.list_exceptions.find(f => f == id) ? $rootScope.data_farm.list_exceptions.push(id) : null;
		}
		, removeExcept = function (id) {
			$rootScope.data_farm.list_exceptions = $rootScope.data_farm.list_exceptions.filter(f => f != id)
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
			if($rootScope.data_farm.list_exceptions.find(f => f == $scope.reportData.defVillageId)){
				$scope.checked = true;
			} else {
				$scope.checked = false;
			}
		});

		return $scope;
	}
})
