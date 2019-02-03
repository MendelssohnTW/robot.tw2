function ready(opt_callback, array_keys) {
	array_keys = array_keys || ["map"];
	var callback = function(key){
		array_keys = array_keys.filter(function(opt_key) {
			return opt_key !== key
		}),
		array_keys.length || opt_callback()
	};

	var obj_keys = {
			map: function() {
				var src = document.querySelector("#map");
				if (angular.element(src).scope().isInitialized)
					return callback("map");
				exports.services.$rootScope.$on(exports.providers.eventTypeProvider.MAP_INITIALIZED, function() {
					callback("map")
				})
			},
			tribe_relations: function() {
				var character = exports.services.modelDataService.getSelectedCharacter();
				if (character) {
					var tribe_relations = character.getTribeRelations();
					if (!character.getTribeId() || tribe_relations)
						return callback("tribe_relations")
				}
				var listener_tribe_relations = exports.services.$rootScope.$on(exports.providers.eventTypeProvider.TRIBE_RELATION_LIST, function() {
					listener_tribe_relations(),
					callback("tribe_relations")
				})
			},
			initial_village: function() {
				require(["conf/gameStates"], function(gameStates){
					if (exports.services.modelDataService.getGameState().getGameState(gameStates.INITIAL_VILLAGE_READY))
						return callback("initial_village");
					exports.services.$rootScope.$on(exports.providers.eventTypeProvider.GAME_STATE_INITIAL_VILLAGE_READY, function() {
						callback("initial_village")
					})
				})
			},
			all_villages_ready: function() {
				require(["conf/gameStates"], function(gameStates){
					if (exports.services.modelDataService.getGameState().getGameState(gameStates.ALL_VILLAGES_READY))
						return callback("all_villages_ready");
					exports.services.$rootScope.$on(exports.providers.eventTypeProvider.GAME_STATE_ALL_VILLAGES_READY, function() {
						callback("all_villages_ready")
					})
				})
			}
	};
	array_keys.forEach(function(key) {
		obj_keys[key]()
	})
}

function getScope(elem){
	var selector = angular.element(elem[0]);
	return selector.scope();
}

function loadController(controller){
	return window[controller] || getScope($('[ng-controller=' + controller + ']'));
}

function builderWindow($rootScope, httpService, windowManagerService, $templateCache, $compile, conf, scripts, hotkeys, loadController, requestFn, data_main) {
//	this.included_controller 	= params.included_controller;
//	this.controller 			= params.controller;
//	this.get_son	 			= params.get_son;
//	this.provider_listener 		= params.provider_listener;
//	this.scopeLang 				= params.scopeLang;
//	this.url	 				= params.url;
//	this.style 					= params.style;
//	this.hotkey 				= params.hotkey;
//	this.classes 				= params.classes;
//	this.templateName 			= params.templateName;
//	this.listener_layout 			= undefined;
//	params.hotkey ? this.addhotkey() : null;
//	params.provider_listener ? this.addlistener() : null;
//	return this

	var load = function load(templateName, onSuccess, opt_onError) {
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
			httpService.get(path, success, error);
		}
	}

	var win = function win(params){
		this.params = params;
		this.params.hotkey ? this.addhotkey() : null;
		this.params.provider_listener ? this.addlistener() : null;
	}

	win.prototype.addhotkey = function() {
		var fnThis = this.buildWin;
		var that = this;
		hotkeys.add(this.params.hotkey, function(){
			fnThis.apply(that, null)
		}, ["INPUT", "SELECT", "TEXTAREA"])
	}

	win.prototype.addlistener = function() {
		var fnThis = this.addWin;
		var that = this;
		this.params.listener_layout = $rootScope.$on(this.params.provider_listener, function(){
			if(scripts_loaded.some(f => f == that.params.url)){
				fnThis.apply(that, null)
			}
		})
	}

