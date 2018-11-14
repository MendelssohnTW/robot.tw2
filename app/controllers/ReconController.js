define("robotTW2/controllers/ReconController", [
	"robotTW2"
	], function(
			robotTW2
	){
	return function ReconController($rootScope, $scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		var self = this;

		return $scope;
	}
})