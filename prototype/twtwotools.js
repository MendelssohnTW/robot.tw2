
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
	var mapService	 			= injector.get("mapService");
	var socketService		 	= injector.get("socketService");
	var storageService		 	= injector.get("storageService")
	var buildingService		 	= injector.get("buildingService");
	var resourceService		 	= injector.get("resourceService");
	var recruitingService	 	= injector.get("recruitingService");
	var templateManagerService 	= injector.get("templateManagerService");
	var reportService 			= injector.get("reportService");
	var villageService 			= injector.get("villageService");
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
	, requestFile = function requestFile(fileName, path, onLoad, opt_onError) {
		//path = "/json/filename"
		var I18N_PATH_EXT = [path, '.json'];
		if(!path){
			I18N_PATH_EXT = ['/lang/', '.json'];
		}
		var uri	= I18N_PATH_EXT.join(fileName)
		, onFileLoadedLang = function onFileLoadedLang() {
			$timeout = $timeout || window.injector.get('$timeout');
			$timeout(function () {
				i18n.updateLocAle(true)
				if (onLoad) {
					onLoad();
				}
			});
		}
		, onFileLoadedJson = function onFileLoadedJson(jsont) {
			$timeout = $timeout || window.injector.get('$timeout');
			$timeout(function () {
				if (onLoad) {
					onLoad(jsont);
				}
			});
		};

		httpService.get(uri, function(jsont) {
			if(path == "/lang/"){
				i18n.setJSON(jsont);
				onFileLoadedLang();
			} else {
				onFileLoadedJson(jsont);
			}
		}, function error(data, status, headers, config) {
			if (angular.isFunction(opt_onError)) {
				opt_onError(data, status, headers, config);
			}
		}, true);
	}
	, requestFn = (function(){
		var fns = {}
		, triggered = {}
		, service = {};
		return service.prefix = "robotTW2/" 
			, service.bind = function(key, fn, params, callback) {
			fns.hasOwnProperty(this.prefix + key) || (fns[this.prefix + key] = []),
			fns[this.prefix + key].push(
					{
						fn:fn, params:params || {}
					}
			)
			if(typeof(callback)=="function"){
				callback({fn:fn, params:params || {}})
			}
		}
		,
		service.trigger = function(key, params) {
			fns.hasOwnProperty(this.prefix + key) && fns[this.prefix + key].forEach(function(fs) {
				if(!params || !Object.keys(params).length) {
					if(!Object.keys(fs.params).length) {
						triggered[this.prefix + key] = fs.fn.apply(this, [])
					} else {
						triggered[this.prefix + key] = fs.fn.apply(this, fs.params)
					}
				} else {
					if(!Object.keys(fs.params).length) {
						triggered[this.prefix + key] = fs.fn.apply(this, [])
					} else {
						triggered[this.prefix + key] = fs.fn.apply(this, fs.params)
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
			if(fns.hasOwnProperty(this.prefix + key)){
				if(triggered[key]){
					if(typeof(triggered[this.prefix + key]) == "object"){
						if(triggered[this.prefix + key].$$state.status == 0){
							$timeout.cancel(triggered[this.prefix + key])	
						}
					} else if(typeof(triggered[this.prefix + key]) == "function"){
						triggered[this.prefix + key]();
					}
					delete triggered[this.prefix + key];
					delete fns[this.prefix + key];
				} else {
					delete fns[this.prefix + key];
				}
			}
		}
		, service.unbindAll = function(type) {
			Object.keys(fns).map(function(key){
				if(!fns[key].params) {
					return undefined
				} else {
					if(!fns[key].params.type) {
						return undefined
					} else {
						if(fns[key].params.type == type){
							if(triggered[key]){
								if(typeof(triggered[key]) == "object"){
									if(triggered[key].$$state.status == 0){
										$timeout.cancel(triggered[key])	
									}
								} else if(typeof(triggered[key]) == "function"){
									triggered[key]();
								}
								delete triggered[key];
								delete fns[key];
							} else {
								delete fns[key];
							}
						}
					}
				}
			})
		}
		, service.getFns = function(){return fns}
		,
		service
	})()
	, commandQueue = (function (){
		var service = {};
		return service.bind = function(key, fn, opt_db, params, callback) {
			if(!key) return;
			if(opt_db){
				if(typeof(opt_db.get) == "function"){
					if(!opt_db.commands){opt_db["commands"]= {}}
					!opt_db.commands[key] ? opt_db.commands[key] = params : null;
					$rootScope.$broadcast(exports.providers.eventTypeProvider.CHANGE_COMMANDS)
				}
			}
			requestFn.bind(key, fn, params, function(fns){
				if(typeof(callback)=="function"){
					callback(fns)
				}	
			})
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
			if(opt_db){
				if(typeof(opt_db.get) == "function"){
					delete opt_db.commands[key];
				}
			}
			$rootScope.$broadcast(exports.providers.eventTypeProvider.CHANGE_COMMANDS)
			requestFn.unbind(key);
		}
		,
		service.unbindAll = function(type, opt_db) {
			if(!type){return}
			requestFn.unbindAll(type)
			if(opt_db)	{
				opt_db.commands = {};
			}
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
		var t = undefined;
		if(!promise){
			promise = new Promise(function(res){
				t = exports.services.$timeout(function(){
					res()
				}, 30000)
				var a = Math.round(Math.random() * 1e10)
				var b = document.createElement("script");
				b.type = "text/javascript";
				b.onload = function(data){
					exports.services.$timeout.cancel(t);
					t = undefined;
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
						res()
					})

				}
				b.onerror = function(erro){
					console.log(erro)
					return
				}
//				b.src = host + url + '?' + a;
				b.src = host + url;

				if(!scripts_loaded.find(f => f == url)){
					if(!scripts_removed.find(f => f == url)){
						document.head.appendChild(b);	
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
		this.listener_layout 		= undefined;
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

			self.controller.apply(self.controller, [scope])

		}, function(data) {
			//console.log(reason); // Error!
		});

	}
	,
	builderWindow.prototype.buildWin = function() {
		var scope = $rootScope.$new();
		var self = this;
		if(self.templateName != "main" && self.hotkey != "open"){
			var arFn = exports.requestFn.get(self.templateName.toLowerCase(), true);
			if(!arFn){return}
			if(exports.databases.data_main.pages_excludes.includes(self.templateName)){
				if(!arFn.fn.isInitialized()){return}
			} else{
				if(!arFn.fn.isInitialized() || !arFn.fn.isRunning()) {return}
			}
		}
		self.scopeLang ? angular.extend(scope, self.scopeLang) : null;
		new Promise(function(res){
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
					window.dispatchEvent(new Event('resize'));
				})
			}

			if(self.classes){
				if(typeof(self.classes) == "string"){
					self.classes = [self.classes]
				}
				var cls = self.classes.join(" ");
				$(rootnode).addClass(cls);
			}

			data.scope.$on('$destroy', function() {
				$("#map")[0].setAttribute("style", "left:0px;")
				window.dispatchEvent(new Event('resize'));
			});

			self.$window = rootnode;
			$(".win-main").removeClass("jssb-focus")
			$(".win-main").removeClass("jssb-applied")
			!self.$scrollbar ? self.$scrollbar = new jsScrollbar(document.querySelector(".win-main")) : null;
			self.recalcScrollbar = function() {
				if(!self.$scrollbar) return;
				if(!self.$scrollbar.recalc) return;
				self.$scrollbar.recalc()
			};
			self.disableScrollbar = function() {
				if(!self.$scrollbar) return;
				if(!self.$scrollbar.disable) return;
				self.$scrollbar.disable()
			};
			self.setCollapse = function() {
				self.$window.querySelectorAll(".twx-section.collapse").forEach(function(b) {
					var c = !b.classList.contains("hidden-content")
					, d = document.createElement("span");
					d.className = "min-max-btn";
					var e = document.createElement("a");
					e.className = "btn-orange icon-26x26-" + (c ? "minus" : "plus"),
					!c ? (b.nextElementSibling.style.display = "none") : (b.nextElementSibling.style.display = ""),
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
				self.recalcScrollbar()
			}
			angular.extend(data.scope, self)
			self.controller.apply(self.controller, [data.scope])
		});
	}
	,
	builderWindow.prototype.addhotkey = function() {
		var fnThis = this.buildWin;
		var self = this;
		if(this.hotkey == "open"){
			fnThis.apply(self, null)
		} else {
			exports.services.hotkeys.add(this.hotkey, function(){
				fnThis.apply(self, null)
			}, ["INPUT", "SELECT", "TEXTAREA"])
		}
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
			storageService				: storageService,
			modelDataService			: modelDataService,
			socketService				: socketService,
			buildingService				: buildingService,
			resourceService				: resourceService,
			recruitingService			: recruitingService,
			templateManagerService 		: templateManagerService,
			reportService 				: reportService,
			villageService				: villageService
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
	exports.requestFile 		= requestFile;
	exports.commandQueue 		= commandQueue;

	(function ($rootScope){
		var lded = false;
		var tm = $timeout(function(){
			if(!lded){
				lded = true;
				$rootScope.$broadcast("ready_init")
			}
		}, 15000)
		requestFile($rootScope.loc.ale, "/lang/", function(){
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
		
		var version = "3.1.0"

		define("robotTW2/version", function(){
			return {
				main:			version,
				villages:		version,
				alert:			version,
				deposit:		version,
				headquarter:	version,
				recon:			version,
				spy:			version,
				attack:			version,
				defense:		version,
				farm:			version,
				recruit:		version,
				medic:			version,
				secondvillage:	version,
				map:			version,
				data:			version,
				log:			version
			}
		});

		define("robotTW2/requestFile", ["robotTW2"], function requestFile(robotTW2){
			return robotTW2.requestFile;
		})

		define("robotTW2/conf", [
			"conf/buildingTypes",
			"robotTW2/version",
			"robotTW2/requestFile"
			], function(
					buildingTypes,
					version,
					requestFile
			) {

			return (function(){
				var levelsBuilding = {};
				for (var type in buildingTypes){
					if(buildingTypes.hasOwnProperty(type) && [buildingTypes[type]] != "fortress"){
						levelsBuilding[buildingTypes[type]] = 0;
					}
				}

				var seg = 1000 // 1000 milisegundos
				, min = seg * 60
				, h = min * 60;

				var conf = {
						h						: h,
						min						: min,
						seg						: seg,
						LIMIT_COMMANDS_DEFENSE	: 13,
						MAX_COMMANDS_FARM		: 42,
						MIN_POINTS_FARM			: 0,
						MAX_POINTS_FARM			: 12000,
						MAP_CHUNCK_LEN 			: 30 / 2,
						TIME_CORRECTION_COMMAND : 1275,
						TIME_DELAY_UPDATE		: 30 * seg,
						TIME_DELAY_FARM			: 1000,
						TIME_SNIPER_ANT 		: 30000,
						TIME_SNIPER_POST 		: 3000,
						TIME_SNIPER_POST_SNOB	: 1000,
						MAX_TIME_CORRECTION 	: 5 * seg,
						MIN_TIME_SNIPER_ANT 	: 5,
						MAX_TIME_SNIPER_ANT 	: 600,
						MIN_TIME_SNIPER_POST 	: 0.3,
						MAX_TIME_SNIPER_POST 	: 600,
						MAX_JOURNEY_DISTANCE 	: 6,
						MIN_JOURNEY_DISTANCE 	: 1,
						MAX_JOURNEY_TIME     	: 1 * h,
						MIN_JOURNEY_TIME     	: 8 * min,
						VERSION					: {
							MAIN			: version.main,
							VILLAGES		: version.villages,
							HEADQUARTER		: version.headquarter,
							ALERT			: version.alert,
							RECON			: version.recon,
							SPY				: version.spy,
							ATTACK			: version.attack,
							DEFENSE			: version.defense,
							FARM			: version.farm,
							RECRUIT			: version.recruit,
							DEPOSIT			: version.deposit,
							MEDIC			: version.medic,
							SECONDVILLAGE	: version.secondvillage,
							MAP				: version.map,
//							DATA			: version.data,
							LOG				: version.log
						},
						FARM_TIME		      	: 30 * min,
						MIN_INTERVAL	     	: 5 * min,
						INTERVAL				: {
							HEADQUARTER	: h,
							RECRUIT		: h,
							DEPOSIT		: 15 * min,
							ALERT		: 5 * min,
							ATTACK		: h,
							MEDIC		: h,
//							DATA		: {
//								villages	: 6 * h,
//								tribes		: 2 * h,
//								log			: 1 * h,
//								members		: 3 * h
//							},
							SPY			: 30 * min
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
							"secondvillage",
							"map",
							"data",
							"log"
							]
						,
						HOTKEY					: {
							ALERT		 	: "shift+l",
							ATTACK		 	: "shift+a",
							DEFENSE		 	: "shift+d",
							DEPOSIT		 	: "shift+t",
							FARM		 	: "shift+f",
							HEADQUARTER 	: "shift+h",
							MAIN 			: "shift+p",
							MEDIC		 	: "shift+i",
							RECON		 	: "shift+r",
							RECRUIT		 	: "shift+e",
							SPY			 	: "shift+s",
							SECONDVILLAGE	: "shift+q",
//							DATA			: "shift+j",
							MAP			 	: "shift+m"
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
						TROOPS_NOT				: {
							RECRUIT	: ["knight", "snob", "doppelsoldner", "trebuchet"],
							FARM	: ["knight", "snob", "doppelsoldner", "trebuchet", "ram"]}

				}

				requestFile("orderBuilding", "/json/", function(jsont_order){
					var orderBuilding = jsont_order;
					requestFile("limitBuilding", "/json/", function(jsont_limit){
						var limitBuilding = jsont_limit;
						angular.extend(conf, {
							EXECUTEBUILDINGORDER 	: true,
							BUILDINGORDER			: orderBuilding,
							BUILDINGLIMIT			: limitBuilding,
							BUILDINGLEVELS			: levelsBuilding
						})
					})
				})

				return conf;
			})()
		})
		angular.extend(robotTW2.services, define("robotTW2/services", [], function(){
			robotTW2.register("services", "hotkeys");
			robotTW2.register("services", "premiumActionService");
			robotTW2.register("services", "secondVillageService");
			robotTW2.register("services", "overviewService");
			robotTW2.register("services", "$filter");
			robotTW2.register("services", "presetListService");
			robotTW2.register("services", "presetService");
			robotTW2.register("services", "groupService");
			robotTW2.register("services", "effectService");
			robotTW2.register("services", "armyService");
			robotTW2.register("services", "windowDisplayService");


			return robotTW2.services;
		}))
		angular.extend(robotTW2.databases, define("robotTW2/databases", [], function(){
			robotTW2.loadScript("/databases/database.js");
			return robotTW2.databases;
		}))
		angular.extend(robotTW2.providers, define("robotTW2/providers", [], function(){
			robotTW2.register("providers", "routeProvider", {
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
				"CHANGE_COMMANDS_DEFENSE"		: "Internal/robotTW2/change_commands_defense",
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

		define("robotTW2/base", function () {

			switch ($rootScope.loc.ale) {
//			case "pl_pl" : {
//			return {
//			URL_BASE			: "https://avebnt.nazwa.pl/endpointbandits/",
//			URL_SOCKET			: "wss://avebnt.nazwa.pl/endpointbandits/endpoint_server"
//			}
//			break
//			}
			default : {
				return {
					URL_BASE			: "https://www.ipatapp.com.br/endpoint/",
					URL_SOCKET			: "wss://www.ipatapp.com.br/endpoint/endpoint_server"
				}
				break
			}
			}

		})

//		define("robotTW2/socket", ["robotTW2/base"], function(base) {
//			var service = {},
//			id = 0,
//			count = 0,
//			timeouts = {}
//			callbacks = {},
//			onopen = function onopen(){
//				connect.call(true);
//			},
//			onmessage = function onmessage(message){
//				var msg;
//				try {
//					msg = angular.fromJson(message.data);
//				} catch (err) {
//					msg = message.data;
//				}
//
//				var id_return = msg.id
//				if(timeouts[id_return]){
//					robotTW2.services.$timeout.cancel(timeouts[id_return])
//					delete timeouts[id_return];
//				}
//				var opt_callback = callbacks[id_return];
//				if(typeof(opt_callback) == "function"){
//					opt_callback(msg);
//				}
//			},
//			onclose = function onclose($event){
//				if($event.code == 1006 && $event.type == "close"){
//					console.log($event)
////					robotTW2.loadScript("/controllers/ConfirmController.js");
//				}
//			},
//			onerror = function onerror($event, url, data){
//				if($event == "Uncaught TypeError: Illegal invocation") {
//					return
//				}
//				count++;
//				if(count < 10) {
//					service = new WebSocket(base.URL_SOCKET);
//				} else {
//					count = 0
//					if($rootScope.data_data){
//						$rootScope.data_data.possible = false;
//						$rootScope.data_data.activated = false;
//					}
//					console.log("Socket error ... \n");
//					console.log($event);
//				}
//			},
//			connect = function connect(callback){
//				switch (service.readyState){
//				case 1 : //Aberta
//					if($rootScope.data_data){
//						$rootScope.data_data.possible = true;
//					}
//					if (typeof callback === "function") {
//						callback(true);
//					};
//					break;
//				case 3 : //Fechada
//					service = new WebSocket(base.URL_SOCKET);
//					break;
//				}
//			},
//			disconnect = function disconnect(){
//				if (service) {
//					service.close();
//				}
//			}
//			, createTimeout = function (id, type, opt_callback){
//				if(!timeouts[id]){
//					timeouts[id] = robotTW2.services.$timeout(function(){
//						if(typeof(opt_callback) == "function"){
//							opt_callback({"type" : type, "data": "Timeout"})
//						}
//					}, 15000)
//				}
//			}
//			, sendMsg = function sendMsg(type, data, opt_callback){
//				if(robotTW2.services.modelDataService.getSelectedCharacter().getTribe().data){
//					id = ++id;
//					createTimeout(id, type, opt_callback)
//					var dw = null
//					var dt = null
//					if(data.world_id)
//						dw = data.world.id;
//					if(data.tribe_id)
//						dt = data.tribe_id;
//					if(data){
//						if(data.user){
//							angular.extend(data.user, {"pui": robotTW2.services.modelDataService.getSelectedCharacter().getWorldId() + "_" + robotTW2.services.modelDataService.getSelectedCharacter().getId()})
//						} else {
//							data.user = {"pui": robotTW2.services.modelDataService.getSelectedCharacter().getWorldId() + "_" + robotTW2.services.modelDataService.getSelectedCharacter().getId()}
//						}
//						angular.extend(data, {
//							"world_id": dw || robotTW2.services.modelDataService.getSelectedCharacter().getWorldId(),
//							"member_id": robotTW2.services.modelDataService.getSelectedCharacter().getId(),
//							"tribe_id": dt || robotTW2.services.modelDataService.getSelectedCharacter().getTribeId(),
//						});
//					}
//					callbacks[id] = opt_callback;
//
//					service.send(
//							angular.toJson({
//								'type'		: type,
//								'data'		: data,
//								'pui'		: robotTW2.services.modelDataService.getSelectedCharacter().getWorldId() + "_" + robotTW2.services.modelDataService.getSelectedCharacter().getId(),
//								'id'		: id,
//								'local'		: robotTW2.services.modelDataService.getSelectedCharacter().getTribe().data.name.toLowerCase()
//							})
//					)
//				} else {
//					if(typeof(opt_callback) == "function"){
//						opt_callback({"type": type, "resp": "noTribe"});
//					}
//				}
//			}
//
//			service = new WebSocket(base.URL_SOCKET);
//			service.onopen = onopen;
//			service.onmessage = onmessage;
//			service.onclose = onclose;
//			service.onerror = onerror;
//			service.connect = connect;
//			service.sendMsg = sendMsg;
//
//			return service;
//
//		})

//		define("robotTW2/socketSend", ["robotTW2/socket"], function(socket) {
//
//			var service = {},
//			count = 0;
//			return service.emit = function (route, data, opt_callback){
//				var cal = function cal(connected){
//					count++;
//					if (connected && route != undefined){
//						socket.sendMsg(route.type, data, opt_callback);
//						return;
//					} else {
//						if (count < 10){
//							socket.connect(
//									function(connected){
//										cal(connected)
//									}
//							);
//							return;
//						} else {
//							count = 0;
//							return;
//						}
//					}
//				};
//				socket.connect(
//						function(connected){
//							cal(connected)
//						}
//				);
//
//			}
//			, service;
//		})

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
			var w = {};
			return w.convertedTime = function(){
				var date = new Date(helper.gameTime())
				date.setMinutes(date.getMinutes() + date.getTimezoneOffset())
				return date.getTime() + helper.getGameTimeOffset();
			}
			, w.convertMStoUTC = function(ms){
				var date = new Date(ms)
				date.setMinutes(date.getMinutes() + date.getTimezoneOffset())
				return date.getTime() + helper.getGameTimeOffset();
			}
			, w;
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
		,
		define("robotTW2/calculateTravelTime", [
			"conf/commandTypes",
			"conf/unitTypes",
			"conf/buildingTypes",
			"conf/researchTypes",
			"conf/effectTypes",
			], function(
					commandTypesConf,
					unitTypes,
					buildingTypes,
					researchTypes,
					effectTypes
			){
			return function(army, village, opt_commandType, opt_flags) {

				hasUnitsOfType = function (army, type) {
					return !!army.units[type] && (army.units[type] > 0);
				}

				isForcedMarchActive = function (army, commandType, village) {
					var forcedMarchResearch;

					if (hasUnitsOfType(army, unitTypes.KNIGHT) && (commandType === commandTypesConf.TYPES.SUPPORT)) {
						// forced march
						forcedMarchResearch	= village.getBuildingResearch(buildingTypes.STATUE, researchTypes.STATUE.FORCED_MARCH);

						if (forcedMarchResearch && forcedMarchResearch.active) {
							return true;
						}
					}

					return false;
				}

				var unitsObject			= robotTW2.services.modelDataService.getGameData().getUnitsObject(),
				officerSpeeds		= robotTW2.services.modelDataService.getOfficers().getDataForType('change_movement_speed', army.officers),
				worldConfig			= robotTW2.services.modelDataService.getWorldConfig(),
				travelTime			= 0,
				barbarianTarget		= false,
				ownTribeTarget		= false,
				useOfficers			= true,
				useEffects			= true,
				useBastard			= false,
				commandType			= opt_commandType || commandTypesConf.TYPES.ATTACK,
				forcedMarch			= isForcedMarchActive(army, commandType, village),
				officerSpeed,
				unitTravelTime,
				unitName,
				effectValue,
				rallyPointData,
				i;

				if (!Object.keys(army.units).length) {
					return 0;
				}

				if (opt_flags) {
					if (opt_flags.hasOwnProperty('barbarian')) {
						barbarianTarget = opt_flags.barbarian;
					}
					if (opt_flags.hasOwnProperty('ownTribe')) {
						ownTribeTarget = opt_flags.ownTribe;
					}
					if (opt_flags.hasOwnProperty('officers')) {
						useOfficers = opt_flags.officers;
					}
					if (opt_flags.hasOwnProperty('effects')) {
						useEffects = opt_flags.effects;
					}
				}

				// Get slowest unit (with biggest speed property) and set it's speed as the army travel time
				for (unitName in unitsObject) {
					if (army.units[unitName]) {
						unitTravelTime = unitsObject[unitName].speed;
						if (unitTravelTime > travelTime) {
							travelTime = unitTravelTime;
						}
					}
				}

				if (useEffects && forcedMarch) {
					travelTime = unitsObject[unitTypes.KNIGHT].speed;
				}

				if (useOfficers) {
					// Modify the travel time via the officer values
					for (i = 0; i < officerSpeeds.length; i++) {
						officerSpeed = officerSpeeds[i];
						if ((barbarianTarget && officerSpeed.conditions.target_barbarian) || (!officerSpeed.conditions.target_barbarian)) {
							if (officerSpeed.speed) {
								// The bastard officer has special speed flag, as take the same as snob speed. In these
								// cases, the unit type as string should be in the officerSpeed.speed property.
								travelTime = unitsObject[officerSpeed.speed].speed;
								useBastard = true;
							} else if (officerSpeed.bonus_percentage && !forcedMarch) {
								// Other officers who modify speed, has a bonus_percentage value.
								travelTime /= (1 + (officerSpeed.bonus_percentage / 100));
							}
						}
					}
				}

				if (useEffects) {
					if (barbarianTarget && (commandType === commandTypesConf.TYPES.ATTACK)) {
						// farm speed effect
						effectValue = robotTW2.services.effectService.getStackedEffectValue(effectTypes.FARM_SPEED_INCREASE);
						if (effectValue) {
							travelTime /= effectValue;
						}

						// rally point speed bonus
						if (worldConfig.isRallyPointSpeedBonusEnabled() &&
								worldConfig.getRallyPointSpeedBonusVsBarbarians() &&
								!hasUnitsOfType(army, unitTypes.SNOB) &&
								!useBastard
						) {
							rallyPointData = village.getBuildingData().getDataForBuilding(buildingTypes.RALLY_POINT);
							travelTime /= (rallyPointData.specialFunction.currentValue / 100);
						}
					}

					if (ownTribeTarget && (commandType === commandTypesConf.TYPES.SUPPORT)) {
						// tribe support effect
						effectValue = effectService.getStackedEffectValue(effectTypes.FASTER_TRIBE_SUPPORT);
						if (effectValue) {
							travelTime /= effectValue;
						}
					}
				}

				return +((travelTime / worldConfig.getSpeed()) * 60).toFixed(2);
			}
		})
		,
		define("robotTW2/calibrate_time", [
			"helper/time", 
			"robotTW2/time",
			"robotTW2/conf",
			"helper/math",
			"robotTW2/calculateTravelTime"
			], function(
					helper, 
					time,
					conf,
					math,
					calculateTravelTime
			) {
			var promise_calibrate = undefined
			, listener_completed = undefined
			return function(){
				function calibrate () {
					return new Promise (function(resolve){
						var villages = robotTW2.services.modelDataService.getVillages()
						, village = villages[Object.keys(villages).shift()]
						, units = {}
						, unitInfo = village.unitInfo.getUnits()
						, gTime

						if (!unitInfo) {return};
						for(unit in unitInfo){
							if (unitInfo.hasOwnProperty(unit)){
								if (unitInfo[unit].available > 0 && !["doppelsoldner","knight","trebuchet"].some(f => f == unit)){
									var unit_available = {[unit]: unitInfo[unit].available};
									units[Object.keys(unit_available)[0]] = 
										Object.keys(unit_available).map(function(key) {return unit_available[key] = 1})[0];
								}
							}
						}

						var obj_unit;

						if(!units){
							console.log("no units")
							return
						} else {
							obj_unit ={[Object.keys(units)[0]]: units[Object.keys(units)[0]]};
						}

						units = angular.merge({}, obj_unit)

						var army = {
							'officers'	: {},
							"units"		: units
						}

						robotTW2.services.socketService.emit(robotTW2.providers.routeProvider.MAP_GET_NEAREST_BARBARIAN_VILLAGE, {
							'x' : village.data.x,
							'y' : village.data.y
						}, function(bb) {
							if (bb) {
								var distancia = math.actualDistance(village.getPosition(), {
									'x'			: bb.x,
									'y'			: bb.y
								})
								speed = calculateTravelTime(army, village, "attack", {
									'barbarian'		: true
								})
								, duration = helper.unreadableSeconds(helper.readableSeconds(speed * distancia, false))


								robotTW2.services.$timeout(function(){
									gTime = time.convertedTime();
									this.listener_completed ? this.listener_completed() : this.listener_completed;
									this.listener_completed = undefined;
									this.listener_completed = $rootScope.$on(robotTW2.providers.eventTypeProvider.COMMAND_SENT, function ($event, data){
										if(!data){
											resolve()
											return
										}
										if(data.direction =="forward" && data.origin.id == village.data.villageId){
											var outgoing = robotTW2.services.modelDataService.getSelectedCharacter().getVillage(village.data.villageId).data.commands.outgoing;
											var completedAt = outgoing[Object.keys(outgoing).pop()].completedAt;
											var startedAt = outgoing[Object.keys(outgoing).pop()].startedAt;
//											var dif = (gTime - time.convertMStoUTC(completedAt - (duration*1000))) - conf.TIME_CORRECTION_COMMAND;
											var dif = (gTime - time.convertMStoUTC(startedAt)) - conf.TIME_CORRECTION_COMMAND;
											if(!robotTW2.databases.data_main.max_time_correction || (dif > -robotTW2.databases.data_main.max_time_correction && dif < robotTW2.databases.data_main.max_time_correction)) {
												robotTW2.databases.data_main.time_correction_command = dif
												robotTW2.databases.data_main.set();
												$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.CHANGE_TIME_CORRECTION)
											}
											this.listener_completed();
											this.listener_completed = undefined;
											robotTW2.services.$timeout(function(){
												robotTW2.services.socketService.emit(robotTW2.providers.routeProvider.COMMAND_CANCEL, {
													command_id: data.command_id
												})
												resolve();
											}, 5000)
										}
									})
									robotTW2.services.socketService.emit(robotTW2.providers.routeProvider.SEND_CUSTOM_ARMY, {
										start_village: village.getId(),
										target_village: bb.id,
										type: "attack",
										units: units,
										icon: 0,
										officers: {},
										catapult_target: null
									});
								}, 1000);
							}
						})
					})
				}

				if(!this.promise_calibrate){
					this.promise_calibrate = calibrate().then(function(){
						robotTW2.services.$timeout(function(){
							this.promise_calibrate = undefined;
						}, 10 * conf.min)
					})
				}
			}
		})


		$rootScope.$on("ready_init", function($event){
			robotTW2.ready(function(){
				require(["robotTW2/services"]);
				require(["robotTW2/databases"]);
				require(["robotTW2/controllers"]);

				angular.extend(robotTW2.controllers, define("robotTW2/controllers", [], function(){
//					robotTW2.loadScript("/controllers/MainController.js");
					return robotTW2.controllers;
				}))
			}, ["all_villages_ready"])
		})

		var count_ready = true;

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
//					robotTW2.loadScript("/controllers/DataController.js");
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
					break
				}
				case robotTW2.controllers.ConfirmController : {
					robotTW2.createScopeLang("confirm", function(scopeLang){
						var params = {
								controller		: robotTW2.controllers.ConfirmController,
								scopeLang 		: scopeLang,
								hotkey 			: "open",
								templateName 	: "confirm",
								url		 		: "/controllers/ConfirmController.js",
						}		
						robotTW2.build(params)
					})
					break
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
					break
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
					break
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
								style 			: {
									width:"350px"
								}
						}		
						robotTW2.build(params)
					})
					break
				}
				case robotTW2.controllers.FarmController : {
					robotTW2.createScopeLang("farm", function(scopeLang){
						var params = {
								controller		: robotTW2.controllers.FarmController,
								scopeLang 		: scopeLang,
								hotkey 			: conf.HOTKEY.FARM,
								templateName 	: "farm",
								classes 		: "",
								url		 		: "/controllers/FarmController.js",
								style 			: {
									width:"950px"
								}
						}		
						robotTW2.build(params)
					})
					break
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
								style 			: {
									width:"350px"
								}
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
								style 			: {
									width:"350px"
								}
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
								hotkey 			: conf.HOTKEY.SECONDVILLAGE,
								templateName 	: "secondvillage",
								classes 		: "",
								url		 		: "/controllers/SecondVillageController.js",
								style 			: {
									width:"350px"
								}
						}		
						robotTW2.build(params)
					})
					break
				}
//				case robotTW2.controllers.DataController : {
//					robotTW2.createScopeLang("data", function(scopeLang){
//						var params = {
//								controller		: robotTW2.controllers.DataController,
//								scopeLang 		: scopeLang,
//								hotkey 			: conf.HOTKEY.DATA,
//								templateName 	: "data",
//								classes 		: "",
//								url		 		: "/controllers/DataController.js",
//								style 			: null
//						}		
//						robotTW2.build(params)
//					})
//					break
//				}
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
				case robotTW2.controllers.SpyCompletionController : {
					robotTW2.createScopeLang("spy", function(scopeLang){
						var get_father = function(){
							return $('[ng-controller=ModalSendSpiesController]');
						}
						, get_son = function(){
							return get_father().children("div").children(".box-paper").children(".scroll-wrap")						
						}
						, params = {
								included_controller		: "ModalSendSpiesController",
								controller				: robotTW2.controllers.SpyCompletionController,
								get_son					: get_son,
								provider_listener		: robotTW2.providers.eventTypeProvider.VILLAGE_SELECTED_CHANGED,
								scopeLang 				: scopeLang,
								templateName 			: "spycompletion",
								url		 				: "/controllers/SpyCompletionController.js"
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
											width : "1080px"
										}
									}
							)
							require(["robotTW2/notify"], function(notify){
								notify("Shift + P = Main Menu", true)
							})
						}, 3000)
					})
					break
				}
				case robotTW2.services.ExtensionService : {
					robotTW2.services.ExtensionService && typeof(robotTW2.services.ExtensionService.init) == "function" ? robotTW2.requestFn.bind("extension", robotTW2.services.ExtensionService) : null;	
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
				case robotTW2.services.MapService : {
					robotTW2.services.MapService && typeof(robotTW2.services.MapService.init) == "function" ? robotTW2.requestFn.bind("map", robotTW2.services.MapService) : null;	
					break
				}
//				case robotTW2.services.DataService : {
//					robotTW2.services.DataService && typeof(robotTW2.services.DataService.init) == "function" ? robotTW2.requestFn.bind("data", robotTW2.services.DataService) : null;	
//					break
//				}
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
								robotTW2.loadScript("/databases/data_defense.js");
								robotTW2.loadScript("/databases/data_headquarter.js");
								robotTW2.loadScript("/databases/data_recruit.js");
								robotTW2.loadScript("/databases/data_secondvillage.js");
//								robotTW2.loadScript("/databases/data_data.js");
								robotTW2.loadScript("/databases/data_log.js");

								robotTW2.services.$timeout(function(){
									robotTW2.loadScript("/databases/data_main.js");
								}, 3000)
							}, 3000)
						}, 1000)

					},  ["all_villages_ready", "tribe_relations"])

					break
				}
				case "data_main" : {
					robotTW2.loadScript("/services/MainService.js");
					robotTW2.loadScript("/services/ExtensionService.js");
					robotTW2.loadScript("/controllers/MainController.js");
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
				case "data_secondvillage" : {
					robotTW2.loadScript("/services/SecondVillageService.js");
					break
				}
//				case "data_data" : {
//					robotTW2.loadScript("/services/DataService.js");
//					break
//				}
				}

			});
		})
	});
}.call(this)


