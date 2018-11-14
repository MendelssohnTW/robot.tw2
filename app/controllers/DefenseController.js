define("robotTW2/controllers/DefenseController", [
	"robotTW2"
	], function(
			robotTW2
	){
	return function DefenseController($rootScope, $scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		var self = this;

		return $scope;
	}
})