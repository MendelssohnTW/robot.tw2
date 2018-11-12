define("robotTW2/controllers/FarmCompletionController", [
	"robotTW2",
	"helper/time",
	], function(
			robotTW2,
			helper
	){
	return function FarmCompletionController($rootScope, $scope) {
		$scope.CLOSE = robotTW2.services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		
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
			if($rootScope.data_farm.list_exceptions.find(f => f == $scope.reportData.defVillageId)){
				$("#check-button").removeClass("icon-26x26-dot-red").addClass("icon-26x26-dot-green")
				$scope.checked = true;
			} else {
				$("#check-button").removeClass("icon-26x26-dot-green").addClass("icon-26x26-dot-red")
				$scope.checked = false;
			}
			$("#check-button").click(function () {
				if ($("#check-button").attr("class")[0] === 'icon-26x26-dot-green') {
					$(this).removeClass("icon-26x26-dot-green").addClass("icon-26x26-dot-red");
					removeExcept($scope.reportData.defVillageId);
				} else {
					$(this).removeClass("icon-26x26-dot-red").addClass("icon-26x26-dot-green");
					addExcept($scope.reportData.defVillageId);
				}
			});
		});

		return $scope;
	}
})