function $rootScope(){
	return injector.get('$rootScope');
}
function $timeout(){
	return injector.get('$timeout');
}
function httpService(){
	return injector.get('httpService');
}
function reportService(){
	var reportService = injector.get('reportService');
	this.extendScopeWithReportData = reportService.extendScopeWithReportData;
	reportService.extendScopeWithReportData = function ($scope, report) {
		$rootScope.$broadcast(eventTypeProvider.OPEN_REPORT);
		this.extendScopeWithReportData($scope, report)
	}
	return reportService;
}
function robot($rootScope, $timeout, httpService, i18n){
	var that = this;
	this.requestFile = function requestFile(fileName, onLoad, opt_onError) {
		var I18N_PATH_EXT = ['/lang/', '.json'];
		var uri	= I18N_PATH_EXT.join(fileName)
		, fileLoaded = function fileLoaded() {
			i18n.updateLocAle(true);
			if (onLoad) {
				onLoad();
			}
		}
		, onFileLoaded = function onFileLoaded() {
			$timeout(fileLoaded);
		};

		httpService.get(uri, function(jsont) {
			i18n.setJSON(jsont);
			onFileLoaded();
		}, function error(data, status, headers, config) {
			if (angular.isFunction(opt_onError)) {
				opt_onError(data, status, headers, config);
			}
		}, true);
	};
	this.init = function init(){
		var lded = false
		, tm = $timeout(function tm(){
			if(!lded){
				lded = true;
				$rootScope.$broadcast("ready_init")
			}
		}, 10000);

		that.requestFile($rootScope.loc.ale, function callback(){
			if(!lded){
				lded = true;
				$timeout.cancel(tm)
				$rootScope.$broadcast("ready_init")
			}
		}, function error(data, status, headers, config){});
	}
}

define("$rootScope", $rootScope);
define("$timeout", $timeout);
define("httpService", httpService);
define("reportService", reportService);

define("robot", ["$rootScope", "$timeout", "httpService", "helper/i18n"], function($rootScope, $timeout, httpService, i18n){
	return new robot($rootScope, $timeout, httpService, i18n)
});

require(["robot"], function(robot){
	robot.init()
})