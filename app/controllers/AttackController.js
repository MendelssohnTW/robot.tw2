define("robotTW2/controllers/AttackController", [
	"robotTW2"
	], function(
			robotTW2
	){
	return function AttackController($rootScope, $scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		var self = this;

		return $scope;
	}
})