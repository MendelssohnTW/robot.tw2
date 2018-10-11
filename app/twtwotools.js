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
	$rootScope = $rootScope || window.injector.get('$rootScope')
	, $templateCache = $templateCache || window.injector.get('$templateCache')
	, $compile = $compile || window.injector.get('$compile')
	, httpService =  injector.get("httpService")
	, windowManagerService =  injector.get("windowManagerService")
	, templateManagerService =  injector.get("templateManagerService")
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
	}
	, init = function init(){
		requestFile($rootScope.loc.ale);
		windowManagerService.getScreen("farm")
	}

	exports.init = init;

	return exports;
}))
, function(){
	require(["robotTW2"], function(robotTW2){
		robotTW2.init();
	});

}.call(this)
