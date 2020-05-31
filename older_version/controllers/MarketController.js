define("robotTW2/controllers/MarketController", [
	"robotTW2/services",
	"robotTW2/providers",
	"helper/time",
	"robotTW2/time",
	"robotTW2/databases/data_villages",
	"robotTW2/autocomplete",
	"robotTW2/notify",
	"helper/math",
	"conf/conf",
	"robotTW2/services/ProvinceService"
	], function(
			services,
			providers,
			helper,
			time,
			data_villages,
			autocomplete,
			notify,
			math,
			conf_conf,
			provinceService
	){
	return function MarketController($scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
		$scope.MENU = services.$filter("i18n")("MENU", services.$rootScope.loc.ale);
		$scope.CLEAR = services.$filter("i18n")("CLEAR", services.$rootScope.loc.ale);
		$scope.SELECT = services.$filter("i18n")("SELECT", services.$rootScope.loc.ale);
		$scope.SEARCH_MAP = services.$filter('i18n')('SEARCH_MAP', services.$rootScope.loc.ale);
		$scope.version = services.$filter("i18n")("version", services.$rootScope.loc.ale);

		var self = this
		
		$scope.isRunning = services.SpyService.isRunning();

		$scope.local_data_villages = services.VillService.getLocalVillages("market", "label");

		$scope.village_selected = $scope.local_data_villages[Object.keys($scope.local_data_villages)[0]]

		$scope.autoCompleteKey = function(event){
			let obj_autocomplete = {
					'type'					: 'village',
					'placeholder'			: $scope.SEARCH_MAP,
					'onEnter'				: updateEnter,
					'exclude'				: null,
					"inputValueReadOnly" 	: "",
					"keepSelected"			: false
			}

			let object_scope = {
					"element" 		: document.querySelector("#autocomplete_spy"),
					"id" 			: "autocomplete_spy",
					"autoComplete" 	: obj_autocomplete
			}
			autocomplete(object_scope, event, $scope.inputValueSpy);
		}

		$scope.$watch("data_logs.market", function(){
			$scope.recalcScrollbar();
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		}, true)

		$scope.$on("$destroy", function() {
			$scope.data_spy.set();
		});

		$scope.data_select = services.MainService.getSelects($scope.local_data_villages)

		$scope.setCollapse();

		return $scope;
	}
})

