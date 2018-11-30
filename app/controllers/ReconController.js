define("robotTW2/controllers/ReconController", [
	"robotTW2/services",
	"robotTW2/providers",
	"helper/time",
	], function(
			services,
			providers,
			helper
	){
	return function ReconController($rootScope, $scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		var self = this;

		$scope.recalcScrollbar();
		$scope.setCollapse();
		return $scope;
	}
})