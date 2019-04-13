define("robotTW2/controllers/LogController", [
	"robotTW2/services",
	"robotTW2/providers",
	"conf/conf",
	"robotTW2/databases/data_log",
	"robotTW2/databases/data_main"
	], function(
			services,
			providers,
			conf_conf,
			data_log,
			data_main
	){
	return function LogController($scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
		$scope.MENU = services.$filter("i18n")("MENU", services.$rootScope.loc.ale);
		$scope.version = services.$filter("i18n")("version", services.$rootScope.loc.ale);

		$scope.data_main = data_main;
		$scope.data_log = data_log;
		$scope.extensions = $scope.data_main.getExtensions()

		var self = this
		, TABS = {};
		for (var name in $scope.extensions) {
			if($scope.extensions[name].activated && !name.includes["LOG", "RECON", "ALERT"]){
				TABS[name.toUpperCase()] = services.$filter("i18n")("title", services.$rootScope.loc.ale, name.toLowerCase())
			}			
		}

		var TAB_ORDER = Object.keys(TABS).map(function(elem){
			return TABS[elem]
		}).sort(function(a,b){return a.localeCompare(b)})
		, setActiveTab = function setActiveTab(tab) {
			$scope.activeTab	= tab;
			$scope.requestedTab	= null;
		}
		, initTab = function initTab() {
			if (!$scope.activeTab) {
				setActiveTab($scope.requestedTab);
			}
		}

		$scope.userSetActiveTab = function(tab){
			setActiveTab(tab);
		}

		$scope.requestedTab = TABS.ATTACK;
		$scope.TABS = TABS;
		$scope.TAB_ORDER = TAB_ORDER;
	}
})