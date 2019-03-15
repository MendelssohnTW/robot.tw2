define("robotTW2/controllers/ReconController", [
	"robotTW2/services",
	"robotTW2/providers",
	"helper/time",
	"robotTW2/databases/data_recon"
	], function(
			services,
			providers,
			helper,
			data_recon
	){
	return function ReconController($scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
		$scope.MENU = services.$filter("i18n")("MENU", services.$rootScope.loc.ale);
		$scope.version = services.$filter("i18n")("version", services.$rootScope.loc.ale);
		var self = this;
		
		$scope.data_recon = data_recon
		$scope.text_version = $scope.version + " " + data_recon.version;
		
		$scope.getKey = function(unit_name){
			return services.$filter("i18n")(unit_name, services.$rootScope.loc.ale, "units");
		}
		
		$scope.getClass = function(unit_name){
			return "icon-34x34-unit-" + unit_name;
		}
		
		$scope.menu = function () {
			services.$rootScope.$broadcast(providers.eventTypeProvider.OPEN_MAIN);
		}
		
		$scope.$watch("data_recon", function(){
			if(!$scope.data_recon){return}
			data_recon = $scope.data_recon;
			data_recon.set();
		}, true)
		
		$scope.setCollapse();
		return $scope;
	}
})
