var robotTW2 = window.robotTW2 = undefined;
(function(root, factory) {
	if (typeof define === "function" && define.amd) { 
		root.robotTW2 = define("robotTW2", [
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
	var exports = {}

	"use strict";

	var host = "https://mendelssohntw.github.io/robot.tw2/prototype";
	var $rootScope				= injector.get('$rootScope');
	var $templateCache 			= injector.get('$templateCache');
	var $exceptionHandler 		= injector.get('$exceptionHandler');
	var $timeout	 			= injector.get('$timeout');
	var $compile 				= injector.get('$compile');
	var httpService 			= injector.get("httpService");
	var windowManagerService 	= injector.get("windowManagerService");
	var modelDataService	 	= injector.get("modelDataService");
	var socketService		 	= injector.get("socketService");
	var templateManagerService 	= injector.get("templateManagerService");
	var reportService 			= injector.get("reportService");
	var eventTypeProvider		= injector.get("eventTypeProvider");
	var routeProvider 			= injector.get("routeProvider");
	var CONTENT_CLASS			= 'win-content';
	var BLOCKED_CLASS			= 'blocked';
	var scripts_loaded = [];
	var scripts_removed = [];
	var getPath = function getPath(origPath, opt_noHost) {
		if (opt_noHost) {
			return origPath;
		}
		return host + origPath;
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
	, requestFn = (function(){
		var fns = {}
		, service = {};
		return service.prefix = "robotTW2/" 
			, service.bind = function(key, fn, params) {
			fns.hasOwnProperty(this.prefix + key) || (fns[this.prefix + key] = []),
			fns[this.prefix + key].push({fn:fn, params:params || {}})
		}
		,
		service.trigger = function(key, params) {
			fns.hasOwnProperty(this.prefix + key) && fns[this.prefix + key].forEach(function(fs) {
				if(!params) {
					if(!Object.keys(fs.params).length) {
						fs.fn.apply(this, [])
					} else {
						fs.fn.apply(this, fs.params)
					}
				} else {
					if(!Object.keys(params).length) {
						if(!Object.keys(fs.params).length) {
							fs.fn.apply(this, [])
						} else {
							fs.fn.apply(this, fs.params)
						}
					} else {
						fs.fn.apply(this, params)
					}
				}
			})
		}
		,
		service.get = function(key, opt_prefix, index) {
			if(!key) return;
			!index ? index = 0 : index;
			return opt_prefix && fns[this.prefix + key] ? fns[this.prefix + key][index] : fns[key] ? fns[key][index] : null 
		}
		, service.unbind = function(key) {
			if(fns.hasOwnProperty(key)){
				delete fns[key];
			}
		}
		, service.getFns = function(){return fns}
		,
		service
	})()
	, commandQueue = (function (){
		var service = {};
		return service.bind = function(key, fn, opt_db, params) {
			if(!key) return;
			if(opt_db && typeof(opt_db.get) == "function"){
				if(!opt_db.commands){opt_db["commands"]= {}}
				!opt_db.commands[key] ? opt_db.commands[key] = params : null;
				$rootScope.$broadcast(exports.providers.eventTypeProvider.CHANGE_COMMANDS)
			}
			requestFn.bind(key, fn, params)
		}
		,
		service.trigger = function(key, params) {
			if(!key) return;
			if(!params){
				requestFn.trigger(key);
			} else {
				requestFn.trigger(key, [params]);	
			}
		}
		,
		service.unbind = function(key, opt_db) {
			if(!key) return;
			if(opt_db && typeof(opt_db.get) == "function"){
				exports.services.$timeout.cancel(requestFn.get(key));
				delete opt_db.commands[key];
				$rootScope.$broadcast(exports.providers.eventTypeProvider.CHANGE_COMMANDS)
			}
			requestFn.unbind(key);
		}
		,
		service.unbindAll = function(opt_db) {
			if(!opt_db) return
			Object.keys(opt_db.commands).forEach(function(key) {
				try {
					exports.services.$timeout.cancel(requestFn.get(key));
				} catch(err){

				}
			})
			opt_db.commands = {}
			$rootScope.$broadcast(exports.providers.eventTypeProvider.CHANGE_COMMANDS)
		}
		,
		service
	})()
	, getScope = function(elem){
		var selector = angular.element(elem[0]);
		return selector.scope();
	}
	, loadController = function(controller){
		return window[controller] || getScope($('[ng-controller=' + controller + ']'));
	}
	, createScopeLang = function(module, callback){
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
		callback(scope)
		return
	}
	, register = function(type, name, value){
		switch (type){
		case "services" : {
			if(!exports.services[name] || typeof(exports.services[name]) !== "function"){
				exports.services[name] = injector.get(name)
			}
			return exports.services[name];
			break
		}
		case "controllers" : {
			if(!exports.controllers[name] || typeof(exports.controllers[name]) !== "function"){
				exports.controllers[name] = value
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
	}
	, script_queue = []
	, promise = undefined
	, loadScript = function(url){
		if(!promise){
			promise = new Promise(function(res){
				var a = Math.round(Math.random() * 1e10)
				var b = document.createElement("script");
				b.type = "text/javascript";
				b.onload = function(data){
					var c = data.target.src.split(host)[1];
					c = c.substr(1);
					var d = c.split("/");
					var e = "robotTW2";
					d = d.reverse();
					var f = d[1];
					var g = d[0].split(".")[0];
					var h = [];
					h.push(e);
					h.push(f);
					h.push(g);	
					var i = h.join("/")
					require([i], function(type){
						addScript(url)
						exports[f][g] = type
						if(f == "databases"){
							$rootScope.$broadcast("ready", g);
						} else {
							$rootScope.$broadcast("ready", type);
						}
					})
					res()
				};
//				b.src = host + url + '?' + a;
				b.src = host + url;

				if(!scripts_loaded.some(f => f == url)){
					if(!scripts_removed.some(f => f == url)){
						document.head.appendChild(b);	
					} else {
						addScript(url);
					}
				}
			})
			.then(function(){
				promise = undefined
				if(script_queue.length){
					url = script_queue.shift()
					loadScript(url)
					return !1;
				}
			})
		} else {
			script_queue.push(url)
		}
	}
	, addScript = function(script){
		scripts_loaded.push(script)
		scripts_removed = scripts_removed.filter(f => f != script)
	}
	, removeScript = function(script){
		if(scripts_loaded.some(f => f == script)){
			scripts_loaded = scripts_loaded.filter(f => f != script)
			scripts_removed.push(script);
		}
	}
	, ready = function(opt_callback, array_keys){
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
	, id = 0
	, build = function(params){
		return new builderWindow(params)
	}
	, builderWindow = function (params){
		this.included_controller 	= params.included_controller;
		this.controller 			= params.controller;
		this.get_son	 			= params.get_son;
		this.provider_listener 		= params.provider_listener;
		this.scopeLang 				= params.scopeLang;
		this.url	 				= params.url;
		this.style 					= params.style;
		this.hotkey 				= params.hotkey;
		this.classes 				= params.classes;
		this.templateName 			= params.templateName;
		this.listener_layout 			= undefined;
		params.hotkey ? this.addhotkey() : null;
		params.provider_listener ? this.addlistener() : null;
		return this
	}
	, load = function(templateName, onSuccess, opt_onError) {
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

	builderWindow.prototype.addWin = function() {
		var self = this;
//		!self.listener_include ? self.listener_include = $rootScope.$on("$includeContentLoaded", function(event, screenTemplateName, data){
//		if(!templateName){return}
//		screenTemplateName.indexOf(templateName) ? self.openned = !0 : self.openned = !1;
//		}): null;

		new Promise(function(res, rej){
			var opt_onSucess = function(data, status, headers, config){
				res(data)
			};

			var opt_onError = function(data, status, headers, config){
				rej(data)
			};

			load(self.templateName, opt_onSucess, opt_onError)
		})
		.then(function(data){
			var scope = exports.loadController(self.included_controller) || $rootScope.$new();
			self.scopeLang ? angular.extend(scope, self.scopeLang) : null;

			var filho = self.get_son();

			var templateHTML = angular.element(data)
			var compiledTemplate = $compile(templateHTML);

			compiledTemplate(scope, function(clonedElement, scope) {
				if(!filho){return}
				filho.append(clonedElement);
			});

			self.controller.apply(self.controller, [$rootScope, scope])

		}, function(data) {
			//console.log(reason); // Error!
		});

	}
	,
	builderWindow.prototype.buildWin = function() {
		var scope = $rootScope.$new();
		var self = this;
		if(self.templateName != "main"){
			var arFn = exports.requestFn.get(self.templateName.toLowerCase(), true);
			if(!arFn){return}
			if(["farm", "recruit"].includes(self.templateName)){
				if(!arFn.fn.isInitialized()){return}
			} else{
				if(!arFn.fn.isInitialized() || !arFn.fn.isRunning()) {return}
			}
		}
		self.scopeLang ? angular.extend(scope, self.scopeLang) : null;
//		!self.listener ? self.listener = scope.$on("$includeContentLoaded", function(event, screenTemplateName, data){
//		screenTemplateName.indexOf(templateName) ? self.openned = !0 : self.openned = !1;
//		self.recalcScrollbar()
//		self.setCollapse()
//		}): null;
		new Promise(function(res, rej){
			var opt_loadCallback = function(data){
				res(data)
			};

			var opt_destroyCallback = undefined;
			var opt_toggle = undefined;

			exports.services.windowManagerService.getScreenWithInjectedScope(self.templateName, scope, opt_loadCallback, opt_destroyCallback, opt_toggle)
		})
		.then(function(data){
			var rootnode = data.rootnode;
			var tempName = self.templateName;
			var tempUpperCase = tempName.charAt(0).toUpperCase() + tempName.slice(1);

			if(self.style){
				Object.keys(self.style).forEach(function(key){
					$(rootnode, "section")[0].setAttribute("style", key + ":" + self.style[key] + ";");	
				})
			}

			if(self.classes){
				if(typeof(self.classes) == "string"){
					self.classes = [self.classes]
				}
				var cls = self.classes.join(" ");
				$(rootnode).addClass(cls);
			}

			self.$window = rootnode;
			$(".win-main").removeClass("jssb-focus")
			$(".win-main").removeClass("jssb-applied")
			!self.$scrollbar ? self.$scrollbar = new jsScrollbar(document.querySelector(".win-main")) : null;
			self.recalcScrollbar = function() {
				self.$scrollbar.recalc()
			};
			self.setCollapse = function() {
				self.$window.querySelectorAll(".twx-section.collapse").forEach(function(b) {
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
										self.recalcScrollbar()
					})
				})
//				if(a.templateName == "farm"){
//				$(".win-foot .btn-orange").forEach(function(d){
//				d.setAttribute("style", "min-width:80px")
//				})
//				}
			}

//			if(self.openned){
//			data.scope.recalcScrollbar()
//			data.scope.setCollapse()
//			}

			angular.extend(data.scope, self)

			self.controller.apply(self.controller, [$rootScope, data.scope])

		}, function(reason) {
			//console.log(reason); // Error!
		});

	}
	,
	builderWindow.prototype.addhotkey = function() {
		var fnThis = this.buildWin;
		var self = this;
		exports.services.hotkeys.add(this.hotkey, function(){
			//fnThis.call(getTemp())
			fnThis.apply(self, null)
		}, ["INPUT", "SELECT", "TEXTAREA"])
	}
	, builderWindow.prototype.addlistener = function() {
		var fnThis = this.addWin;
		var self = this;
		this.listener_layout = exports.services.$rootScope.$on(this.provider_listener, function(){
			if(scripts_loaded.some(f => f == self.url)){
				fnThis.apply(self, null)
			}
		})
	}
	, my_createTimeoutErrorCaptureFunction = socketService.createTimeoutErrorCaptureFunction; 

	socketService.createTimeoutErrorCaptureFunction = function (route, data, emitCallback) {
		my_createTimeoutErrorCaptureFunction(route, data, emitCallback)
		$exceptionHandler(new Error('RobotTW2 timeout: ' + route.type), null, {
			'route': route.type
		});
	}

	httpService.get = function get(uri, onLoad, onError, opt_host) {
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

	templateManagerService.load = function(templateName, onSuccess, opt_onError) {
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

	exports.services 		= {
			$rootScope 					: $rootScope,
			$templateCache 				: $templateCache,
			$exceptionHandler			: $exceptionHandler,
			$timeout 					: $timeout,
			$compile 					: $compile,
			httpService 				: httpService,
			windowManagerService 		: windowManagerService,
			modelDataService			: modelDataService,
			socketService				: socketService,
			templateManagerService 		: templateManagerService,
			reportService 				: reportService
	};

	exports.providers 			= {
			eventTypeProvider 			: eventTypeProvider,
			routeProvider				: routeProvider
	};
	exports.controllers			= {};
	exports.databases			= {};

	exports.ready				= ready;
	exports.register			= register;
	exports.host				= host;
	exports.build				= build;
	exports.loadScript			= loadScript;
	exports.addScript			= addScript;
	exports.removeScript		= removeScript;
	exports.loadController		= loadController;
	exports.createScopeLang 	= createScopeLang;
	exports.requestFn 			= requestFn;
	exports.commandQueue 		= commandQueue;

	(function ($rootScope){
		var lded = false;
		var tm = $timeout(function(){
			if(!lded){
				lded = true;
				$rootScope.$broadcast("ready_init")
			}
		}, 15000)
		requestFile($rootScope.loc.ale, function(){
			if(!lded){
				lded = true;
				$timeout.cancel(tm)
				$rootScope.$broadcast("ready_init")
			}
		});
	})($rootScope);

	return exports;
}))
, function(){
	require(["robotTW2"], function(robotTW2){

		define("robotTW2/conf", [
			"conf/buildingTypes"
			], function(
					buildingTypes
			) {

			var levelsBuilding = [];
			for (var type in buildingTypes){
				if(buildingTypes.hasOwnProperty(type) && [buildingTypes[type]] != "fortress"){
					levelsBuilding.push({[buildingTypes[type]] : 0})
				}
			}
			var orderbuilding = [
				{"academy": 1}, //Academia
				{"headquarter": 2}, //Principal
				{"farm": 3}, //Fazenda
				{"warehouse": 4}, //Armazém
				{"barracks": 5}, //Quartel
				{"rally_point": 6}, //Ponto de encontro
				{"timber_camp": 7}, //Bosque
				{"iron_mine": 8}, //Mina de Ferro
				{"clay_pit": 9}, //Poço de Argila
				{"wall": 10}, //Muralha
				{"statue": 11}, //Estátua
				{"tavern": 12}, //Taverna
				{"market": 13}, //Mercado
				{"hospital": 14}, //Hospital
				{"preceptory": 15}, //Salão das ordens
				{"church": 16}, //Igreja
				{"chapel": 17} //Caplea
				]

			var limitBuilding = [
				{"headquarter": 20},
				{"barracks": 15},
				{"tavern": 13},
				{"hospital": 5},  
				{"preceptory": 0},  
				{"church": 0},
				{"chapel": 0},
				{"academy": 1},  
				{"rally_point": 5},  
				{"statue": 5},
				{"market": 15},
				{"timber_camp": 23},  
				{"clay_pit": 23},
				{"iron_mine": 25},  
				{"farm": 30},
				{"warehouse": 25},  
				{"wall": 18}
				]

			var seg = 1000 // 1000 milisegundos
			, min = seg * 60
			, h = min * 60

			var conf = {
					h						: h,
					min						: min,
					seg						: seg,
					EXECUTEBUILDINGORDER 	: true,
					BUILDINGORDER			: orderbuilding,
					BUILDINGLIMIT			: limitBuilding,
					BUILDINGLEVELS			: levelsBuilding,
					MAX_COMMANDS_FARM		: 42,
					MIN_POINTS_FARM			: 0,
					MAX_POINTS_FARM			: 12000,
					MAP_CHUNCK_LEN 			: 30 / 2,
					TIME_CORRECTION_COMMAND : -225,
					TIME_DELAY_UPDATE		: 30 * seg,
					TIME_DELAY_FARM			: 1500,
					TIME_SNIPER_ANT 		: 30000,
					TIME_SNIPER_POST 		: 3000,
					MAX_TIME_CORRECTION 	: 3 * seg,
					MIN_TIME_SNIPER_ANT 	: 5,
					MAX_TIME_SNIPER_ANT 	: 600,
					MIN_TIME_SNIPER_POST 	: 0.3,
					MAX_TIME_SNIPER_POST 	: 600,
					MAX_JOURNEY_DISTANCE 	: 15,
					MIN_JOURNEY_DISTANCE 	: 5,
					MAX_JOURNEY_TIME     	: h,
					MIN_JOURNEY_TIME     	: 2 * min,
					VERSION					: {
						MAIN			: 2.3,
						VILLAGES		: 2.3,
						HEADQUARTER		: 2.3,
						ALERT			: 2.3,
						RECON			: 2.3,
						SPY				: 2.3,
						ATTACK			: 2.3,
						DEFENSE			: 2.3,
						FARM			: 2.3,
						RECRUIT			: 2.3,
						DEPOSIT			: 2.3,
						MEDIC			: 2.3,
						SECONDVILLAGE	: 2.3
					},
					FARM_TIME		      	: h,
					MIN_INTERVAL	     	: 5 * min,
					INTERVAL				: {
						HEADQUARTER	: h,
						RECRUIT		: h,
//						DEPOSIT		: 15 * min,
						ALERT		: 5 * min,
						ATTACK		: h,
						MEDIC		: h,
						SPY			: 30 * min,
					},
					DBS : [
						"alert",
						"attack",
						"defense",
						"deposit",
						"farm",
						"headquarter",
						"medic",
						"recon",
						"recruit",
						"spy",
						"secondvillage"
						]
					,
					HOTKEY					: {
						ALERT		 	: "ctrl+alt+l",
						ATTACK		 	: "ctrl+alt+a",
						DEFENSE		 	: "ctrl+alt+d",
						DEPOSIT		 	: "ctrl+alt+t",
						FARM		 	: "ctrl+alt+f",
						HEADQUARTER 	: "ctrl+alt+h",
						MAIN 			: "ctrl+alt+p",
						MEDIC		 	: "ctrl+alt+m",
						RECON		 	: "ctrl+alt+r",
						RECRUIT		 	: "ctrl+alt+e",
						SPY			 	: "ctrl+alt+s",
						SECONDVILLAGE	: "ctrl+alt+w"
					},
					RESERVA				: {
						RECRUIT : {
							FOOD			: 500,
							WOOD			: 2000,
							CLAY			: 2000,
							IRON			: 2000,
							SLOTS			: 2
						},
						HEADQUARTER : {
							FOOD			: 500,
							WOOD			: 2000,
							CLAY			: 2000,
							IRON			: 2000,
							SLOTS			: 2
						}

					},
					TROOPS_NOT				: ["knight", "snob", "doppelsoldner", "trebuchet"]

			}
			return conf;
		})
		angular.extend(robotTW2.services, define("robotTW2/services", [], function(){
			robotTW2.register("services", "hotkeys");
			robotTW2.register("services", "premiumActionService");
			robotTW2.register("services", "secondVillageService");
			robotTW2.register("services", "villageService");
			robotTW2.register("services", "buildingService");
			robotTW2.register("services", "armyService");
			robotTW2.register("services", "overviewService");
			robotTW2.register("services", "$filter");
			robotTW2.register("services", "storageService");
			robotTW2.register("services", "presetListService");
			robotTW2.register("services", "presetService");
			robotTW2.register("services", "groupService");

			return robotTW2.services;
		}))
		angular.extend(robotTW2.databases, define("robotTW2/databases", [], function(){
			robotTW2.loadScript("/databases/database.js");
			return robotTW2.databases;
		}))
		angular.extend(robotTW2.providers, define("robotTW2/providers", [], function(){
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
				"SOCKET_RECEPT_COMMAND"			: "Internal/robotTW2/socket_recept_command",
				"OPEN_REPORT"					: "Internal/robotTW2/open_report"
			});
			return robotTW2.providers;
		}))

		var $rootScope = robotTW2.services.$rootScope;

		var new_extendScopeWithReportData = robotTW2.services.reportService.extendScopeWithReportData; 

		robotTW2.services.reportService.extendScopeWithReportData = function ($scope, report) {
			$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.OPEN_REPORT);
			new_extendScopeWithReportData($scope, report)
		}

		define("robotTW2/zerofill", function(){
			return function (n, opt_len) {
				opt_len = opt_len || 2;
				n = n.toString();
				while (n.length < opt_len) {
					n = '0' + n;
				}
				return n;
			}
		})
		,
		define("robotTW2/convert_readable_for_ms", function(){
			return function(data){
				var array = data.split(":");
				var hora = array[0];
				var minutos = array[1];
				var segundos = array[2];
				return (parseInt(hora) * 60 * 60 + parseInt(minutos) * 60 + parseInt(segundos)) * 1000;
			}
		})
		,
		define("robotTW2/readableSeconds", [
			"robotTW2/zerofill"
			], function(
					zerofill
			){
			return function(seconds, opt){
				var days, hours, minutes, m = 60, timeString, h = m * m, d = 24 * h, prefix = "";
				seconds = Math.abs(seconds);

				days = seconds / d;
				if (days > 1 && opt) {
					days |= 0;
					seconds = seconds - days * d;
				} else {
					days = null;
				}

				hours = (seconds / h) | 0;
				minutes = ((seconds - (hours * h)) / m) | 0;
				seconds = (seconds % m) | 0;

				if (days) {
					prefix = days.toString(10) + ':';
				}

				return prefix + hours + ':' + zerofill(minutes) + ':' + zerofill(seconds);
			}
		})
		,
		define("robotTW2/readableMilliseconds", [
			"robotTW2/zerofill"
			], function(
					zerofill
			){
			return function(ms, opt){
				var days, hours, minutes, m = 60, timeString, h = m * m, d = 24 * h, prefix = "";
				seconds = Math.abs(ms / 1000);

				days = seconds / d;
				if (days > 1 && opt) {
					days |= 0;
					seconds = seconds - days * d;
				} else {
					days = null;
				}

				hours = (seconds / h) | 0;
				minutes = ((seconds - (hours * h)) / m) | 0;
				seconds = (seconds % m) | 0;

				if (days) {
					prefix = days.toString(10) + ':';
				}

				return prefix + hours + ':' + zerofill(minutes) + ':' + zerofill(seconds);
			}
		})
		,
		define("robotTW2/unreadableMilliseconds", [
			], function(
			){
			return function return_Miliseconds(tempo){
				var days, hours, minutes, s = 1000, m = 60, timeString, h = m * m , d = 24 * h;
				if (tempo != undefined && tempo != 0){
					if (tempo.length <= 5){
						tempo = tempo + ":00"; 
					}
					var ar_tempo = tempo.split(":").reverse();
					var days = parseInt(ar_tempo[3]) || 0;
					var hours = parseInt(ar_tempo[2]) || 0;
					var minutes = parseInt(ar_tempo[1]) || 0;
					var seconds = parseInt(ar_tempo[0]) || 0;
					return ((days * d + hours * h + minutes * m  + seconds) * s);
				} else {
					return 0;
				}
			}
		})
		,
		define("robotTW2/unitTypesRenameRecon", [], function() {
			var l = {}
			robotTW2.services.modelDataService.getGameData().data.units.map(function(obj, index, array){
				if(obj.name != "knight"){
					{l[obj.name] = true}
				}
			});
			return l
		})
		,
		define("robotTW2/time", ["helper/time"], function(helper) {
			return function(){
				var date = new Date(helper.gameTime())
				date.setMinutes(date.getMinutes() + date.getTimezoneOffset())
				return date.getTime() + helper.getGameTimeOffset();
			}
		})
		,
		define("robotTW2/notify", [
			'helper/firework'
			], function(
					firework
			) {
			return function(message, opt){
				var $scope = robotTW2.loadController("NotificationController")
				, promise
				, that = this
				, queue = []
				, fireworkSystem = new firework.FireworkSystem(32, 'notificationCanvas')
				, display = function display(message) {

					var duration = 8e3;
					if (!message) {
						return;
					}

					if (promise) {
						queue.push(arguments);
						return;
					}

					$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.NOTIFICATION_SHOW);

					$scope.content			= message;
					$scope.type				= "achievement";
					$scope.title			= robotTW2.services.$filter('i18n')('title', $rootScope.loc.ale, 'notify');
					$scope.notificationId	= null;
					$scope.icon				= "icon-90x90-achievement-loot";
					$scope.offer			= null;
					$scope.visible			= "visible";
					$scope.action			= null;
					$scope.cancel			= null;
					$scope.onHide			= null;
					$scope.wideModal		= true;

					fireworkSystem.play();

					if (!$rootScope.$$phase) {
						$scope.$digest();
					}

					(promise = robotTW2.services.$timeout(function timeoutCallback() {
						$scope.visible = null;
						$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.NOTIFICATION_HIDE);

						if ($scope.onHide) {
							$scope.onHide();
							$scope.onHide = null;
						}
					}, duration)).then(function() {
						promise = null;
						fireworkSystem.stop();
						display.apply(that, queue.pop());
					});
				}

				if(opt){
					return display(message);
				} else {
					return display(robotTW2.services.$filter("i18n")(message, $rootScope.loc.ale, "notify"));	
				}

			}
		})

		$rootScope.$on("ready_init", function($event){
			robotTW2.ready(function(){
				require(["robotTW2/services"]);
				require(["robotTW2/databases"]);
				require(["robotTW2/controllers"]);

				angular.extend(robotTW2.controllers, define("robotTW2/controllers", [], function(){
					robotTW2.loadScript("/controllers/MainController.js");
					return robotTW2.controllers;
				}))	
			}, ["all_villages_ready"])
		})

		$rootScope.$on("ready", function($event, type){
			require(["robotTW2/conf"], function(conf){
				switch (type) {
				case robotTW2.controllers.MainController : {
					robotTW2.loadScript("/controllers/FarmController.js");
					robotTW2.loadScript("/controllers/AttackController.js");
					robotTW2.loadScript("/controllers/HeadquarterController.js");
					robotTW2.loadScript("/controllers/DefenseController.js");
					robotTW2.loadScript("/controllers/ReconController.js");
					robotTW2.loadScript("/controllers/AlertController.js");
					robotTW2.loadScript("/controllers/SpyController.js");
					robotTW2.loadScript("/controllers/DepositController.js");
					robotTW2.loadScript("/controllers/RecruitController.js");
					robotTW2.loadScript("/controllers/SecondVillageController.js");
//					robotTW2.loadScript("/controllers/MedicController.js");
					break
				}
				case robotTW2.controllers.AlertController : {
					robotTW2.createScopeLang("alert", function(scopeLang){
						var params = {
								controller		: robotTW2.controllers.AlertController,
								scopeLang 		: scopeLang,
								hotkey 			: conf.HOTKEY.ALERT,
								templateName 	: "alert",
								classes 		: "",
								url		 		: "/controllers/AlertController.js",
								style 			: null
						}		
						robotTW2.build(params)
					})
				}
				case robotTW2.controllers.RecruitController : {
					robotTW2.createScopeLang("recruit", function(scopeLang){
						var params = {
								controller		: robotTW2.controllers.RecruitController,
								scopeLang 		: scopeLang,
								hotkey 			: conf.HOTKEY.RECRUIT,
								templateName 	: "recruit",
								classes 		: "fullsize",
								url		 		: "/controllers/RecruitController.js",
								style 			: null
						}		
						robotTW2.build(params)
					})
				}
				case robotTW2.controllers.HeadquarterController : {
					robotTW2.createScopeLang("headquarter", function(scopeLang){
						var params = {
								controller		: robotTW2.controllers.HeadquarterController,
								scopeLang 		: scopeLang,
								hotkey 			: conf.HOTKEY.HEADQUARTER,
								templateName 	: "headquarter",
								classes 		: "fullsize",
								url		 		: "/controllers/HeadquarterController.js",
								style 			: null
						}		
						robotTW2.build(params)
					})
				}
				case robotTW2.controllers.MedicController : {
					robotTW2.createScopeLang("medic", function(scopeLang){
						var params = {
								controller		: robotTW2.controllers.MedicController,
								scopeLang 		: scopeLang,
								hotkey 			: conf.HOTKEY.MEDIC,
								templateName 	: "medic",
								classes 		: "",
								url		 		: "/controllers/MedicController.js",
								style 			: null
						}		
						robotTW2.build(params)
					})
				}
				case robotTW2.controllers.SpyController : {
					robotTW2.createScopeLang("spy", function(scopeLang){
						var params = {
								controller		: robotTW2.controllers.SpyController,
								scopeLang 		: scopeLang,
								hotkey 			: conf.HOTKEY.SPY,
								templateName 	: "spy",
								classes 		: "",
								url		 		: "/controllers/SpyController.js",
								style 			: null
						}		
						robotTW2.build(params)
					})
				}
				case robotTW2.controllers.FarmController : {
					robotTW2.createScopeLang("farm", function(scopeLang){
						var params = {
								controller		: robotTW2.controllers.FarmController,
								scopeLang 		: scopeLang,
								hotkey 			: conf.HOTKEY.FARM,
								templateName 	: "farm",
								classes 		: "fullsize",
								url		 		: "/controllers/FarmController.js",
								style 			: null
						}		
						robotTW2.build(params)
					})
				}
				case robotTW2.controllers.DefenseController : {
					robotTW2.createScopeLang("defense", function(scopeLang){
						var params = {
								controller		: robotTW2.controllers.DefenseController,
								scopeLang 		: scopeLang,
								hotkey 			: conf.HOTKEY.DEFENSE,
								templateName 	: "defense",
								classes 		: "fullsize",
								url		 		: "/controllers/DefenseController.js",
								style 			: null
						}		
						robotTW2.build(params)
					})
					break
				}
				case robotTW2.controllers.ReconController : {
					robotTW2.createScopeLang("recon", function(scopeLang){
						var params = {
								controller		: robotTW2.controllers.ReconController,
								scopeLang 		: scopeLang,
								hotkey 			: conf.HOTKEY.RECON,
								templateName 	: "recon",
								classes 		: "",
								url		 		: "/controllers/ReconController.js",
								style 			: null
						}		
						robotTW2.build(params)
					})
					break
				}
				case robotTW2.controllers.AttackController : {
					robotTW2.createScopeLang("attack", function(scopeLang){
						var params = {
								controller		: robotTW2.controllers.AttackController,
								scopeLang 		: scopeLang,
								hotkey 			: conf.HOTKEY.ATTACK,
								templateName 	: "attack",
								classes 		: "fullsize",
								url		 		: "/controllers/AttackController.js",
								style 			: null
						}		
						robotTW2.build(params)
					})
					break
				}
				case robotTW2.controllers.DepositController : {
					robotTW2.createScopeLang("deposit", function(scopeLang){
						var params = {
								controller		: robotTW2.controllers.DepositController,
								scopeLang 		: scopeLang,
								hotkey 			: conf.HOTKEY.DEPOSIT,
								templateName 	: "deposit",
								classes 		: "",
								url		 		: "/controllers/DepositController.js",
								style 			: null
						}		
						robotTW2.build(params)
					})
					break
				}
				case robotTW2.controllers.SecondVillageController : {
					robotTW2.createScopeLang("secondvillage", function(scopeLang){
						var params = {
								controller		: robotTW2.controllers.SecondVillageController,
								scopeLang 		: scopeLang,
								hotkey 			: conf.HOTKEY.SECONDVILAGE,
								templateName 	: "secondvillage",
								classes 		: "",
								url		 		: "/controllers/SecondVillageController.js",
								style 			: null
						}		
						robotTW2.build(params)
					})
					break
				}
				case robotTW2.controllers.AttackCompletionController : {
					robotTW2.createScopeLang("attack", function(scopeLang){
						var get_father = function(){
							return $('[ng-controller=ModalCustomArmyController]');
						}
						, get_son = function(){
							return get_father().children("div").children(".box-paper").children(".scroll-wrap")						
						}
						, params = {
								included_controller		: "ModalCustomArmyController",
								controller				: robotTW2.controllers.AttackCompletionController,
								get_son					: get_son,
								provider_listener		: robotTW2.providers.eventTypeProvider.PREMIUM_SHOP_OFFERS,
								scopeLang 				: scopeLang,
								templateName 			: "attackcompletion",
								url		 				: "/controllers/AttackCompletionController.js"
						}	
						robotTW2.build(params)
					})
					break
				}
				case robotTW2.controllers.FarmCompletionController : {
					robotTW2.createScopeLang("farm", function(scopeLang){
						var get_father = function(){
							return $('[ng-controller=BattleReportController]');
						}
						, get_son = function(){
							return get_father().find(".tbl-result") && !get_father().find("#checkboxFull").length ? get_father().find(".tbl-result") : false			
						}
						, params = {
								included_controller		: "BattleReportController",
								controller				: robotTW2.controllers.FarmCompletionController,
								get_son					: get_son,
								provider_listener		: robotTW2.providers.eventTypeProvider.OPEN_REPORT,
								scopeLang 				: scopeLang,
								templateName 			: "farmcompletion",
								url		 				: "/controllers/FarmCompletionController.js"
						}	
						robotTW2.build(params)
					})
					break
				}
				case robotTW2.services.MainService : {
					robotTW2.createScopeLang("main", function(scopeLang){
						robotTW2.services.$timeout(function(){
							robotTW2.services.MainService && typeof(robotTW2.services.MainService.initExtensions) == "function" ? robotTW2.services.MainService.initExtensions() : null;
							robotTW2.build(
									{
										controller		: robotTW2.controllers.MainController,
										scopeLang 		: scopeLang,
										hotkey 			: conf.HOTKEY.MAIN,
										templateName 	: "main",
										classes 		: null,
										url		 		: "/controllers/MainController.js",
										style 			: {
											width : "850px"
										}
									}
							)
							require(["robotTW2/notify"], function(notify){
								notify("RobotTW2", true)
							})
						}, 3000)
					})
					break
				}
				case robotTW2.services.FarmService : {
					robotTW2.services.FarmService && typeof(robotTW2.services.FarmService.init) == "function" ? robotTW2.requestFn.bind("farm", robotTW2.services.FarmService) : null;	
					break
				}
				case robotTW2.services.AttackService : {
					robotTW2.services.AttackService && typeof(robotTW2.services.AttackService.init) == "function" ? robotTW2.requestFn.bind("attack", robotTW2.services.AttackService) : null;	
					break
				}
				case robotTW2.services.DefenseService : {
					robotTW2.services.DefenseService && typeof(robotTW2.services.DefenseService.init) == "function" ? robotTW2.requestFn.bind("defense", robotTW2.services.DefenseService) : null;	
					break
				}
				case robotTW2.services.DepositService : {
					robotTW2.services.DepositService && typeof(robotTW2.services.DepositService.init) == "function" ? robotTW2.requestFn.bind("deposit", robotTW2.services.DepositService) : null;	
					break
				}
				case robotTW2.services.HeadquarterService : {
					robotTW2.services.HeadquarterService && typeof(robotTW2.services.HeadquarterService.init) == "function" ? robotTW2.requestFn.bind("headquarter", robotTW2.services.HeadquarterService) : null;	
					break
				}
				case robotTW2.services.ReconService : {
					robotTW2.services.ReconService && typeof(robotTW2.services.ReconService.init) == "function" ? robotTW2.requestFn.bind("recon", robotTW2.services.ReconService) : null;	
					break
				}
				case robotTW2.services.AlertService : {
					robotTW2.services.AlertService && typeof(robotTW2.services.AlertService.init) == "function" ? robotTW2.requestFn.bind("alert", robotTW2.services.AlertService) : null;	
					break
				}
				case robotTW2.services.RecruitService : {
					robotTW2.services.RecruitService && typeof(robotTW2.services.RecruitService.init) == "function" ? robotTW2.requestFn.bind("recruit", robotTW2.services.RecruitService) : null;	
					break
				}
				case robotTW2.services.SpyService : {
					robotTW2.services.SpyService && typeof(robotTW2.services.SpyService.init) == "function" ? robotTW2.requestFn.bind("spy", robotTW2.services.SpyService) : null;	
					break
				}
				case robotTW2.services.MedicService : {
					robotTW2.services.MedicService && typeof(robotTW2.services.MedicService.init) == "function" ? robotTW2.requestFn.bind("medic", robotTW2.services.MedicService) : null;	
					break
				}
				case robotTW2.services.SecondVillageService : {
					robotTW2.services.SecondVillageService && typeof(robotTW2.services.SecondVillageService.init) == "function" ? robotTW2.requestFn.bind("secondvillage", robotTW2.services.SecondVillageService) : null;	
					break
				}
				case "database" : {
					robotTW2.ready(function(){
						robotTW2.services.$timeout(function(){
							robotTW2.loadScript("/databases/data_villages.js")
							robotTW2.services.$timeout(function(){
								robotTW2.loadScript("/databases/data_farm.js");
								robotTW2.loadScript("/databases/data_deposit.js");
								robotTW2.loadScript("/databases/data_spy.js");
								robotTW2.loadScript("/databases/data_alert.js");
								robotTW2.loadScript("/databases/data_attack.js");
								robotTW2.loadScript("/databases/data_recon.js");
//								robotTW2.loadScript("/databases/data_defense.js");
								robotTW2.loadScript("/databases/data_headquarter.js");
								robotTW2.loadScript("/databases/data_recruit.js");
//								robotTW2.loadScript("/databases/data_medic.js");
								robotTW2.loadScript("/databases/data_secondvillage.js");

								robotTW2.services.$timeout(function(){
									robotTW2.loadScript("/databases/data_main.js");
								}, 3000)
							}, 3000)
						}, 1000)



					},  ["all_villages_ready"])

					break
				}
				case "data_main" : {
					robotTW2.loadScript("/services/MainService.js");
					break
				}
				case "data_farm" : {
					robotTW2.loadScript("/services/FarmService.js");
					break
				}
				case "data_attack" : {
					robotTW2.loadScript("/services/AttackService.js");
					break
				}
				case "data_defense" : {
					robotTW2.loadScript("/services/DefenseService.js");
					break
				}
				case "data_deposit" : {
					robotTW2.loadScript("/services/DepositService.js");
					break
				}
				case "data_headquarter" : {
					robotTW2.loadScript("/services/HeadquarterService.js");
					break
				}
				case "data_recon" : {
					robotTW2.loadScript("/services/ReconService.js");
					break
				}
				case "data_alert" : {
					robotTW2.loadScript("/services/AlertService.js");
					break
				}
				case "data_recruit" : {
					robotTW2.loadScript("/services/RecruitService.js");
					break
				}
				case "data_spy" : {
					robotTW2.loadScript("/services/SpyService.js");
					break
				}
				case "data_medic" : {
					robotTW2.loadScript("/services/MedicService.js");
					break
				}
				case "data_secondvillage" : {
					robotTW2.loadScript("/services/SecondVillageService.js");
					break
				}
				}

			});

		})
	});
}.call(this)
