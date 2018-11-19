define("robotTW2/controllers/RecruitController", [
	"robotTW2"
	], function(
			robotTW2
	){
	return function RecruitController($rootScope, $scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		var self = this;

		return $scope;
	}
})