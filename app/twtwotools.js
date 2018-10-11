(function(root, factory) {
	if (typeof define === "function" && define.amd) { 
		define("robotTW2", [
			"battlecat",
			"conf/conf",
			"cdn",
			"conf/cdn",
			"helper/i18n",
			"queues/EventQueue"
			] , factory);
	} else if (typeof exports === "object") {
		factory(require("app"));
	} else {
		factory(app);
	}
}
)(this, (function(
		battlecat,
		conf,
		cdn,
		cdnConf,
		i18n,
		EventQueue
){
	var exports = {},
	$timeout,
	$rootScope,
	$templateCache,
	$compile;

	"use strict";

	var host = "https://mendelssohntw.github.io/robot.tw2/app";
	$rootScope 					= injector.get('$rootScope')
	, $filter 					= injector.get('$filter')
	, $templateCache 			= injector.get('$templateCache')
	, $compile 					= injector.get('$compile')
	, httpService 				= injector.get("httpService")
	, windowManagerService 		= injector.get("windowManagerService")
	, templateManagerService 	= injector.get("templateManagerService")
	, hotkeys 					= injector.get("hotkeys")
	, modelDataService 			= injector.get("modelDataService")
	, socketService 			= injector.get("socketService")
	, socketService 			= injector.get("socketService")
	, premiumActionService 		= injector.get("premiumActionService")
	, villageService 			= injector.get("villageService")
	, buildingService 			= injector.get("buildingService")
	, armyService 				= injector.get("armyService")
	, getPath = function getPath(origPath, opt_noHost) {
		if (opt_noHost) {
			return origPath;
		}
		return host + origPath;
	}
	, httpService.get = function get(uri, onLoad, onError, opt_host) {
		var onLoadWrapper = function onLoadWrapper(responseText) {
			onLoad(responseText);
			if (!$rootScope.$$phase) {
				$rootScope.$apply();
			}
		};
		if (opt_host && typeof(opt_host) == "boolean") {
//			uri = uri.substr(1);
			battlecat.get(getPath(uri), onLoadWrapper, true);
		} else {
			if (!cdnConf.versionMap[uri]){
				battlecat.get(getPath(uri), onLoadWrapper, true);
			} else {
				battlecat.get(cdn.getPath(uri), onLoadWrapper, cdnConf.ENABLED);
			}
		}
	}
	, templateManagerService.load = function(templateName, onSuccess, opt_onError) {
		var success = function success(data, status, headers, config) {
			$templateCache.put(path.substr(1), data);

			if (angular.isFunction(onSuccess)) {
				onSuccess(data, status, headers, config);
			}

			if (!$rootScope.$$phase) {
				$rootScope.$apply();
			}
		},
		error = function error(data, status, headers, config) {
			if (angular.isFunction(opt_onError)) {
				opt_onError(data, status, headers, config);
			}
		},
		path;

		if (0 !== templateName.indexOf('!')) {
			path = conf.TEMPLATE_PATH_EXT.join(templateName);
		} else {
			path = templateName.substr(1);
		}

		if ($templateCache.get(path.substr(1))) {
			success($templateCache.get(path.substr(1)), 304);
		} else {
			if (!cdnConf.versionMap[path]){
				httpService.get(path, success, error, true);
			} else {
				httpService.get(path, success, error);
			}
		}
	}
	, requestFile = function requestFile(fileName, onLoad, opt_onError) {
		var I18N_PATH_EXT = ['/lang/', '.json'];
		var uri	= I18N_PATH_EXT.join(fileName)
		, onFileLoaded = function onFileLoaded() {
			$timeout = $timeout || window.injector.get('$timeout');
			$timeout(function () {
				i18n.updateLocAle(true);
				if (onLoad) {
					onLoad();
				}
			});
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
	
	exports.$rootScope 					= $rootScope;
	exports.$templateCache 				= $templateCache;
	exports.$compile 					= $compile;
	exports.$filter 					= $filter;
	exports.httpService 				= httpService;
	exports.windowManagerService 		= windowManagerService;
	exports.templateManagerService 		= templateManagerService;
	exports.hotkeys 					= hotkeys;
	exports.modelDataService 			= modelDataService;
	exports.socketService 				= socketService;
	exports.socketService 				= socketService;
	exports.premiumActionService 		= premiumActionService;
	exports.villageService 				= villageService;
	exports.buildingService 			= buildingService;
	exports.armyService 				= armyService;

	(function ($rootScope){
		requestFile($rootScope.loc.ale);
	})($rootScope);

	return exports;
}))
, function(){
	require(["robotTW2"], function(robotTW2){
	
	});

}.call(this)
