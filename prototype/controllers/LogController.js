define("robotTW2/controllers/LogController", [
	"robotTW2/services",
	"robotTW2/providers",
	"conf/conf",
	"robotTW2/databases/data_log"
	], function(
			services,
			providers,
			conf_conf,
			data_log
	){
	return function LogController($scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
		$scope.MENU = services.$filter("i18n")("MENU", services.$rootScope.loc.ale);
		$scope.version = services.$filter("i18n")("version", services.$rootScope.loc.ale);

		var self = this
		, TABS = {
				ATTACK 			: services.$filter("i18n")("title", services.$rootScope.loc.ale, "attack"),
				DEFENSE 		: services.$filter("i18n")("title", services.$rootScope.loc.ale, "defense"),
				DEPOSIT 		: services.$filter("i18n")("title", services.$rootScope.loc.ale, "deposit"),
				FARM 			: services.$filter("i18n")("title", services.$rootScope.loc.ale, "farm"),
				HEADQUARTER 	: services.$filter("i18n")("title", services.$rootScope.loc.ale, "headquarter"),
				RECRUIT 		: services.$filter("i18n")("title", services.$rootScope.loc.ale, "recruit"),
				SECONDVILLAGE	: services.$filter("i18n")("title", services.$rootScope.loc.ale, "secondvillage"),
				SPY				: services.$filter("i18n")("title", services.$rootScope.loc.ale, "spy"),
		}
		, TAB_ORDER = [
			TABS.ATTACK,
			TABS.DEFENSE,
			TABS.DEPOSIT,
			TABS.HEADQUARTER,
			TABS.RECRUIT,
			TABS.SECONDVILLAGE,
			TABS.SPY
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
		
		$scope.userSetActiveTab = function(tab){
			setActiveTab(tab);
		}
		
		$scope.requestedTab = TABS.ATTACK;
		$scope.TABS = TABS;
		$scope.TAB_ORDER = TAB_ORDER;
	}
})