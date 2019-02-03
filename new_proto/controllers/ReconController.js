define("robotTW2/controllers/ReconController", [
	"robotTW2/services",
	"robotTW2/providers",
	"helper/time",
	], function(
			services,
			providers,
			helper
	){
	return function ReconController($scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
		var self = this;
		
		$scope.getKey = function(unit_name){
			return services.$filter("i18n")(unit_name, services.$rootScope.loc.ale, "recon");
		}
		
		$scope.getClass = function(unit_name){
			return "icon-34x34-unit-" + unit_name;
		}

		$scope.recalcScrollbar();
		$scope.setCollapse();
		return $scope;
	}
})
