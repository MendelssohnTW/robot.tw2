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
						require([i], function(obj){
							addScript(url)
//							exports[type][name] = obj
							$rootScope.$broadcast("script_ready", {"type": type, "name": name, "obj": obj});
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
function robot($rootScope, $timeout, httpService, i18n, scripts, eventTypeProvider){
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
	, createScopeLang = function(module, obj, callback){
		var scope = {};
		var jsont = window.getTextObject(module);
		if(!jsont) {
			callback(scope)
			return
		}
		Object.keys(jsont).map(function(elem, index, array){
			if(typeof(jsont[elem]) == "string") {
				Object.keys(jsont).map(function(e, i, a){
					scope[e] = jsont[e];
				})
			}
		})
		callback(module, obj, scope)
		return
	}
	, switch_services = function switch_services(data){
		var type = data.type
		, name = data.name
		, obj = data.obj;
		switch (name) {
		case "":
			break;
		}
	}
	, switch_controllers = function switch_controllers(data){
		this.type = data.type
		this.name = data.name
		this.obj = data.obj;
		var that = this;

		function scopeLang(module, opt_obj, scope){
			var params = {
					controller		: that.obj,
					scopeLang 		: scope,
					hotkey 			: conf.HOTKEY[module.toUpperCase()],
					templateName 	: module.toLowerCase(),
					url		 		: "/" + type + "/" + name + ".js",
			}
			angular.extend(params, opt_obj);
			return build(params);
		}

		switch (name) {
		case "AlertController":
			createScopeLang("alert", {
				classes	: "", 
				style	: null
			}, scopeLang)
			break;
		case "AttackCompletionController": 
			createScopeLang("attack", {
				get_son					: function(){
					return $('[ng-controller=ModalCustomArmyController]').children("div").children(".box-paper").children(".scroll-wrap")						
				},
				provider_listener		: eventTypeProvider.PREMIUM_SHOP_OFFERS,
				included_controller		: "ModalCustomArmyController"
			}, scopeLang)
			break;
		case "AttackController": 
			createScopeLang("attack", {
				classes	: "fullsize", 
				style	: null
			}, scopeLang)
			break;
		case "DataController": 
			createScopeLang("data", {
				classes	: "", 
				style	: null
			}, scopeLang)
			break;
		case "DefenseController": 
			createScopeLang("defense", {
				classes	: "", 
				style	: null
			}, scopeLang)
			break;
		case "DepositController": 
			createScopeLang("deposit", {
				classes	: "fullsize", 
				style 	: {
					width:"350px"
				}
			}, scopeLang)
			break;
		case "FarmCompletionController": 
			createScopeLang("farm", {
				get_son					: function(){
					return $('[ng-controller=BattleReportController]').find(".tbl-result") && !$('[ng-controller=BattleReportController]').find("#checkboxFull").length ? $('[ng-controller=BattleReportController]').find(".tbl-result") : false						
				},
				provider_listener		: eventTypeProvider.OPEN_REPORT,
				included_controller		: "BattleReportController"
			}, scopeLang)
			break;
		case "FarmController": 
			createScopeLang("farm", {
				classes	: "", 
				style 	: {
					width:"950px"
				}
			}, scopeLang)
			break;
		case "HeadquarterController": 
			createScopeLang("headquarter", {
				classes	: "", 
				style	: null
			}, scopeLang)
			break;
		case "HeadquarterController": 
			createScopeLang("headquarter", {
				classes	: "fullsize", 
				style	: null
			}, scopeLang)
			break;
		case "MainController":
			createScopeLang("main", {
				classes		: "", 
				style 		: {
					width : "850px"
				}
			}, scopeLang)
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
		case "ReconController": 
			createScopeLang("recon", {
				classes: "fullsize", 
				style 	: {
					width:"350px"
				}
			}, scopeLang)
			break;
		case "RecruitController": 
			createScopeLang("recruit",  {
				classes	: "fullsize", 
				style	: null
			}, scopeLang)
			break;
		case "SecondVillageController": 
			createScopeLang("secondvillage",  {
				classes	: "", 
				style 	: {
					width:"350px"
				}
			}, scopeLang)
			break;
		case "SpyController": 
			createScopeLang("spy",  {
				classes	: "fullsize", 
				style	: null
			}, scopeLang)
			break;
		}
	}
	, switch_databases = function switch_databases(data){
		var type = data.type
		, name = data.name
		, obj = data.obj;
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
			, name = data.name
			, obj = data.obj;
			switch (type) {
			case "services":
				switch_services(data)
				break;
			case "controllers" :
				switch_controllers(data)
				break;
			case "databases" :
				switch_databases(data)
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

define("robot", ["$rootScope", "$timeout", "httpService", "helper/i18n", "scripts", "eventTypeProvider"], function($rootScope, $timeout, httpService, i18n, scripts, eventTypeProvider){
	return new robot($rootScope, $timeout, httpService, i18n, scripts, eventTypeProvider)
});

require(["robot"], function(robot){
	robot.init()
})