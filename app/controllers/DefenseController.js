define("robotTW2/controllers/DefenseController", [
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/conf",
	"helper/time",
	], function(
			services,
			providers,
			conf,
			helper
	){
	return function DefenseController($rootScope, $scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		var self = this;

		

		$scope.setCollapse();
		$scope.recalcScrollbar();
		return $scope;
	}
})