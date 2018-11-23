define("robotTW2/controllers/SpyController", [
	"robotTW2"
	], function(
			robotTW2
	){
	return function SpyController($rootScope, $scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		var self = this;

		return $scope;
	}
})