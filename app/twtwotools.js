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
	} else {
		return
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
	, $templateCache 			= injector.get('$templateCache')
	, $compile 					= injector.get('$compile')
	, httpService 				= injector.get("httpService")
	, windowManagerService 		= injector.get("windowManagerService")
	, templateManagerService 	= injector.get("templateManagerService")
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
	},
	register = function(type, name, value){
		switch (type){
		case "services" : {
			if(!exports.services[name] || typeof(exports.services[name]) !== "function"){
				exports.services[name] = injector.get(name)
			}
			break
		}
		case "providers" : {
			if(!exports.providers[name] || typeof(exports.providers[name]) !== "object"){
				exports.providers[name] = injector.get(name)
			}
			angular.merge(exports.providers[name], value)
			break
		}
		}
	};

	exports.$rootScope 					= $rootScope;
	exports.$templateCache 				= $templateCache;
	exports.$compile 					= $compile;
	exports.httpService 				= httpService;
	exports.windowManagerService 		= windowManagerService;
	exports.templateManagerService 		= templateManagerService;

	(function ($rootScope){
		requestFile($rootScope.loc.ale);
	})($rootScope);

	return exports;
}))
, function(){
	require(["robotTW2"], function(robotTW2){
		robotTW2.register("services", "hotkeys");
		robotTW2.register("services", "modelDataService");
		robotTW2.register("services", "socketService");
		robotTW2.register("services", "premiumActionService");
		robotTW2.register("services", "villageService");
		robotTW2.register("services", "buildingService");
		robotTW2.register("services", "armyService");
		robotTW2.register("services", "$filter");

		robotTW2.register("providers", "routeProvider", {
			"INIT_DATA":{
				type:"init_data",
				data:["character_id"],
			}
		});

		robotTW2.register("providers", "eventTypeProvider", {
			"ISRUNNING_CHANGE"				: "Internal/robotTW2/isrunning_change",
			"RESUME_CHANGE_FARM"			: "Internal/robotTW2/resume_change_farm",
			"RESUME_CHANGE_RECRUIT"			: "Internal/robotTW2/resume_change_recruit",
			"INTERVAL_CHANGE_RECRUIT"		: "Internal/robotTW2/interval_change_recruit",
			"RESUME_CHANGE_HEADQUARTER"		: "Internal/robotTW2/resume_change_headquarter",
			"INTERVAL_CHANGE_HEADQUARTER"	: "Internal/robotTW2/interval_change_headquarter",
			"INTERVAL_CHANGE_DEPOSIT"		: "Internal/robotTW2/interval_change_deposit",
			"CHANGE_COMMANDS"				: "Internal/robotTW2/change_commands",
			"CHANGE_TIME_CORRECTION"		: "Internal/robotTW2/change_time_correction",
			"CMD_SENT"						: "Internal/robotTW2/cmd_sent",
			"SOCKET_EMIT_COMMAND"			: "Internal/robotTW2/secket_emit_command",
			"SOCKET_RECEPT_COMMAND"			: "Internal/robotTW2/socket_recept_command"
		});
	});

}.call(this)
