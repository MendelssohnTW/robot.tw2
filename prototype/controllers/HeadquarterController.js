define("robotTW2/controllers/HeadquarterController", [
	"robotTW2"
	], function(
			robotTW2
	){
	return function HeadquarterController($rootScope, $scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		var self = this;

		return $scope;
	}
})