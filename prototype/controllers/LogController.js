define("robotTW2/controllers/FarmController", [
	"helper/time",
	"robotTW2/time",
	"robotTW2/services",
	"robotTW2/providers",
	"conf/conf",
	"robotTW2/calculateTravelTime",
	"robotTW2/databases/data_villages",
	"robotTW2/databases/data_farm",
	"helper/format",
	"robotTW2/autocomplete"
	], function(
			helper,
			time,
			services,
			providers,
			conf_conf,
			calculateTravelTime,
			data_villages,
			data_farm,
			formatHelper,
			autocomplete
	){
	return function FarmController($scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
		$scope.START = services.$filter("i18n")("START", services.$rootScope.loc.ale);
		$scope.STOP = services.$filter("i18n")("STOP", services.$rootScope.loc.ale);
		$scope.MENU = services.$filter("i18n")("MENU", services.$rootScope.loc.ale);
		$scope.version = services.$filter("i18n")("version", services.$rootScope.loc.ale);

		var self = this
		, TABS = {
				FARM 	: services.$filter("i18n")("text_farm", services.$rootScope.loc.ale, "farm"),
				LOG		: services.$filter("i18n")("log", services.$rootScope.loc.ale, "farm")
		}
		, TAB_ORDER = [
			TABS.FARM,
			TABS.LOG,
			]
		, setActiveTab = function setActiveTab(tab) {
			$scope.activeTab	= tab;
			$scope.requestedTab	= null;
		}
		, initTab = function initTab() {
			if (!$scope.activeTab) {
				setActiveTab($scope.requestedTab);
			}
		}
		
		$scope.requestedTab = TABS.FARM;
		$scope.TABS = TABS;
		$scope.TAB_ORDER = TAB_ORDER;
	}
})