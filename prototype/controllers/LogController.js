define("robotTW2/controllers/LogController", [
	"robotTW2/services",
	"robotTW2/providers",
	"conf/conf",
	"robotTW2/databases/data_log",
	"robotTW2/databases/data_log_attack",
	"robotTW2/databases/data_log_defense",
	"robotTW2/databases/data_main"
], function (
	services,
	providers,
	conf_conf,
	data_log,
	data_log_attack,
	data_log_defense,
	data_main
) {
		return function LogController($scope) {
			$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
			$scope.CLEAR = services.$filter("i18n")("CLEAR", services.$rootScope.loc.ale);
			$scope.MENU = services.$filter("i18n")("MENU", services.$rootScope.loc.ale);
			$scope.version = services.$filter("i18n")("version", services.$rootScope.loc.ale);

			$scope.data_main = data_main;
			$scope.data_log = data_log;
			$scope.data_log_attack = data_log_attack;
			$scope.data_log_defense = data_log_defense;
			$scope.extensions = $scope.data_main.getExtensions()

			$scope.text_version = $scope.version + " " + data_log.version;

			var self = this
				, TABS = {};
			for (var name in $scope.extensions) {
				if ($scope.extensions[name].activated && !["LOG", "RECON", "ALERT", "FARM"].includes(name)) {
					TABS[name.toUpperCase()] = services.$filter("i18n")("title", services.$rootScope.loc.ale, name.toLowerCase())
				}
			}

			var TAB_ORDER = Object.keys(TABS).map(function (elem) {
				return TABS[elem]
			}).sort(function (a, b) { return a.localeCompare(b) })
				, setActiveTab = function setActiveTab(tab) {
					$scope.activeTab = tab;
					$scope.activeTabName = Object.keys(TABS).map(function (tb) {
						return TABS[tb] == tab ? tb.toLowerCase() : undefined
					}).filter(f => f != undefined)[0];
					$scope.requestedTab = null;
					$scope.recalcScrollbar();
				}
				, initTab = function initTab() {
					if (!$scope.activeTab) {
						setActiveTab($scope.requestedTab);
					}
				}

			$scope.userSetActiveTab = function (tab) {
				setActiveTab(tab);
			}

			$scope.menu = function () {
				services.$rootScope.$broadcast(providers.eventTypeProvider.OPEN_MAIN);
			}

			$scope.clear_log = function () {
				data_log[$scope.activeTabName] = []
				data_log.set()
			}

			$scope.requestedTab = TABS.ATTACK;
			$scope.TABS = TABS;
			$scope.TAB_ORDER = TAB_ORDER;

			initTab()

			$scope.setCollapse();
		}
	})