//	win.prototype.newWindow = function newWindow(params){
//	this.params = params;
//	this.params.hotkey ? this.addhotkey() : null;
//	this.params.provider_listener ? this.addlistener() : null;
//	}

	win.prototype.addWin = function addWin(){
		var that = this;

		new Promise(function(res, rej){
			var opt_onSucess = function opt_onSucess(data, status, headers, config){
				res(data)
			};

			var opt_onError = function opt_onError(data, status, headers, config){
				rej(data)
			};

			load(that.params.templateName, opt_onSucess, opt_onError)
		})
		.then(function(data){
			var scope = loadController(that.params.included_controller) || $rootScope.$new();
			that.params.scopeLang ? angular.extend(scope, that.params.scopeLang) : null;

			var filho = that.params.get_son();

			var templateHTML = angular.element(data)
			var compiledTemplate = $compile(templateHTML);

			compiledTemplate(scope, function(clonedElement, scope) {
				if(!filho){return}
				filho.append(clonedElement);
			});

			that.params.controller.apply(that.params.controller, [scope])

		}, function(data) {
			//console.log(reason); // Error!
		});
	}

	win.prototype.buildWin = function() {
		var scope = $rootScope.$new();
		var that = this;
		if(that.params.templateName != "main"){
			var arFn = requestFn.get(that.params.templateName.toLowerCase(), true);
			if(!arFn){return}
			if(data_main.pages_excludes.includes(that.params.templateName)){
				if(!arFn.fn.isInitialized()){return}
			} else{
				if(!arFn.fn.isInitialized() || !arFn.fn.isRunning()) {return}
			}
		}
		that.params.scopeLang ? angular.extend(scope, that.params.scopeLang) : null;
		new Promise(function(res){
			var opt_loadCallback = function(data){
				res(data)
			};

			var opt_destroyCallback = undefined;
			var opt_toggle = undefined;

			windowManagerService.getScreenWithInjectedScope(that.params.templateName, scope, opt_loadCallback, opt_destroyCallback, opt_toggle)
		})
		.then(function(data){
			var rootnode = data.rootnode;
			var tempName = that.params.templateName;
			var tempUpperCase = tempName.charAt(0).toUpperCase() + tempName.slice(1);

			if(that.params.style){
				Object.keys(that.params.style).forEach(function(key){
					$(rootnode, "section")[0].setAttribute("style", key + ":" + that.params.style[key] + ";");
					window.dispatchEvent(new Event('resize'));
				})
			}

			if(that.params.classes){
				if(typeof(that.params.classes) == "string"){
					that.params.classes = [that.params.classes]
				}
				var cls = that.params.classes.join(" ");
				$(rootnode).addClass(cls);
			}

			data.scope.$on('$destroy', function() {
				$("#map")[0].setAttribute("style", "left:0px;")
				window.dispatchEvent(new Event('resize'));
			});

			that.$window = rootnode;
			$(".win-main").removeClass("jssb-focus")
			$(".win-main").removeClass("jssb-applied")
			!that.$scrollbar ? that.$scrollbar = new jsScrollbar(document.querySelector(".win-main")) : null;
			that.recalcScrollbar = function() {
				if(!that.$scrollbar) return;
				if(!that.$scrollbar.recalc) return;
				that.$scrollbar.recalc()
			};
			that.disableScrollbar = function() {
				if(!that.$scrollbar) return;
				if(!that.$scrollbar.disable) return;
				that.$scrollbar.disable()
			};
			that.setCollapse = function() {
				that.$window.querySelectorAll(".twx-section.collapse").forEach(function(b) {
					var c = !b.classList.contains("hidden-content")
					, d = document.createElement("span");
					d.className = "min-max-btn";
					var e = document.createElement("a");
					e.className = "btn-orange icon-26x26-" + (c ? "minus" : "plus"),
					c || (b.nextSibling.style.display = "none"),
					d.appendChild(e),
					b.appendChild(d),
					d.addEventListener("click", function() {
						"none" === b.nextElementSibling.style.display ? (b.nextElementSibling.style.display = "",
								e.className = e.className.replace("plus", "minus"),
								c = !0) : (b.nextElementSibling.style.display = "none",
										e.className = e.className.replace("minus", "plus"),
										c = !1),
										that.recalcScrollbar()
					})
				})
			}
			angular.extend(data.scope, that)
			that.params.controller.apply(that.params.controller, [data.scope])
		});
	}

	return win
}

function build($rootScope, httpService, windowManagerService, $templateCache, $compile, conf, scripts, hotkeys, loadController, requestFn, data_main) {
	return new builderWindow($rootScope, httpService, windowManagerService, $templateCache, $compile, conf, scripts, hotkeys, loadController, requestFn, data_main)
}

function scripts($timeout, base) {
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

	var scripts_var = function scripts_var(){
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
		};
		this.scripts_loaded = scripts_loaded;
	}
	return new scripts_var();
}
function base($rootScope) {
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

}
function $compile(){
	return injector.get('$compile');
}
function $exceptionHandler(){
	return injector.get('$exceptionHandler');
}
function $filter(){
	return injector.get('$filter');
}
function $rootScope(){
	return injector.get('$rootScope');
}
function $templateCache(){
	return injector.get('$templateCache');
}
function $timeout(){
	return injector.get('$timeout');
}

