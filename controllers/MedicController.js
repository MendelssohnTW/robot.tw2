define("robotTW2/controllers/MedicController", [
	"robotTW2"
	], function(
			robotTW2
	){
	return function MedicController($rootScope, $scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		var self = this;

		return $scope;
	}
})