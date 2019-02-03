define("scripts", ["$timeout", "base"], function ($timeout, base) {
	var script_queue = []
	, scripts_loaded = []
	, scripts_removed = []
	, scripts_queue = []
	, promise = undefined
	, addScript = function(script){
		if(!scripts_loaded.find(f => f == script)){
			scripts_loaded.push(script)
		}
		scripts_removed = scripts_removed.filter(f => f != script)
	}
	, removeScript = function(script){
		if(!scripts_removed.find(f => f == script)){
			scripts_removed.push(script);
		}
		scripts_loaded = scripts_loaded.filter(f => f != script)
	}

	var scripts = function scripts(){
		this.load = function load(url){
			var t = undefined;
			if(!promise){
				promise = new Promise(function(res){
					t = $timeout(function(){
						res()
					}, 10000)
					var a = Math.round(Math.random() * 1e10)
					var b = document.createElement("script");
					b.type = "text/javascript";
					b.onload = function(data){
						$timeout.cancel(t);
						t = undefined;
						var c = data.target.src.split(base.URL_HOST)[1];
						c = c.substr(1);
						var d = c.split("/");
						var prefix = "robotTW2";
						d = d.reverse();
						var type = d[1];
						var name = d[0].split(".")[0];
						var h = [];
						h.push(prefix);
						h.push(type);
						h.push(name);	
						var i = h.join("/")
						require([i], function(type){
							addScript(url)
							exports[type][name] = type
							$rootScope.$broadcast("script_ready", {"type": type, "name": name});
//							if(f == "databases"){
//							$rootScope.$broadcast("script_ready", g);
//							} else {
//							$rootScope.$broadcast("script_ready", type);
//							}
							res()
						})

					}
					b.onerror = function(erro){
						console.log(erro)
						return
					}
//					b.src = base.URL_HOST + url + '?' + a;
					b.src = base.URL_HOST + url;

					if(!scripts_loaded.find(f => f == url)){
						if(!scripts_removed.find(f => f == url)){
							document.head.appendChild(b);	
						}
					}
				})
				.then(function(){
					promise = undefined
					if(scripts_queue.length){
						url = scripts_queue.shift()
						this.load(url)
						return !1;
					}
				})
			} else {
				scripts_queue.push(url)
			}
		};
		this.remove = function remove(script){
			removeScript(script)
		}
	}
	return new scripts();
})

define("base", function () {

	switch ($rootScope.loc.ale) {
//	case "pl_pl" : {
//	return {
//	URL_BASE			: "https://avebnt.nazwa.pl/endpointbandits/",
//	URL_SOCKET			: "wss://avebnt.nazwa.pl/endpointbandits/endpoint_server"
//	}
//	break
//	}
	default : {
		return {
			URL_BASE			: "https://www.ipatapp.com.br/endpoint/",
			URL_SOCKET			: "wss://www.ipatapp.com.br/endpoint/endpoint_server",
			URL_HOST			: "https://mendelssohntw.github.io/robot.tw2/prototype"
		}
		break
	}
	}

})


function $rootScope(){
	return injector.get('$rootScope');
}
function $timeout(){
	return injector.get('$timeout');
}
function $templateCache(){
	return injector.get('$templateCache');
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
function socketService(){
	var socketService = injector.get('socketService');
	this.createTimeoutErrorCaptureFunction = socketService.createTimeoutErrorCaptureFunction; 
	socketService.createTimeoutErrorCaptureFunction = function (route, data, emitCallback) {
		this.createTimeoutErrorCaptureFunction(route, data, emitCallback)
//		$exceptionHandler(new Error('RobotTW2 timeout: ' + route.type), null, {
//		'route': route.type
//		});
	}
}
function httpService(battlecat, cdn, cdnConf, base){
	function getPath(origPath, opt_noHost) {
		if (opt_noHost) {
			return origPath;
		}
		return base.URL_HOST + origPath;
	}
	var httpService = injector.get('httpService');
	this.get = httpService.get; 
	httpService.get = function (uri, onLoad, onError, opt_host) {
		var onLoadWrapper = function onLoadWrapper(responseText) {
			onLoad(responseText);
		};
		if (opt_host && typeof(opt_host) == "boolean") {
			battlecat.get(getPath(uri), onLoadWrapper, true);
		} else {
			if (!cdnConf.versionMap[uri]){
				battlecat.get(getPath(uri), onLoadWrapper, true);
			} else {
				battlecat.get(cdn.getPath(uri), onLoadWrapper, cdnConf.ENABLED);
			}
		}
	}
}
function templateManagerService($rootScope, $templateCache, conf, httpService){
	var templateManagerService = injector.get('templateManagerService');
	this.load = templateManagerService.load; 
	templateManagerService.load = function (templateName, onSuccess, opt_onError) {
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
}
function robot($rootScope, $timeout, httpService, i18n){
	var that = this
	, requestFile = function requestFile(fileName, onLoad, opt_onError) {
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
	}
	, switch_services = function switch_services(name){
		switch (name) {
		case "":
			break;
		}
	}
	, switch_controllers = function switch_controllers(name){
		switch (name) {
		case "MainController":
			scripts.load("/controllers/FarmController.js");
			scripts.load("/controllers/AttackController.js");
			scripts.load("/controllers/HeadquarterController.js");
			scripts.load("/controllers/DefenseController.js");
			scripts.load("/controllers/ReconController.js");
			scripts.load("/controllers/AlertController.js");
			scripts.load("/controllers/SpyController.js");
			scripts.load("/controllers/DepositController.js");
			scripts.load("/controllers/RecruitController.js");
			scripts.load("/controllers/SecondVillageController.js");
			scripts.load("/controllers/DataController.js");
			break;
		}
	}
	, switch_databases = function switch_databases(name){
		switch (name) {
		case "":
			break;
		}
	}
	
	this.init = function init(){
		var lded = false
		, tm = $timeout(function tm(){
			if(!lded){
				lded = true;
				$rootScope.$broadcast("ready_init")
			}
		}, 10000);

		requestFile($rootScope.loc.ale, function callback(){
			if(!lded){
				lded = true;
				$timeout.cancel(tm)
				$rootScope.$broadcast("ready_init")
			}
		}, function error(data, status, headers, config){});

		$rootScope.$on("ready", function($event, data){
			var type = data.type
			, name = data.name;
			switch (type) {
			case "services":
				switch_services(name)
				break;
			case "controllers" :
				switch_controllers(name)
				break;
			case "databases" :
				switch_databases(name)
				break;
			}
		})
	}
}

define("$rootScope", $rootScope);
define("$timeout", $timeout);
define("$templateCache", $templateCache);
define("httpService", httpService);
define("reportService", reportService);
define("socketService", socketService);
define("httpService", ["battlecat", "cdn", "conf/cdn", "base"], httpService);
define("templateManagerService", ["$rootScope", "$templateCache", "conf/conf", "httpService"], templateManagerService);

define("robot", ["$rootScope", "$timeout", "httpService", "helper/i18n"], function($rootScope, $timeout, httpService, i18n){
	return new robot($rootScope, $timeout, httpService, i18n)
});

require(["robot"], function(robot){
	robot.init()
})