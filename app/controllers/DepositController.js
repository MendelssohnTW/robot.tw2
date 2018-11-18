define("robotTW2/controllers/DepositController", [
	"robotTW2",
	"robotTW2/services",
	"robotTW2/providers",
	"helper/time",
	], function(
			robotTW2,
			services,
			providers,
			helper
	){
	return function DepositController($rootScope, $scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		var self = this;
		
		return $scope;
	}
})