function armyService(){
	return injector.get('armyService');
}
function buildingService(){
	return injector.get('buildingService');
}
function effectService(){
	return injector.get('effectService');
}
function eventTypeProvider(){
	var eventTypeProvider = injector.get('eventTypeProvider');
	angular.extend(eventTypeProvider, {
		"ISRUNNING_CHANGE"				: "Internal/robotTW2/isrunning_change",
		"RESUME_CHANGE_FARM"			: "Internal/robotTW2/resume_change_farm",
		"RESUME_CHANGE_RECRUIT"			: "Internal/robotTW2/resume_change_recruit",
		"INTERVAL_CHANGE_RECRUIT"		: "Internal/robotTW2/interval_change_recruit",
		"RESUME_CHANGE_HEADQUARTER"		: "Internal/robotTW2/resume_change_headquarter",
		"INTERVAL_CHANGE_HEADQUARTER"	: "Internal/robotTW2/interval_change_headquarter",
		"INTERVAL_CHANGE_DEPOSIT"		: "Internal/robotTW2/interval_change_deposit",
		"CHANGE_COMMANDS"				: "Internal/robotTW2/change_commands",
		"CHANGE_COMMANDS_DEFENSE"		: "Internal/robotTW2/change_commands_defense",
		"CHANGE_TIME_CORRECTION"		: "Internal/robotTW2/change_time_correction",
		"CMD_SENT"						: "Internal/robotTW2/cmd_sent",
		"SOCKET_EMIT_COMMAND"			: "Internal/robotTW2/secket_emit_command",
		"SOCKET_RECEPT_COMMAND"			: "Internal/robotTW2/socket_recept_command",
		"OPEN_REPORT"					: "Internal/robotTW2/open_report"
	})
	return eventTypeProvider;
}
function groupService(){
	return injector.get('groupService');
}
function hotkeys(){
	return injector.get('hotkeys');
}
function httpService(){
	return injector.get('httpService');
}
function overviewService(){
	return injector.get('overviewService');
}
function premiumActionService(){
	return injector.get('premiumActionService');
}
function presetListService(){
	return injector.get('presetListService');
}
function presetService(){
	return injector.get('presetService');
}
function recruitingService(){
	return injector.get('recruitingService');
}
function reportService(){
	return injector.get('reportService');
}
function resourceService(){
	return injector.get('resourceService');
}
function routeProvider(){
	var routeProvider = injector.get('routeProvider');
	angular.extend(routeProvider, {
		'UPDATE_WORLD':{
			type:"update_world",
			data:["world"],
		},
		'UPDATE_TRIBE':{
			type:"update_tribe",
			data:["tribe"],
		},
		'SEARCH_CHARACTER':{
			type:"search_character",
			data:["character_id"]
		},
		'SEARCH_CHARACTERS':{
			type:"search_characters",
			data:[""]
		},
		'UPDATE_CHARACTER':{
			type:"update_character",
			data:["character"]
		},
		'UPDATE_VILLAGE_CHARACTER':{
			type:"update_village_character",
			data:["village_character"]
		},
		'UPDATE_VILLAGE_LOST_CHARACTER':{
			type:"update_village_lost_character",
			data:["village_character"]
		},
		'SEARCH_VILLAGES_FOR_CHARACTER':{
			type:"search_villages_for_character",
			data:["id"]
		},
		'DELETE_CHARACTER':{
			type:"delete_member",
			data:["character_id"]
		},
		'SEARCH_WORLD':{
			type:"search_world",
			data:["world"]
		},
		'SEARCH_TRIBES_PERMITED':{
			type:"search_tribes_permited",
			data:[]
		},
		'UPDATE_VILLAGE':{
			type:"update_village",
			data:["village"]
		},
		'UPT_VILLAGE':{
			type:"upt_village",
			data:["village"]
		},
		'VERIFY_RESERVATION':{
			type:"verify_reservation",
			data:["verify_reservation"]
		},
		'SEARCH_LOCAL':{
			type:"search_local",
			data:[""]
		}
	})
	return routeProvider;
}
function secondVillageService(){
	return injector.get('secondVillageService');
}
function storageService(){
	return injector.get('storageService');
}
function villageService(){
	return injector.get('villageService');
}
function windowManagerService(){
	return injector.get('windowManagerService');
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
function robot($rootScope, $timeout, httpService, i18n, scripts, eventTypeProvider, requestFn, ready, build){
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
	, createScopeLang = function createScopeLang(module, obj, callback){
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
	, createBind = function createBind(obj){
		obj && typeof(obj.init) == "function" ? requestFn.bind(obj.name, obj) : null;
	}
	, switch_services = function switch_services(data){
		this.type = data.type
		this.name = data.name
		this.obj = data.obj;
		var that = this;

		if(this.name == "MainService"){
			this.obj && typeof(this.obj.initExtensions) == "function" 
				? this.obj.initExtensions() 
						: null;
		} else {
			createBind(this.obj)
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

		switch (this.name) {
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
		this.type = data.type
		this.name = data.name
		this.obj = data.obj;
		var that = this;

		var dat = {
				"data_attack" 		: "AttackService",
				"data_data" 		: "DataService",
				"data_defense" 		: "DefenseService",
				"data_deposit" 		: "DepositService",
				"data_farm" 		: "FarmService",
				"data_headquarter" 	: "HeadquarterService",
				"data_main" 		: "MainsService",
				"data_recon" 		: "ReconService",
				"data_recruit" 		: "RecruitService",
				"data_secondvillage": "SeconVillageService",
				"data_spy" 			: "SpyService"
		}

		if(this.name == "database"){
			ready(function(){
				$timeout(function(){
					scripts.load("/databases/data_villages.js")
					$timeout(function(){
						scripts.load("/databases/data_farm.js");
						scripts.load("/databases/data_deposit.js");
						scripts.load("/databases/data_spy.js");
						scripts.load("/databases/data_alert.js");
						scripts.load("/databases/data_attack.js");
						scripts.load("/databases/data_recon.js");
						scripts.load("/databases/data_defense.js");
						scripts.load("/databases/data_headquarter.js");
						scripts.load("/databases/data_recruit.js");
						scripts.load("/databases/data_secondvillage.js");
						scripts.load("/databases/data_data.js");
						scripts.load("/databases/data_log.js");

						$timeout(function(){
							scripts.load("/databases/data_main.js");
						}, 3000)
					}, 3000)
				}, 1000)

			},  ["all_villages_ready", "tribe_relations"])
		} else {
			scripts.load("/services/" + dat[name] + ".js");
		}
	}

	this.init = function init(){
		var lded = false
		, tm = $timeout(function tm(){
			if(!lded){
				lded = true;
				scripts.load("/databases/database.js")
			}
		}, 10000);

		requestFile($rootScope.loc.ale, function callback(){
			if(!lded){
				lded = true;
				$timeout.cancel(tm)
				scripts.load("/databases/database.js")
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

define("ready", ready)
define("$rootScope", $rootScope);
define("$timeout", $timeout);
define("$templateCache", $templateCache);
define("$compile", $compile);
define("hotkeys", hotkeys);
define("loadController", loadController);
define("scripts", ["$timeout", "base"], scripts)
define("base", ["$rootScope"], base)
define("windowManagerService", windowManagerService);
define("reportService", reportService);
define("$exceptionHandler", $exceptionHandler);
define("storageService", storageService);
define("buildingService", buildingService);
define("resourceService", resourceService);
define("recruitingService", recruitingService);
define("villageService", villageService);
define("eventTypeProvider", eventTypeProvider);
define("premiumActionService", premiumActionService);
define("secondVillageService", secondVillageService);
define("overviewService", overviewService);
define("$filter", $filter);
define("presetListService", presetListService);
define("presetService", presetService);
define("groupService", groupService);
define("effectService", effectService);
define("armyService", armyService);
define("routeProvider", routeProvider);
define("socketService", socketService);
define("httpService", ["battlecat", "cdn", "conf/cdn", "base"], httpService);
define("templateManagerService", ["$rootScope", "$templateCache", "conf/conf", "httpService"], templateManagerService);
define("build" ["$rootScope", "httpService", "windowManagerService", "$templateCache", "$compile", "conf/conf", "scripts", "hotkeys", "loadController", "requestFn", "robotTW2/databases/data_main"], build)

define("robot", ["$rootScope", "$timeout", "httpService", "helper/i18n", "scripts", "eventTypeProvider", "requestFn", "ready", "build"], function($rootScope, $timeout, httpService, i18n, scripts, eventTypeProvider, requestFn, ready, build){
	return new robot($rootScope, $timeout, httpService, i18n, scripts, eventTypeProvider, requestFn, ready, build)
});

require(["robot", "ready"], function(robot, ready){
	ready(function(){
		robot.init()
	}, ["all_villages_ready"])
})