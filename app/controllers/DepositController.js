define("robotTW2/controllers/DepositController", [
	"robotTW2"
	], function(
			robotTW2
	){
	return function DepositController($rootScope, $scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		var self = this;

		return $scope;
	}
})