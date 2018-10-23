define("robotTW2/controllers/AlertController", [
	"robotTW2"
	], function(
			robotTW2
	){
	return function AlertController($rootScope, $scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		var self = this;

		return $scope;
	}
})