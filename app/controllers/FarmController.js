define("robotTW2/controllers/FarmController", [
	"robotTW2"
	], function(
			robotTW2
	){
	return function FarmController($rootScope, $scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		var self = this;

		return $scope;
	}
})