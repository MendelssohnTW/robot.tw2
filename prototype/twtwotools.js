var robotTW2 = window.robotTW2 = undefined;

(function (root, factory) {
	if (typeof define === "function" && define.amd) {
		root.robotTW2 = define("robotTW2", [
			"battlecat",
			"conf/conf",
			"cdn",
			"conf/cdn",
			"helper/i18n",
			"queues/EventQueue"
		], factory);
	} else {
		return
	}
}
)(this, (function (
	battlecat,
	conf,
	cdn,
	cdnConf,
	i18n,
	EventQueue
) {
	var exports = {}

	"use strict";
	var host = "https://mendelssohntw.github.io/robot.tw2/prototype";
	var $rootScope = injector.get('$rootScope');
	var $templateCache = injector.get('$templateCache');
	var $exceptionHandler = injector.get('$exceptionHandler');
	var $timeout = injector.get('$timeout');
	var $compile = injector.get('$compile');
	var httpService = injector.get("httpService");
	var windowManagerService = injector.get("windowManagerService");
	var modelDataService = injector.get("modelDataService");
	var mapService = injector.get("mapService");
	var socketService = injector.get("socketService");
	var storageService = injector.get("storageService")
	var buildingService = injector.get("buildingService");
	var resourceService = injector.get("resourceService");
	var recruitingService = injector.get("recruitingService");
	var presetService = injector.get("presetService");
	var presetListService = injector.get("presetListService");
	var templateManagerService = injector.get("templateManagerService");
	var reportService = injector.get("reportService");
	var villageService = injector.get("villageService");
	var linkService = injector.get("linkService");
	var eventTypeProvider = injector.get("eventTypeProvider");
	var routeProvider = injector.get("routeProvider");
	var autoCompleteService = injector.get("autoCompleteService");
	var CONTENT_CLASS = 'win-content';
	var BLOCKED_CLASS = 'blocked';
	var scripts_loaded = undefined;
	//var scripts_removed = [];

	var getPath = function getPath(origPath, opt_noHost) {
		if (opt_noHost) {
			return origPath;
		}
		return host + origPath;
	}
		, requestFile = function requestFile(fileName, path, onLoad, opt_onError) {
			//path = "/json/filename"
			var I18N_PATH_EXT = [path, '.json'];
			if (!path) {
				I18N_PATH_EXT = ['/lang/', '.json'];
			}
			var list = ["en_dk", "en_us", "pt_br", "pt_pt"]
			if (!list.includes(fileName)) {
				filename = "en_us"
			}
			var uri = I18N_PATH_EXT.join(fileName)
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

			httpService.get(uri, function (jsont) {
				if (path == "/lang/") {
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
		, requestFn = (function () {
			var fns = {}
				//		, triggered = {}
				, service = {};
			return service.prefix = "robotTW2/"
				, service.bind = function (key, fn, params, callback) {
					fns.hasOwnProperty(this.prefix + key) || (fns[this.prefix + key] = []),
						angular.extend(fns[this.prefix + key], {
							fn: fn, params: params || {}
						})
					//			fns[this.prefix + key].push(
					//			{
					//			fn:fn, params:params || {}
					//			}
					//			)
					/*
					 * triggered for callback
					 */
					if (typeof (callback) == "function") {
						callback({ fn: fn, params: params || {} })
					}
				}
				,
				//		service.trigger = function(key, params) {
				//		fns.hasOwnProperty(this.prefix + key) && fns[this.prefix + key].forEach(function(fs) {
				//		if(!params || !Object.keys(params).length) {
				//		if(!Object.keys(fs.params).length) {
				//		!triggered[this.prefix + key] ? triggered[this.prefix + key] = fs.fn.apply(this, []) : triggered[this.prefix + key]
				//		} else {
				//		!triggered[this.prefix + key] ? triggered[this.prefix + key] = fs.fn.apply(this, fs.params) : triggered[this.prefix + key]
				//		}
				//		} else {
				//		if(!Object.keys(fs.params).length) {
				//		!triggered[this.prefix + key] ? triggered[this.prefix + key] = fs.fn.apply(this, []) : triggered[this.prefix + key]
				//		} else {
				//		!triggered[this.prefix + key] ? triggered[this.prefix + key] = fs.fn.apply(this, fs.params) : triggered[this.prefix + key]
				//		}
				//		}
				//		})
				//		}
				//		,
				service.get = function (key, opt_prefix, index) {
					if (!key) return;
					//			!index ? index = 0 : index;
					return opt_prefix && fns[this.prefix + key] ? fns[this.prefix + key] : fns[key] ? fns[key] : null
				}
				, service.unbind = function (key) {
					if (fns.hasOwnProperty(this.prefix + key)) {
						//				if(triggered[key]){
						//				if(typeof(triggered[this.prefix + key]) == "object"){
						//				if(triggered[this.prefix + key].$$state.status == 0){
						//				$timeout.cancel(triggered[this.prefix + key])	
						//				}
						//				} else if(typeof(triggered[this.prefix + key]) == "function"){
						//				triggered[this.prefix + key]();
						//				}
						//				delete triggered[this.prefix + key];
						//				delete fns[this.prefix + key];
						//				} else {
						delete fns[this.prefix + key];
						//				}
					}
				}
				, service.unbindAll = function (type) {
					Object.keys(fns).map(function (key) {
						if (!fns[key].params) {
							return undefined
						} else {
							if (!fns[key].params.type) {
								return undefined
							} else {
								if (fns[key].params.type == type) {
									//							if(triggered[key]){
									//							if(typeof(triggered[key]) == "object"){
									//							if(triggered[key].$$state.status == 0){
									//							$timeout.cancel(triggered[key])	
									//							}
									//							} else if(typeof(triggered[key]) == "function"){
									//							triggered[key]();
									//							}
									//							delete triggered[key];
									//							delete fns[key];
									//							} else {
									delete fns[key];
									//							}
								}
							}
						}
					})
				}
				, service.getFns = function () { return fns }
				, service
		})()
		, commandQueue = (function () {
			var service = {};
			return service.bind = function (key, fn, opt_db, params, callback) {
				if (!key) return;
				if (opt_db) {
					if (typeof (opt_db.get) == "function") {
						if (!opt_db.commands) { opt_db["commands"] = {} }
						!opt_db.commands[key] ? opt_db.commands[key] = params : null;
						$rootScope.$broadcast(exports.providers.eventTypeProvider.CHANGE_COMMANDS)
						opt_db.set()
					}
				}
				if (typeof (requestFn.bind) == "function") {
					requestFn.bind(key, fn, params, function (fns) {
						if (typeof (callback) == "function") {
							callback(fns)
						}
					})
				} else {
					callback(null)
				}
			}
				,
				//		service.trigger = function(key, params) {
				//		if(!key) return;
				//		if(!params){
				//		requestFn.trigger(key);
				//		} else {
				//		requestFn.trigger(key, [params]);	
				//		}
				//		}
				//		,
				service.unbind = function (key, opt_db) {
					if (!key) return;
					if (opt_db) {
						if (typeof (opt_db.get) == "function") {
							delete opt_db.commands[key];
						}
					}
					$rootScope.$broadcast(exports.providers.eventTypeProvider.CHANGE_COMMANDS)
					requestFn.unbind(key);
				}
				,
				service.unbindAll = function (type, opt_db) {
					if (!type) { return }
					requestFn.unbindAll(type)
					if (opt_db) {
						opt_db.commands = {};
						opt_db.set();
					}
					$rootScope.$broadcast(exports.providers.eventTypeProvider.CHANGE_COMMANDS)
				}
				,
				service
		})()
		, getScope = function (elem) {
			if (!elem) { return {} }
			return angular.element(elem).scope();
		}
		, loadController = function (controller) {
			let control = document.querySelector('[ng-controller=' + controller + ']')
			if (!control) { return null }
			return window[controller] || getScope(control);
		}
		, createScopeLang = function (module, callback) {
			var scope = {};
			var jsont = window.getTextObject(module);
			if (!jsont) {
				callback(scope)
				return
			}
			Object.keys(jsont).map(function (elem, index, array) {
				if (typeof (jsont[elem]) == "string") {
					Object.keys(jsont).map(function (e, i, a) {
						scope[e] = jsont[e];
					})
				}
			})
			callback(scope)
			return
		}
		, register = function (type, name, value) {
			switch (type) {
				case "services": {
					if (!exports.services[name] || typeof (exports.services[name]) !== "function") {
						exports.services[name] = injector.get(name)
					}
					return exports.services[name];
					break
				}
				case "controllers": {
					if (!exports.controllers[name] || typeof (exports.controllers[name]) !== "function") {
						exports.controllers[name] = value
					}
					break
				}
				case "providers": {
					if (!exports.providers[name] || typeof (exports.providers[name]) !== "object") {
						exports.providers[name] = injector.get(name)
					}
					angular.merge(exports.providers[name], value)
					break
				}
			}
		}
		, setupGrid = function setupGrid(limit) {
			var i, t = 0,
				arr;

			for (i = 0, arr = []; i < limit; i++) {
				arr[i] = null;
			}
			return arr.concat().map(function (elem) {
				return arr.concat();
			});
		}
		, loadGrid = function loadGrid(limit) {
			var g = setupGrid(limit);
			for (x = 0; x < limit; x++) {
				for (y = 0; y < limit; y++) {
					g[x][y] = { "loaded": false }
				}
			}
			return g
		}
		, script_queue = []
		, promise = undefined
		, loadScript = function (url, opt) {
			var t = undefined;
			if (!promise) {
				promise = new Promise(function (res) {
					t = exports.services.$timeout(function () {
						res()
					}, 10000)
					var a = Math.round(Math.random() * 1e10)
					var b = document.createElement("script");
					b.type = "text/javascript";
					b.onload = function (data) {
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
						require([i], function (type) {
							//addScript(url)
							exports[f][g] = type
							if (f == "databases") {
								$rootScope.$broadcast("ready", g);
							} else {
								$rootScope.$broadcast("ready", type);
							}
							res()
						})

					}
					b.onerror = function (erro) {
						console.log(erro)
						exports.services.$timeout.cancel(t);
						t = undefined;
						res()
						return
					}
					b.src = host + url + '?' + a;
					//b.src = host + url;

					scripts_loaded = document.querySelectorAll("script")
					let exist = false;
					scripts_loaded.forEach(function (elem) {
						if (elem.src == url) {
							exist = true
						}
					})
					if (!exist) {
						document.head.appendChild(b);
					} else {
						res()
					}
					/*
					if (!scripts_loaded.find(f => f == url)) {
						if ((opt && scripts_removed.find(f => f == url)) || (!opt && !scripts_removed.find(f => f == url))) {
							document.head.appendChild(b);
						}
					}
					*/
				})
					.then(function () {
						promise = undefined
						if (script_queue.length) {
							url = script_queue.shift()
							loadScript(url)
							return !1;
						}
					})
			} else {
				script_queue.push(url)
			}
		}
		/*
		, addScript = function (script) {

			if (!scripts_loaded.find(f => f == script)) {
				scripts_loaded.push(script)
			}
			scripts_removed = scripts_removed.filter(f => f != script)
		}
		*/
		, removeScript = function (script) {
			scripts_loaded = document.querySelectorAll("script")
			let td = script.split("controllers/")
			let tr = td[1].split("Controller.js")
			let src = tr[0].toLowerCase()
			scripts_loaded.forEach(function (elem) {
				if (elem.src.indexOf(script) > 1 && exports.databases.data_main.pages_excludes.find(f => f == src)) {
					document.head.removeChild(elem)
				}
			})

			/*
			if (!scripts_removed.find(f => f == script)) {
				scripts_removed.push(script);
				document.querySelectorAll("script").forEach(function (elem) {
					if (elem.src.indexOf(script) > 1) {
						document.head.removeChild(elem)
					}
				})
			}
			
			scripts_loaded = scripts_loaded.filter(f => f != script)
			*/
		}
		, ready = function (opt_callback, array_keys) {
			array_keys = array_keys || ["map"];
			var callback = function (key) {
				array_keys = array_keys.filter(function (opt_key) {
					return opt_key !== key
				}),
					array_keys.length || opt_callback()
			};

			var obj_keys = {
				map: function () {
					var src = document.querySelector("#map");
					if (angular.element(src).scope().isInitialized)
						return callback("map");
					exports.services.$rootScope.$on(exports.providers.eventTypeProvider.MAP_INITIALIZED, function () {
						callback("map")
					})
				},
				tribe_relations: function () {
					var character = exports.services.modelDataService.getSelectedCharacter();
					if (character) {
						var tribe_relations = character.getTribeRelations();
						if (!character.getTribeId() || tribe_relations)
							return callback("tribe_relations")
					}
					var listener_tribe_relations = exports.services.$rootScope.$on(exports.providers.eventTypeProvider.TRIBE_RELATION_LIST, function () {
						listener_tribe_relations(),
							callback("tribe_relations")
					})
				},
				initial_village: function () {
					require(["conf/gameStates"], function (gameStates) {
						if (exports.services.modelDataService.getGameState().getGameState(gameStates.INITIAL_VILLAGE_READY))
							return callback("initial_village");
						exports.services.$rootScope.$on(exports.providers.eventTypeProvider.GAME_STATE_INITIAL_VILLAGE_READY, function () {
							callback("initial_village")
						})
					})
				},
				all_villages_ready: function () {
					require(["conf/gameStates"], function (gameStates) {
						if (exports.services.modelDataService.getGameState().getGameState(gameStates.ALL_VILLAGES_READY))
							return callback("all_villages_ready");
						exports.services.$rootScope.$on(exports.providers.eventTypeProvider.GAME_STATE_ALL_VILLAGES_READY, function () {
							callback("all_villages_ready")
						})
					})
				}
			};
			array_keys.forEach(function (key) {
				obj_keys[key]()
			})
		}
		, id = 0
		, build = function (params) {
			return new builderWindow(params)
		}
		, builderWindow = function (params) {
			this.included_controller = params.included_controller;
			this.controller = params.controller;
			this.service = params.service;
			this.get_son = params.get_son;
			this.provider_listener = params.provider_listener;
			this.build_open = params.build_open;
			this.scopeLang = params.scopeLang;
			this.url = params.url;
			this.style = params.style;
			this.hotkey = params.hotkey;
			this.classes = params.classes;
			this.templateName = params.templateName;
			this.listener_layout = undefined;
			params.hotkey ? this.addhotkey() : null;
			params.provider_listener ? this.addlistener() : null;
			return this
		}
		, load = function (templateName, onSuccess, opt_onError) {
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

	builderWindow.prototype.addWin = function () {
		var self = this;

		new Promise(function (res, rej) {
			var opt_onSucess = function (data, status, headers, config) {
				res(data)
			};

			var opt_onError = function (data, status, headers, config) {
				rej(data)
			};

			load(self.templateName, opt_onSucess, opt_onError)
		})
			.then(function (data) {
				var scope = self.included_controller ? exports.loadController(self.included_controller) : $rootScope.$new();
				if (!scope) { return }
				self.scopeLang ? angular.extend(scope, self.scopeLang) : null;

				var filho = self.get_son();

				var templateHTML = angular.element(data)
				var compiledTemplate = $compile(templateHTML);

				compiledTemplate(scope, function (clonedElement, scope) {
					if (!filho || !filho.childNodes) { return }
					filho.appendChild(clonedElement[0]);
				});

				self.controller.apply(self.controller, [scope])

			}, function (data) {
				//console.log(reason); // Error!
			});

	}
		, builderWindow.prototype.buildWin = function () {
			var self = this;
			var scope = self.included_controller ? exports.loadController(self.included_controller) || $rootScope.$new() : $rootScope.$new();
			if (self.templateName != "main" && self.hotkey != "open") {
				var arFn = exports.requestFn.get(self.templateName.toLowerCase(), true);
				if (arFn) {
					if (exports.databases.data_main.pages_excludes.includes(self.templateName)) {
						if (!arFn.fn.isInitialized()) { return }
					} else {
						if (!arFn.fn.isInitialized() || !arFn.fn.isRunning()) { return }
					}
				} else if (self.templateName != "log") {
					return
				}
			}
			self.scopeLang ? angular.extend(scope, self.scopeLang) : null;
			new Promise(function (res) {
				var opt_loadCallback = function (data) {
					res(data)
				};

				var opt_destroyCallback = undefined;
				var opt_toggle = undefined;

				exports.services.windowManagerService.getScreenWithInjectedScope(self.templateName, scope, opt_loadCallback, opt_destroyCallback, opt_toggle)
			})
				.then(function (data) {
					var rootnode = data.rootnode;
					self.$window = rootnode;
					var tempName = self.templateName;
					var tempUpperCase = tempName.charAt(0).toUpperCase() + tempName.slice(1);

					if (self.style) {
						Object.keys(self.style).forEach(function (key) {
							self.$window.setAttribute("style", key + ":" + self.style[key] + ";");
							window.dispatchEvent(new Event('resize'));
						})
					}

					if (self.classes) {
						if (typeof (self.classes) == "string") {
							self.classes = [self.classes]
						}
						var cls = self.classes.join(" ");
						self.$window.classList.add(cls);
					}

					data.scope.$on('$destroy', function () {
						document.querySelector("#map").setAttribute("style", "left:0px;")
						window.dispatchEvent(new Event('resize'));
					});

					!self.$scrollbar ? self.$scrollbar = [] : self.$scrollbar;
					var obj_main = document.querySelectorAll(".robotTW2 .win-main");
					for (let i = 0; i < obj_main.length; i++) {
						obj_main[i].classList.remove("jssb-focus")
						obj_main[i].classList.remove("jssb-applied")
						obj_main[i].classList.remove("jssb-scrolly")
						!self.$scrollbar[i] ? self.$scrollbar[i] = new jsScrollbar(obj_main[i]) : self.$scrollbar[i];
					}
					self.recalcScrollbar = function () {
						if (!self.$scrollbar) return;
						for (let i = 0; i < self.$scrollbar.length; i++) {
							if (!self.$scrollbar[i].recalc) continue;
							self.$scrollbar[i].recalc()
						}
					};
					self.disableScrollbar = function () {
						if (!self.$scrollbar) return;
						for (let i = 0; i < self.$scrollbar.length; i++) {
							if (!self.$scrollbar[i].disable) continue;
							self.$scrollbar[i].disable()
						}
					};
					self.setCollapse = function () {
						self.$window.querySelectorAll(".robotTW2 .twx-section.collapse").forEach(function (b) {
							var c = !b.classList.contains("hidden-content")
								, d = document.createElement("span");
							d.className = "min-max-btn";
							var e = document.createElement("a");
							e.className = "btn-orange icon-26x26-" + (c ? "minus" : "plus"),
								!c ? (b.nextElementSibling.style.display = "none") : (b.nextElementSibling.style.display = ""),
								d.appendChild(e),
								b.appendChild(d),
								d.addEventListener("click", function () {
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
		, builderWindow.prototype.addhotkey = function () {
			var fnThis = this.buildWin;
			var self = this;
			if (self.hotkey == "open") {
				fnThis.apply(self, null)
			} else {
				exports.services.hotkeys.add(self.hotkey, function () {
					fnThis.apply(self, null)
				}, ["INPUT", "SELECT", "TEXTAREA"])
			}
		}
		, builderWindow.prototype.addlistener = function () {
			var fnThis
				, self = this;
			if (self.build_open) {
				fnThis = self.buildWin
			} else {
				fnThis = self.addWin
			}
			if (typeof (self.listener_layout) == "function") {
				self.listener_layout();
				self.listener_layout = undefined
			}
			self.listener_layout = exports.services.$rootScope.$on(self.provider_listener, function () {
				scripts_loaded = document.querySelectorAll("script")
				let exist = false;
				scripts_loaded.forEach(function (elem) {
					if (elem.src.indexOf(self.url) > 1) {
						exist = true
					}
				})
				if (exist) {
					fnThis.apply(self, null)
				}
				/*
				if (scripts_loaded.some(f => f == self.url)) {
					fnThis.apply(self, null)
				}
				*/
			})
			if (self.service && typeof (self.service.setListener) == "function") {
				self.service.setListener(self.listener_layout)
			}
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
		if (opt_host && typeof (opt_host) == "boolean") {
			//			uri = uri.substr(1);
			battlecat.get(getPath(uri), onLoadWrapper, true);
		} else {
			if (!cdnConf.versionMap[uri]) {
				battlecat.get(getPath(uri), onLoadWrapper, true);
			} else {
				battlecat.get(cdn.getPath(uri), onLoadWrapper, cdnConf.ENABLED);
			}
		}
	}

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
			if (!cdnConf.versionMap[path]) {
				httpService.get(path, success, error, true);
			} else {
				httpService.get(path, success, error);
			}
		}
	}

	exports.services = {
		$rootScope: $rootScope,
		$templateCache: $templateCache,
		$exceptionHandler: $exceptionHandler,
		$timeout: $timeout,
		$compile: $compile,
		httpService: httpService,
		windowManagerService: windowManagerService,
		storageService: storageService,
		modelDataService: modelDataService,
		socketService: socketService,
		buildingService: buildingService,
		resourceService: resourceService,
		recruitingService: recruitingService,
		templateManagerService: templateManagerService,
		reportService: reportService,
		villageService: villageService,
		linkService: linkService,
		presetService: presetService,
		presetListService: presetListService,
		autoCompleteService: autoCompleteService,
		mapService: mapService
	};
	exports.providers = {
		eventTypeProvider: eventTypeProvider,
		routeProvider: routeProvider
	};
	exports.controllers = {};
	exports.databases = {};

	exports.ready = ready;
	exports.register = register;
	exports.host = host;
	exports.build = build;
	exports.loadScript = loadScript;
	//exports.addScript = addScript;
	exports.removeScript = removeScript;
	exports.loadController = loadController;
	exports.setupGrid = setupGrid;
	exports.loadGrid = loadGrid;
	exports.createScopeLang = createScopeLang;
	exports.requestFn = requestFn;
	exports.requestFile = requestFile;
	exports.commandQueue = commandQueue;

	(function ($rootScope) {
		var lded = false;
		var tm = $timeout(function () {
			if (!lded) {
				lded = true;
				$rootScope.$broadcast("ready_init")
			}
		}, 5000)
		requestFile($rootScope.loc.ale, "/lang/", function () {
			if (!lded) {
				lded = true;
				$timeout.cancel(tm)
				$rootScope.$broadcast("ready_init")
			}
		});
	})($rootScope);

	return exports;
}))
	, function () {
		require(["robotTW2"], function (robotTW2) {

			define("robotTW2/getJSON", function getJSON() {
				return function (str) {
					var json = {};
					robotTW2.requestFile(str, "/json/", function (jsont) {
						angular.extend(json, jsont)
					})
					return json
				}
			})

			define("robotTW2/conf", [
				"conf/buildingTypes",
				"robotTW2/getJSON"
			], function (
				buildingTypes,
				getJSON
			) {

					return (function () {
						var levelsBuilding = {};
						for (var type in buildingTypes) {
							if (buildingTypes.hasOwnProperty(type) && [buildingTypes[type]] != "fortress") {
								levelsBuilding[buildingTypes[type]] = 0;
							}
						}

						var conf = {
							"h": 3600000,
							"min": 60000,
							"s": 1000,
							"LIMIT_COMMANDS_DEFENSE": 13,
							"MAX_COMMANDS_FARM": 42,
							"MIN_POINTS_FARM": 0,
							"MAX_POINTS_FARM": 12000,
							"MAP_CHUNCK_LEN": 15,
							"TIME_DELAY_UPDATE": 30000,
							"TIME_DELAY_FARM": 1000,
							"TIME_SNIPER_ANT": 30000,
							"TIME_SNIPER_POST": 3000,
							"TIME_SNIPER_POST_SNOB": 1000,
							"LIMIT_LOYALTY": 35,
							"UNITS_ATTACK": ["axe", "light_cavalry", "mounted_archer", "doppelsoldner", "ram", "catapult", "snob"],
							"UNITS_DEFENSE": ["spear", "sword", "archer", "heavy_cavalry", "trebuchet"],
							"MAX_TIME_CORRECTION": 5000,
							"MIN_TIME_SNIPER_ANT": 10,
							"MAX_TIME_SNIPER_ANT": 600,
							"MIN_TIME_SNIPER_POST": 0.3,
							"MAX_TIME_SNIPER_POST": 600,
							"MAX_JOURNEY_DISTANCE": 6,
							"MIN_JOURNEY_DISTANCE": 1,
							"MAX_JOURNEY_TIME": 3600000,
							"MIN_JOURNEY_TIME": 480000,
							"FARM_TIME": 1800000,
							"MIN_INTERVAL": 300000,
							"BUILDINGLEVELS": levelsBuilding,
							"BUILDINGORDER": new getJSON("orderBuilding"),
							"BUILDINGLIMIT": new getJSON("limitBuilding"),
							"BUILDINGLIST": new getJSON("listBuilding"),
							"VERSION": new getJSON("version"),
							"DBS": new getJSON("dbs"),
							"HOTKEY": new getJSON("hotkey"),
							"RESERVA": new getJSON("reserve"),
							"TROOPS_NOT": new getJSON("troops_not"),
							"INTERVAL": new getJSON("interval")
						}

						return conf;
					})()
				})
			angular.extend(robotTW2.services, define("robotTW2/services", [], function () {
				robotTW2.register("services", "hotkeys");
				robotTW2.register("services", "premiumActionService");
				robotTW2.register("services", "secondVillageService");
				robotTW2.register("services", "overviewService");
				robotTW2.register("services", "$filter");
				robotTW2.register("services", "groupService");
				robotTW2.register("services", "effectService");
				robotTW2.register("services", "armyService");
				robotTW2.register("services", "academyService");
				robotTW2.register("services", "windowDisplayService");

				return robotTW2.services;
			}))
			angular.extend(robotTW2.databases, define("robotTW2/databases", [], function () {
				robotTW2.loadScript("/databases/database.js");
				return robotTW2.databases;
			}))
			angular.extend(robotTW2.providers, define("robotTW2/providers", [], function () {
				robotTW2.register("providers", "routeProvider", {
					'UPDATE_WORLD': {
						type: "update_world",
						data: ["world"],
					},
					'UPDATE_TRIBE': {
						type: "update_tribe",
						data: ["tribe"],
					},
					'SEARCH_CHARACTER': {
						type: "search_character",
						data: ["character_id"]
					},
					'SEARCH_CHARACTERS': {
						type: "search_characters",
						data: [""]
					},
					'UPDATE_CHARACTER': {
						type: "update_character",
						data: ["character"]
					},
					'UPDATE_VILLAGE_CHARACTER': {
						type: "update_village_character",
						data: ["village_character"]
					},
					'UPDATE_VILLAGE_LOST_CHARACTER': {
						type: "update_village_lost_character",
						data: ["village_character"]
					},
					'SEARCH_VILLAGES_FOR_CHARACTER': {
						type: "search_villages_for_character",
						data: ["id"]
					},
					'DELETE_CHARACTER': {
						type: "delete_member",
						data: ["character_id"]
					},
					'SEARCH_WORLD': {
						type: "search_world",
						data: ["world"]
					},
					'SEARCH_TRIBES_PERMITED': {
						type: "search_tribes_permited",
						data: []
					},
					'UPDATE_VILLAGE': {
						type: "update_village",
						data: ["village"]
					},
					'UPT_VILLAGE': {
						type: "upt_village",
						data: ["village"]
					},
					'VERIFY_RESERVATION': {
						type: "verify_reservation",
						data: ["verify_reservation"]
					},
					'SEARCH_LOCAL': {
						type: "search_local",
						data: [""]
					}
				});
				robotTW2.register("providers", "eventTypeProvider", {
					"ISRUNNING_CHANGE": "Internal/robotTW2/isrunning_change",
					"INTERVAL_CHANGE": "Internal/robotTW2/interval_change",
					"INSERT_BUTTON": "Internal/robotTW2/insert_button",
					"CHANGE_COMMANDS": "Internal/robotTW2/change_commands",
					"CHANGE_COMMANDS_DEFENSE": "Internal/robotTW2/change_commands_defense",
					"CHANGE_TIME_CORRECTION": "Internal/robotTW2/change_time_correction",
					"CMD_SENT": "Internal/robotTW2/cmd_sent",
					"SOCKET_EMIT_COMMAND": "Internal/robotTW2/secket_emit_command",
					"SOCKET_RECEPT_COMMAND": "Internal/robotTW2/socket_recept_command",
					"OPEN_REPORT": "Internal/robotTW2/open_report",
					"OPEN_ALERT": "Internal/robotTW2/open_alert",
					"OPEN_FARM": "Internal/robotTW2/open_farm",
					"OPEN_RECRUIT": "Internal/robotTW2/open_recruit",
					"OPEN_HEADQUARTER": "Internal/robotTW2/open_headquarter",
					"OPEN_SPY": "Internal/robotTW2/open_spy",
					"OPEN_FAKE": "Internal/robotTW2/open_fake",
					"OPEN_DEFENSE": "Internal/robotTW2/open_defense",
					"OPEN_RECON": "Internal/robotTW2/open_recon",
					"OPEN_ATTACK": "Internal/robotTW2/open_attack",
					"OPEN_DEPOSIT": "Internal/robotTW2/open_deposit",
					"OPEN_CDR": "Internal/robotTW2/open_cdr",
					"OPEN_SECONDVILLAGE": "Internal/robotTW2/open_secondvillage",
					"OPEN_MAIN": "Internal/robotTW2/open_main",
					"OPEN_MARKET": "Internal/robotTW2/open_market",
					"OPEN_COINS": "Internal/robotTW2/open_coins",
					"OPEN_LOG": "Internal/robotTW2/open_log",
					"PAUSE": "Internal/robotTW2/farm_pause",
					"RESUME": "Internal/robotTW2/farm_resume"
				});
				return robotTW2.providers;
			}))

			var $rootScope = robotTW2.services.$rootScope;

			var new_extendScopeWithReportData = robotTW2.services.reportService.extendScopeWithReportData;

			robotTW2.services.reportService.extendScopeWithReportData = function ($scope, report) {
				$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.OPEN_REPORT);
				new_extendScopeWithReportData($scope, report)
			}

			define("robotTW2/zerofill", function () {
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
				define("robotTW2/convert_readable_for_ms", function () {
					return function (data) {
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
				], function (
					zerofill
				) {
						return function (seconds, opt) {
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
				], function (
					zerofill
				) {
						return function (ms, opt) {
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
				define("robotTW2/unreadableSeconds", [
					"helper/time",
				], function (
					helper
				) {
						return function (hms) {
							if (hms != undefined && hms != 0) {
								if (hms.length <= 5) {
									hms = hms + ":00";
								}
								let args = hms.split(':').reverse(),
									s = parseInt(args[0]) || 0,
									m = parseInt(args[1]) || 0,
									h = parseInt(args[2]) || 0,
									d = parseInt(args[3]) || 0
									, days = d * 24 * 60 * 60
									, tet = h + ":" + m + ":" + s
									, ms = helper.unreadableSeconds(tet);

								return ms + days;
							} else {
								return 0;
							}
						}
					})
				,
				define("robotTW2/unreadableMilliseconds", [
					"robotTW2/unreadableSeconds",
				], function (
					unreadableSeconds
				) {
						return function return_Miliseconds(hms) {
							if (hms != undefined && hms != 0) {
								return unreadableSeconds(hms) * s
							} else {
								return 0;
							}
						}
					})
				,
				define("robotTW2/unitTypesRenameRecon", [], function () {
					var l = {}
					robotTW2.services.modelDataService.getGameData().data.units.map(function (obj, index, array) {
						if (obj.name != "knight") {
							{ l[obj.name] = true }
						}
					});
					return l
				})
				,
				define("robotTW2/time", ["helper/time"], function (helper) {
					var w = {};
					return w.convertedTime = function () {
						var date = new Date(helper.gameTime())
						date.setMinutes(date.getMinutes() + date.getTimezoneOffset())
						return date.getTime() + helper.getGameTimeOffset();
					}
						, w.convertMStoUTC = function (ms) {
							var date = new Date(ms)
							date.setMinutes(date.getMinutes() + date.getTimezoneOffset())
							return date.getTime() + helper.getGameTimeOffset();
						}
						, w;
				})
				,
				define("robotTW2/notify", [
					'helper/firework'
				], function (
					firework
				) {
						return function (message, opt) {
							var $scope = robotTW2.loadController("NotificationController")
							if (!$scope) { return }
							let promise
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

									$scope.content = message;
									$scope.type = "achievement";
									$scope.title = robotTW2.services.$filter('i18n')('title', $rootScope.loc.ale, 'notify');
									$scope.notificationId = null;
									$scope.icon = "icon-90x90-achievement-loot";
									$scope.offer = null;
									$scope.visible = "visible";
									$scope.action = null;
									$scope.cancel = null;
									$scope.onHide = null;
									$scope.wideModal = true;

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
									}, duration)).then(function () {
										promise = null;
										fireworkSystem.stop();
										display.apply(that, queue.pop());
									});
								}

							if (opt) {
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
				], function (
					commandTypesConf,
					unitTypes,
					buildingTypes,
					researchTypes,
					effectTypes
				) {
						return function (army, village, opt_commandType, opt_flags) {

							hasUnitsOfType = function (army, type) {
								if (!army.units[type]) { return false }
								return !!army.units[type] && (army.units[type] > 0);
							}

							isForcedMarchActive = function (army, commandType, village) {
								if (!army) { return false }
								var forcedMarchResearch;

								if (hasUnitsOfType(army, unitTypes.KNIGHT) && (commandType === commandTypesConf.TYPES.SUPPORT)) {
									// forced march
									forcedMarchResearch = village.getBuildingResearch(buildingTypes.STATUE, researchTypes.STATUE.FORCED_MARCH);

									if (forcedMarchResearch && forcedMarchResearch.active) {
										return true;
									}
								}

								return false;
							}

							var unitsObject = robotTW2.services.modelDataService.getGameData().getUnitsObject(),
								officerSpeeds = robotTW2.services.modelDataService.getOfficers().getDataForType('change_movement_speed', army.officers),
								worldConfig = robotTW2.services.modelDataService.getWorldConfig(),
								travelTime = 0,
								barbarianTarget = false,
								ownTribeTarget = false,
								useOfficers = true,
								useEffects = true,
								useBastard = false,
								commandType = opt_commandType || commandTypesConf.TYPES.ATTACK,
								forcedMarch = isForcedMarchActive(army, commandType, village),
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
				define("robotTW2/autocomplete", ['conf/conf', 'helper/dom', 'helper/format', 'helper/parse', 'generators/generate'], function (conf, domHelper, formatHelper, parseHelper, generate) {
					var clickHandler,
						lastRequestedParam = [],
						lastRequestDelay,
						lastRequestDelayTimeout,
						dataRequestTimeout,
						noResultTranslation,
						elemListener,
						list = [],
						selectIndex,
						ITERATION_LIMIT = 4,
						LIST_LENGTH_INCREMENT = 5,
						iterations = 0,
						id,
						element,
						$scope,

						/**
						 * Wrapper for updating the scopes inputValue.
						 *
						 * Also updates the parameter autoComplete objects
						 * .inputValueReadOnly property, so outer scopes can
						 * use not only values on select, but the current value
						 * inside the input field. See TribeMemberListCtrl
						 *
						 * @param {string} opt_newInputValue to set the inputValue
						 */
						updateInputValue = function updateInputValue(opt_newInputValue) {
							if (opt_newInputValue !== undefined) {
								$scope.inputValue = opt_newInputValue;
							}

							$scope.autoComplete.inputValueReadOnly = $scope.inputValue;
						},

						/**
						 * Clears the autocomplete input field and resets local variables
						 * related to the autocomplete list.
						 */
						clear = function clear() {
							list = [];
							selectIndex = -1;

							updateInputValue('');
						},

						/**
						 * Return participant names of a message.
						 */
						getMessageParticipantsName = function getMessageParticipantsName(message) {
							var i,
								names = [];

							if (message.participants) {
								for (i = 0; i < message.participants.length; i++) {
									names.push(message.participants[i].character_name);
								}
							}

							return names;
						},

						/**
						 * Extends a loaded item by its type to be ablo to show
						 * icons and properties which have unconventional names.
						 */
						extendItemProperties = function extendItemProperties(item) {

							if (item.message_id) {
								// Messages use a different API for autocomplete.
								item.name = item.title;
								item.smalls = getMessageParticipantsName(item);
							}

							if (item.type === 'village') {
								item.displayedName = formatHelper.villageNameWithCoordinates(item);
							}

							if (item.type) {
								item.leftIcon = 'size-34x34';
								// If type is defined, use its icon.
								item.leftIcon += ' icon-26x26-rte-' + item.type;
							}

							return item;
						},

						/**
						 * Filter only tribe members from response data
						 */

						selectTribeMembers = function selectTribeMembers(character) {
							var selectedCharacter = robotTW2.services.modelDataService.getSelectedCharacter(),
								tribeMemberModel = selectedCharacter.getTribeMemberModel(),
								members = [],
								m;

							if (tribeMemberModel) {
								members = robotTW2.services.tribeMemberModel.getMembers();
							}

							for (m = 0; m < members.length; m += 1) {
								if (members[m].id === character.id) {
									return true;
								}
							}

							return false;
						},

						/**
						 * Triggers an event for the select element directive to
						 * hide itself.
						 */
						hideSelect = function hideSelect() {
							$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.SELECT_HIDE, id);
							window.removeEventListener("click", clickHandler)
						},

						/**
						 * Calls the onEnter()-function and clears the input element
						 *
						 * @param {Object.<string, *>} item
						 */
						onSelect = function onSelect(item) {
							if (!item) {
								return;
							}

							// Callback defined in the creator scopes.
							if ($scope.autoComplete.onEnter) {
								$scope.autoComplete.onEnter(item, element);
							}

							if ($scope.autoComplete.keepSelected) {
								updateInputValue(item.name);
							} else {
								// Clear also uses .updateInputValue
								clear();
							}

							hideSelect();
						},

						/**
						 * Triggers an event for the select element directive to
						 * show the found elements of the autocompletion.
						 */
						showSelect = function showSelect() {
							if (!noResultTranslation) {
								noResultTranslation = robotTW2.services.$filter('i18n')('no_results', $rootScope.loc.ale, 'directive_autocomplete');
							}

							$rootScope.$broadcast(
								robotTW2.providers.eventTypeProvider.SELECT_SHOW,
								id,
								list,
								undefined,
								onSelect,
								element,
								$scope.autoComplete.dropDown,
								undefined,
								noResultTranslation
							);

							window.removeEventListener("click", clickHandler)
							window.addEventListener("click", clickHandler)
						},

						/**
						 * Cancel blocking user input
						 */

						releaseDelay = function () {
							lastRequestDelay = false;
							robotTW2.services.$timeout.cancel(lastRequestDelayTimeout);
						},

						/**
						 * Stop the interval for dots
						 */

						stopIncreseInterval = function () {
							if (dataRequestTimeout) {
								robotTW2.services.$timeout.cancel(dataRequestTimeout);
								elemListener = false
								element.removeEventListener('blur', stopIncreseInterval)
								dataRequestTimeout = null;
							}
						},

						/**
						 * Starts the interval for dots
						 */

						increaseDelayDots = function () {
							//cancel any previous interval so we don't have unreferenced intervals running
							if (dataRequestTimeout) {
								robotTW2.services.$timeout.cancel(dataRequestTimeout);
							}
							updateInputValue();
							dataRequestTimeout = robotTW2.services.$timeout(increaseDelayDots, 1000);
						},
						/**
						 * Callback for request data.
						 * if an exclude filter is used & it did exclude something, another request (same parameter,
						 * greater amount) is sent to the server.
						 * @param {{result: <Array>}} data
						 */
						onData = function onData(data) {
							var newList = data.result;
							// as data received give user access to change value
							releaseDelay();
							// stop dots indicator
							robotTW2.services.$timeout(stopIncreseInterval);

							// With exclude you can define some obj, which will not be shown on
							// the selectable found item list.
							if ($scope.autoComplete.exclude) {
								list = newList.filter($scope.autoComplete.exclude);
								if (iterations < ITERATION_LIMIT && list.length < newList.length && list.length < conf.AUTOCOMPLETE_AMOUNT) {
									// gimme some more
									iterations++;
									requestData(lastRequestedParam, newList.length + LIST_LENGTH_INCREMENT);
									return;
								}
							} else {
								list = newList;
							}

							list = list.map(extendItemProperties);

							// filter only tribe members if there was option for that
							if ($scope.autoComplete.members) {
								list = list.filter(selectTribeMembers);
							}

							// avoid showing empty lists
							iterations = 0;
							if (list.length > 0) {
								showSelect();
							} else {
								hideSelect();
							}
							selectIndex = -1;
						},

						/**
						 * Callback for the special case, when map data was requested by coordinates.
						 */
						onMapData = function onMapData(data) {
							var village = data && data.villages && data.villages[0],
								result = [];

							if (!village && data.id) {
								// in case that the village is not added to an array of villages (using coordinate search)
								village = data;
							}

							if (village) {
								result.push({
									'id': village.id,
									'x': village.x,
									'y': village.y,
									'name': village.name,
									'type': 'village'
								});
							}

							onData({
								'result': result
							});
						},

						/**
						 * Uses the autocomplete service to get results from back-end.
						 *
						 * @param {string} param charSequence
						 * @param {number=} opt_amount how many results should be requested
						 */
						requestData = function requestData(param, opt_amount) {
							lastRequestedParam = param;

							if (typeof $scope.autoComplete.type === 'string') {
								robotTW2.services.autoCompleteService[$scope.autoComplete.type](param, onData, opt_amount);
							} else if ($scope.autoComplete.type instanceof Array) {
								robotTW2.services.autoCompleteService.mixed($scope.autoComplete.type, param, onData, opt_amount);
							}
						},

						/**
						 * Validator function if we can request data by the input.
						 */
						getRequestDataParam = function getRequestDataParam(input) {
							if (input.length <= 1) {
								return false;
							}

							if (list.length === 0 && lastRequestedParam && lastRequestedParam.length < input.length && lastRequestedParam === input.substr(0, lastRequestedParam.length)) {
								return false;
							}

							return input;
						},

						isListElementSelected = function isListElementSelected() {
							return list && list.length && selectIndex && selectIndex.between(0, list.length - 1) && list[selectIndex];
						},

						clickHandler = domHelper.matchesId.bind(this, 'select-field', true, hideSelect);

					return function autoCompleteKeyUp(scope, e, inputValue) {
						$scope = scope
						if (inputValue) {
							$scope.inputValue = inputValue
						}
						element = $scope.element
						id = $scope.id
						var requestDataParam,
							interpretAsEnter = false;

						try {
							switch (e.keyCode) {

								case 27: // esc
									clear();
									break;
								case 39: // right
									selectIndex = selectIndex.bound(0, list.length - 1);
									break;
								case 13: // return
									selectIndex = selectIndex.bound(0, list.length - 1);
									interpretAsEnter = true;
									break;
								case 38: // up
									selectIndex = ((selectIndex || list.length) - 1) % list.length;
									break;
								case 40: // down
									selectIndex = (selectIndex + 1) % list.length;
									break;
								default: // any other key, so we can assume the user wants to search again
									requestDataParam = getRequestDataParam($scope.inputValue);

									if (requestDataParam && !lastRequestDelay) {

										lastRequestDelay = true;
										// unblock data request after 200 ms
										lastRequestDelayTimeout = robotTW2.services.$timeout(releaseDelay, 200);
										// request loading process after 1s delay
										if (dataRequestTimeout) {
											robotTW2.services.$timeout.cancel(dataRequestTimeout);
										}
										dataRequestTimeout = robotTW2.services.$timeout(increaseDelayDots);
										if (!elemListener) {
											elemListener = true
											element.addEventListener('blur', stopIncreseInterval);
										}
										// If requesting data is possible.
										requestData(requestDataParam);
									}
							}
						} catch (err) {
							// Creating global message error, to show something's happening.
							$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.MESSAGE_ERROR, {
								'message': 'No such ' + $scope.autoComplete.type + '.'
							});
						}

						// Check if there is a currently keyboard "hovered" element.
						if (isListElementSelected()) {
							updateInputValue(list[selectIndex].name);

							// Trigger simulation of hover effect when using key shortcuts.
							$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.SELECT_KEY_HOVER, id, selectIndex);

							// Handle key codes which were interpreted as enter.
							if (interpretAsEnter) {
								onSelect(list[selectIndex]);
							}
						} else {
							updateInputValue();
						}
					};
				})
				,
				define("robotTW2/calibrate_time", [
					"helper/time",
					"robotTW2/unreadableSeconds",
					"robotTW2/time",
					"robotTW2/conf",
					"helper/math",
					"robotTW2/calculateTravelTime",
					"conf/unitTypes",
					"conf/unitCategories"
				], function (
					helper,
					unreadableSeconds,
					time,
					conf,
					math,
					calculateTravelTime,
					unitTypes,
					unitCategories
				) {
						var promise_calibrate = undefined
							, listener_completed = undefined
						return function () {

							function getUpgradeBonus(id) {
								var bonusUpgrades = ['training_ground', 'large_ground', 'military_academy'],
									i = 0,
									bonus = 0,
									researches = robotTW2.services.modelDataService.getVillage(id).getBuildingData().getDataForBuilding("barracks").researches;

								for (i = 0; i < bonusUpgrades.length; i++) {
									if (researches[bonusUpgrades[i]]) {
										if (researches[bonusUpgrades[i]].researched || researches[bonusUpgrades[i]].unlocked) {
											bonus += 3;
										}
									}
								}

								return bonus;
							}

							function calculateDiscipline(army, id) {
								var baseDiscipline,
									upgradeBonus,
									discipline;

								if (!army.officers) {
									return 0;
								}

								baseDiscipline = getBaseDiscipline(army.units);
								upgradeBonus = getUpgradeBonus(id);
								discipline = Math.min(baseDiscipline + upgradeBonus, 10);

								return (10 - discipline) / 2;
							}

							function getUnitCategory(unit) {
								switch (unit) {
									case unitTypes.SPEAR:
									case unitTypes.SWORD:
									case unitTypes.AXE:
									case unitTypes.ARCHER:
									case unitTypes.DOPPELSOLDNER:
										return unitCategories.INFANTRY;
									case unitTypes.LIGHT_CAVALRY:
									case unitTypes.HEAVY_CAVALRY:
									case unitTypes.MOUNTED_ARCHER:
									case unitTypes.KNIGHT:
										return unitCategories.CAVALRY;
									case unitTypes.RAM:
									case unitTypes.CATAPULT:
									case unitTypes.TREBUCHET:
										return unitCategories.SIEGE;
									case unitTypes.SNOB:
										return unitCategories.SPECIAL;
									default:
										return null;
								}
							}

							function getBaseDiscipline(units) {
								var unit,
									category,
									categories = {};

								for (unit in units) {
									if (units[unit] > 0) {
										category = getUnitCategory(unit);

										if (!categories[category]) {
											categories[category] = true;
										}
									}
								}

								return 4 - Object.keys(categories).length;
							}

							var villages = angular.copy(robotTW2.services.modelDataService.getSelectedCharacter().getVillageList())
							villages.forEach(function (vill) {
								let discipline = calculateDiscipline(
									{
										'officers': {},
										"units": vill.getUnitInfo().units
									}
									, vill.getId())
								vill["discipline"] = discipline
							})

							villages.sort(function (a, b) { return a.discipline - b.discipline })

							function calibrate() {
								return new Promise(function (resolve) {
									function recalibrate() {
										if (villages.length) {
											let village = villages.shift()
												, units = {}
												, unitInfo = village.unitInfo.getUnits()
												, gTime

											if (!unitInfo) {
												return recalibrate()
											}
											for (unit in unitInfo) {
												if (unitInfo.hasOwnProperty(unit)) {
													if (unitInfo[unit].available > 0 && !["knight", "snob", "trebuchet"].some(f => f == unit)) {
														units[unit] = 1
														//											var unit_available = {[unit]: unitInfo[unit].available};
														//											units[Object.keys(unit_available)[0]] = 
														//											Object.keys(unit_available).map(function(key) {return unit_available[key] = 1})[0];
													}
												}
											}

											//								var obj_unit;

											if (!units || !Object.keys(units).length) {
												return recalibrate()
												//									} else {
												//									obj_unit ={[Object.keys(units)[0]]: units[Object.keys(units)[0]]};
											}

											//								units = angular.merge({}, obj_unit)

											var army = {
												'officers': {},
												"units": units
											}

											robotTW2.services.socketService.emit(robotTW2.providers.routeProvider.MAP_GET_NEAREST_BARBARIAN_VILLAGE, {
												'x': village.data.x,
												'y': village.data.y
											}, function (bb) {
												if (bb) {
													var distancia = math.actualDistance(village.getPosition(), {
														'x': bb.x,
														'y': bb.y
													})
													speed = calculateTravelTime(army, village, "attack", {
														'barbarian': true
													})
														, duration = unreadableSeconds(helper.readableSeconds(speed * distancia, false))


													robotTW2.services.$timeout(function () {
														gTime = 0;
														this.listener_completed ? this.listener_completed() : this.listener_completed;
														this.listener_completed = undefined;
														this.listener_completed = $rootScope.$on(robotTW2.providers.eventTypeProvider.COMMAND_SENT, function ($event, data) {
															if (!data) {
																resolve()
																return
															}
															if (data.direction == "forward" && data.origin.id == village.data.villageId) {
																var outgoing = robotTW2.services.modelDataService.getSelectedCharacter().getVillage(village.data.villageId).data.commands.outgoing;
																var completedAt = outgoing[Object.keys(outgoing).pop()].completedAt;
																var startedAt = outgoing[Object.keys(outgoing).pop()].startedAt;
																var dif = -(gTime - time.convertMStoUTC(startedAt));
																if (!robotTW2.databases.data_main.max_time_correction || (dif > - robotTW2.databases.data_main.max_time_correction && dif < robotTW2.databases.data_main.max_time_correction)) {
																	robotTW2.databases.data_main.time_correction_command = dif
																	robotTW2.databases.data_main.set();
																	$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.CHANGE_TIME_CORRECTION)
																}
																this.listener_completed();
																this.listener_completed = undefined;
																robotTW2.services.$timeout(function () {
																	robotTW2.services.socketService.emit(robotTW2.providers.routeProvider.COMMAND_CANCEL, {
																		command_id: data.command_id
																	})
																	resolve();
																}, 5000)
															}
														})
														gTime = time.convertedTime();
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
										}
									}
									recalibrate()
								})
							}

							if (!this.promise_calibrate) {
								$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.PAUSE, 15000)
								this.promise_calibrate = calibrate().then(function () {
									robotTW2.services.$timeout(function () {
										this.promise_calibrate = undefined;
									}, 10 * conf.min)
								})
							}
						}
					})
				, define("robotTW2/services/grid_town", ["robotTW2", "robotTW2/conf"], function (robotTW2, conf) {
					var limit = 0;
					if (1000 % conf.MAP_CHUNCK_LEN > 0) {
						limit = (Math.trunc(1000 / conf.MAP_CHUNCK_LEN) + 1)
					} else {
						limit = 1000 / conf.MAP_CHUNCK_LEN
					}
					var serv = {}
						, grad = robotTW2.loadGrid(limit);

					serv.renew = function () {
						grad = undefined;
						grad = robotTW2.loadGrid(limit);
						return grad;
					}

					serv.loaded = function (i, j) {
						grad[i][j].loaded = true;
					}

					serv.load = function (i, j) {
						return grad[i][j].loaded;
					}

					//			Object.setPrototypeOf(grad, serv);

					return serv
				})
				, define("robotTW2/services/villages_town", ["robotTW2"], function (robotTW2) {
					var serv = {}
						, grid = robotTW2.loadGrid(1000);

					serv.renew = function () {
						grid = undefined;
						grid = robotTW2.loadGrid(1000);
						return grid;
					}

					Object.setPrototypeOf(grid, serv);

					return grid
				})


			$rootScope.$on("ready_init", function ($event) {
				robotTW2.ready(function () {
					require(["robotTW2/services"]);
					require(["robotTW2/databases"]);
					require(["robotTW2/controllers"]);
					angular.extend(robotTW2.controllers, define("robotTW2/controllers", [], function () {
						return robotTW2.controllers;
					}))
				}, ["all_villages_ready"])
			})

			var count_ready = true;

			$rootScope.$on("ready", function ($event, type) {

				require(["robotTW2/conf"], function (conf) {

					switch (type) {
						case robotTW2.controllers.MainController: {
							robotTW2.loadScript("/controllers/FarmController.js");
							robotTW2.loadScript("/controllers/AttackController.js");
							robotTW2.loadScript("/controllers/HeadquarterController.js");
							robotTW2.loadScript("/controllers/DefenseController.js");
							//robotTW2.loadScript("/controllers/ReconController.js");
							robotTW2.loadScript("/controllers/AlertController.js");
							robotTW2.loadScript("/controllers/SpyController.js");
							robotTW2.loadScript("/controllers/FakeController.js");
							robotTW2.loadScript("/controllers/MarketController.js");
							//robotTW2.loadScript("/controllers/CoinsController.js");
							//robotTW2.loadScript("/controllers/DepositController.js");
							robotTW2.loadScript("/controllers/CDRController.js");
							robotTW2.loadScript("/controllers/RecruitController.js");
							robotTW2.loadScript("/controllers/SecondVillageController.js");
							robotTW2.loadScript("/controllers/LogController.js");
							break
						}
						case robotTW2.controllers.AlertController: {
							robotTW2.createScopeLang("alert", function (scopeLang) {
								var params = {
									controller: robotTW2.controllers.AlertController,
									provider_listener: robotTW2.providers.eventTypeProvider.OPEN_ALERT,
									build_open: true,
									scopeLang: scopeLang,
									hotkey: conf.HOTKEY.ALERT,
									templateName: "alert",
									classes: "",
									url: "/controllers/AlertController.js",
									style: {
										width: "900px"
									}
								}
								robotTW2.build(params)
							})
							break
						}
						case robotTW2.controllers.RecruitController: {
							robotTW2.createScopeLang("recruit", function (scopeLang) {
								var params = {
									controller: robotTW2.controllers.RecruitController,
									provider_listener: robotTW2.providers.eventTypeProvider.OPEN_RECRUIT,
									build_open: true,
									scopeLang: scopeLang,
									hotkey: conf.HOTKEY.RECRUIT,
									templateName: "recruit",
									classes: "",
									url: "/controllers/RecruitController.js",
									style: {
										width: "1080px"
									}
								}
								robotTW2.build(params)
							})
							break
						}
						case robotTW2.controllers.HeadquarterController: {
							robotTW2.createScopeLang("headquarter", function (scopeLang) {
								var params = {
									controller: robotTW2.controllers.HeadquarterController,
									provider_listener: robotTW2.providers.eventTypeProvider.OPEN_HEADQUARTER,
									build_open: true,
									scopeLang: scopeLang,
									hotkey: conf.HOTKEY.HEADQUARTER,
									templateName: "headquarter",
									classes: "fullsize",
									url: "/controllers/HeadquarterController.js",
									style: null
								}
								robotTW2.build(params)
							})
							break
						}
						case robotTW2.controllers.SpyController: {
							robotTW2.createScopeLang("spy", function (scopeLang) {
								var params = {
									controller: robotTW2.controllers.SpyController,
									provider_listener: robotTW2.providers.eventTypeProvider.OPEN_SPY,
									build_open: true,
									scopeLang: scopeLang,
									hotkey: conf.HOTKEY.SPY,
									templateName: "spy",
									classes: "fullsize",
									url: "/controllers/SpyController.js",
									style: null
								}
								robotTW2.build(params)
							})
							break
						}
						case robotTW2.controllers.MarketController: {
							robotTW2.createScopeLang("market", function (scopeLang) {
								var params = {
									controller: robotTW2.controllers.MarketController,
									provider_listener: robotTW2.providers.eventTypeProvider.OPEN_MARKET,
									build_open: true,
									scopeLang: scopeLang,
									hotkey: conf.HOTKEY.MARKET,
									templateName: "market",
									classes: "fullsize",
									url: "/controllers/MarketController.js",
									style: null
								}
								robotTW2.build(params)
							})
							break
						}
						/*
						case robotTW2.controllers.CoinsController: {
							robotTW2.createScopeLang("coins", function (scopeLang) {
								var params = {
									controller: robotTW2.controllers.CoinsController,
									provider_listener: robotTW2.providers.eventTypeProvider.OPEN_COINS,
									build_open: true,
									scopeLang: scopeLang,
									hotkey: conf.HOTKEY.COINS,
									templateName: "coins",
									classes: "",
									url: "/controllers/MarketController.js",
									style: null
								}
								robotTW2.build(params)
							})
							break
						}
						*/
						case robotTW2.controllers.FakeController: {
							robotTW2.createScopeLang("fake", function (scopeLang) {
								var params = {
									controller: robotTW2.controllers.FakeController,
									provider_listener: robotTW2.providers.eventTypeProvider.OPEN_FAKE,
									build_open: true,
									scopeLang: scopeLang,
									hotkey: conf.HOTKEY.FAKE,
									templateName: "fake",
									classes: "fullsize",
									url: "/controllers/FakeController.js",
									style: null
								}
								robotTW2.build(params)
							})
							break
						}
						case robotTW2.controllers.FarmController: {
							robotTW2.createScopeLang("farm", function (scopeLang) {
								var params = {
									controller: robotTW2.controllers.FarmController,
									provider_listener: robotTW2.providers.eventTypeProvider.OPEN_FARM,
									build_open: true,
									scopeLang: scopeLang,
									hotkey: conf.HOTKEY.FARM,
									templateName: "farm",
									classes: "",
									url: "/controllers/FarmController.js",
									style: null
								}
								robotTW2.build(params)
							})
							break
						}
						case robotTW2.controllers.DefenseController: {
							robotTW2.createScopeLang("defense", function (scopeLang) {
								var params = {
									controller: robotTW2.controllers.DefenseController,
									provider_listener: robotTW2.providers.eventTypeProvider.OPEN_DEFENSE,
									build_open: true,
									scopeLang: scopeLang,
									hotkey: conf.HOTKEY.DEFENSE,
									templateName: "defense",
									classes: "fullsize",
									url: "/controllers/DefenseController.js",
									style: null
								}
								robotTW2.build(params)
							})
							break
						}
						/*
						case robotTW2.controllers.ReconController: {
							robotTW2.createScopeLang("recon", function (scopeLang) {
								var params = {
									controller: robotTW2.controllers.ReconController,
									provider_listener: robotTW2.providers.eventTypeProvider.OPEN_RECON,
									build_open: true,
									scopeLang: scopeLang,
									hotkey: conf.HOTKEY.RECON,
									templateName: "recon",
									classes: "",
									url: "/controllers/ReconController.js",
									style: {
										width: "450px"
									}
								}
								robotTW2.build(params)
							})
							break
						}
						*/
						case robotTW2.controllers.AttackController: {
							robotTW2.createScopeLang("attack", function (scopeLang) {
								var params = {
									controller: robotTW2.controllers.AttackController,
									provider_listener: robotTW2.providers.eventTypeProvider.OPEN_ATTACK,
									build_open: true,
									scopeLang: scopeLang,
									hotkey: conf.HOTKEY.ATTACK,
									templateName: "attack",
									classes: "fullsize",
									url: "/controllers/AttackController.js",
									style: null
								}
								robotTW2.build(params)
							})
							break
						}
						case robotTW2.controllers.LogController: {
							robotTW2.createScopeLang("log", function (scopeLang) {
								var params = {
									controller: robotTW2.controllers.LogController,
									provider_listener: robotTW2.providers.eventTypeProvider.OPEN_LOG,
									build_open: true,
									scopeLang: scopeLang,
									hotkey: conf.HOTKEY.LOG,
									templateName: "log",
									classes: "fullsize",
									url: "/controllers/LogController.js",
									style: null
								}
								robotTW2.build(params)
							})
							break
						}
						case robotTW2.controllers.CDRController: {
							robotTW2.createScopeLang("cdr", function (scopeLang) {
								var params = {
									controller: robotTW2.controllers.CDRController,
									provider_listener: robotTW2.providers.eventTypeProvider.OPEN_CDR,
									build_open: true,
									scopeLang: scopeLang,
									hotkey: conf.HOTKEY.CDR,
									templateName: "cdr",
									classes: "",
									url: "/controllers/CDRController.js",
									style: {}
								}
								robotTW2.build(params)
							})
							break
						}
						/*
						case robotTW2.controllers.DepositController: {
							robotTW2.createScopeLang("deposit", function (scopeLang) {
								var params = {
									controller: robotTW2.controllers.DepositController,
									provider_listener: robotTW2.providers.eventTypeProvider.OPEN_DEPOSIT,
									build_open: true,
									scopeLang: scopeLang,
									hotkey: conf.HOTKEY.DEPOSIT,
									templateName: "deposit",
									classes: "",
									url: "/controllers/DepositController.js",
									style: {
										width: "450px"
									}
								}
								robotTW2.build(params)
							})
							break
						}
						*/
						case robotTW2.controllers.SecondVillageController: {
							robotTW2.createScopeLang("secondvillage", function (scopeLang) {
								var params = {
									controller: robotTW2.controllers.SecondVillageController,
									provider_listener: robotTW2.providers.eventTypeProvider.OPEN_SECONDVILLAGE,
									build_open: true,
									scopeLang: scopeLang,
									hotkey: conf.HOTKEY.SECONDVILLAGE,
									templateName: "secondvillage",
									classes: "",
									url: "/controllers/SecondVillageController.js",
									style: {
										width: "450px"
									}
								}
								robotTW2.build(params)
							})
							break
						}
						case robotTW2.controllers.AttackCompletionController: {
							robotTW2.createScopeLang("attack", function (scopeLang) {
								var get_father = function () {
									return document.querySelector('[ng-controller=ModalCustomArmyController]');
								}
									, get_son = function () {
										return get_father() ? get_father().querySelector("[unit-operate-sliders]") : undefined
									}
									, params = {
										included_controller: "ModalCustomArmyController",
										controller: robotTW2.controllers.AttackCompletionController,
										service: robotTW2.services.AttackService,
										build_open: false,
										get_son: get_son,
										provider_listener: robotTW2.providers.eventTypeProvider.PREMIUM_SHOP_OFFERS,
										scopeLang: scopeLang,
										templateName: "attackcompletion",
										url: "/controllers/AttackCompletionController.js"
									}
								robotTW2.build(params)
							})
							break
						}
						case robotTW2.controllers.SpyCompletionController: {
							robotTW2.createScopeLang("spy", function (scopeLang) {
								var get_father = function () {
									return document.querySelector('[ng-controller=ModalSendSpiesController]');
								}
									, get_son = function () {
										return get_father() ? get_father().querySelector("div").querySelector(".box-paper").querySelector(".scroll-wrap") : undefined
									}
									, params = {
										included_controller: "ModalSendSpiesController",
										controller: robotTW2.controllers.SpyCompletionController,
										service: robotTW2.services.SpyService,
										build_open: false,
										get_son: get_son,
										provider_listener: "get_selected_village",
										scopeLang: scopeLang,
										templateName: "spycompletion",
										url: "/controllers/SpyCompletionController.js"
									}
								robotTW2.build(params)
							})
							break
						}
						case robotTW2.controllers.MarketCompletionController: {
							robotTW2.createScopeLang("market", function (scopeLang) {
								var get_father = function () {
									return document.querySelector('[ng-controller=ModalSendResourcesController]');
								}
									, get_son = function () {
										return get_father() ? get_father().querySelector("div").querySelector(".box-paper").querySelector(".scroll-wrap") : undefined
									}
									, params = {
										included_controller: "ModalSendResourcesController",
										controller: robotTW2.controllers.MarketCompletionController,
										service: robotTW2.services.MarketService,
										build_open: false,
										get_son: get_son,
										provider_listener: "get_selected_village_market",
										scopeLang: scopeLang,
										templateName: "marketcompletion",
										url: "/controllers/MarketCompletionController.js"
									}
								robotTW2.build(params)
							})
							break
						}
						case robotTW2.controllers.FarmCompletionController: {
							robotTW2.createScopeLang("farm", function (scopeLang) {
								var get_father = function () {
									return document.querySelector('[ng-controller=BattleReportController]');
								}
									, get_son = function () {
										return get_father() ? get_father().querySelector(".tbl-result") && !get_father().querySelector("#checkboxFull") ? get_father().querySelector(".tbl-result") : false : undefined
									}
									, params = {
										included_controller: "BattleReportController",
										controller: robotTW2.controllers.FarmCompletionController,
										service: robotTW2.services.FarmService,
										build_open: false,
										get_son: get_son,
										provider_listener: robotTW2.providers.eventTypeProvider.OPEN_REPORT,
										scopeLang: scopeLang,
										templateName: "farmcompletion",
										url: "/controllers/FarmCompletionController.js"
									}
								robotTW2.build(params)
							})
							break
						}
						case robotTW2.controllers.MainCompletionController: {
							robotTW2.createScopeLang("main", function (scopeLang) {
								var get_father = function () {
									return document.querySelector('[ng-controller=TopInterfaceController]');
								}
									, get_son = function () {
										return get_father() ? get_father().querySelector("#logout-wrapper") : undefined
									}
									, params = {
										included_controller: "TopInterfaceController",
										controller: robotTW2.controllers.MainCompletionController,
										build_open: false,
										get_son: get_son,
										provider_listener: robotTW2.providers.eventTypeProvider.INSERT_BUTTON,
										scopeLang: scopeLang,
										templateName: "maincompletion",
										url: "/controllers/MainCompletionController.js"
									}
								robotTW2.build(params)
							})
							break
						}
						case robotTW2.services.MainService: {
							robotTW2.createScopeLang("main", function (scopeLang) {
								robotTW2.services.$timeout(function () {
									robotTW2.services.MainService && typeof (robotTW2.services.MainService.initExtensions) == "function" ? robotTW2.services.MainService.initExtensions() : null;
									robotTW2.build(
										{
											controller: robotTW2.controllers.MainController,
											provider_listener: robotTW2.providers.eventTypeProvider.OPEN_MAIN,
											build_open: true,
											scopeLang: scopeLang,
											hotkey: conf.HOTKEY.MAIN,
											templateName: "main",
											classes: null,
											url: "/controllers/MainController.js",
											style: {
												width: "714px"
											}
										}
									)
									require(["robotTW2/notify"], function (notify) {
										notify("Shift + P = Main Menu", true)
									})
								}, 3000)
							})
							break
						}
						case robotTW2.services.ExtensionService: {
							robotTW2.services.ExtensionService && typeof (robotTW2.services.ExtensionService.init) == "function" ? robotTW2.requestFn.bind("extension", robotTW2.services.ExtensionService) : null;
							break
						}
						case robotTW2.services.FarmService: {
							robotTW2.services.FarmService && typeof (robotTW2.services.FarmService.init) == "function" ? robotTW2.requestFn.bind("farm", robotTW2.services.FarmService) : null;
							break
						}
						case robotTW2.services.AttackService: {
							robotTW2.services.AttackService && typeof (robotTW2.services.AttackService.init) == "function" ? robotTW2.requestFn.bind("attack", robotTW2.services.AttackService) : null;
							break
						}
						case robotTW2.services.DefenseService: {
							robotTW2.services.DefenseService && typeof (robotTW2.services.DefenseService.init) == "function" ? robotTW2.requestFn.bind("defense", robotTW2.services.DefenseService) : null;
							break
						}
						case robotTW2.services.CDRService: {
							robotTW2.services.CDRService && typeof (robotTW2.services.CDRService.init) == "function" ? robotTW2.requestFn.bind("cdr", robotTW2.services.CDRService) : null;
							break
						}
						/*
						case robotTW2.services.DepositService: {
							robotTW2.services.DepositService && typeof (robotTW2.services.DepositService.init) == "function" ? robotTW2.requestFn.bind("deposit", robotTW2.services.DepositService) : null;
							break
						}
						*/
						case robotTW2.services.HeadquarterService: {
							robotTW2.services.HeadquarterService && typeof (robotTW2.services.HeadquarterService.init) == "function" ? robotTW2.requestFn.bind("headquarter", robotTW2.services.HeadquarterService) : null;
							break
						}
						/*
						case robotTW2.services.ReconService: {
							robotTW2.services.ReconService && typeof (robotTW2.services.ReconService.init) == "function" ? robotTW2.requestFn.bind("recon", robotTW2.services.ReconService) : null;
							break
						}
						*/
						case robotTW2.services.AlertService: {
							robotTW2.services.AlertService && typeof (robotTW2.services.AlertService.init) == "function" ? robotTW2.requestFn.bind("alert", robotTW2.services.AlertService) : null;
							break
						}
						case robotTW2.services.RecruitService: {
							robotTW2.services.RecruitService && typeof (robotTW2.services.RecruitService.init) == "function" ? robotTW2.requestFn.bind("recruit", robotTW2.services.RecruitService) : null;
							break
						}
						case robotTW2.services.SpyService: {
							robotTW2.services.SpyService && typeof (robotTW2.services.SpyService.init) == "function" ? robotTW2.requestFn.bind("spy", robotTW2.services.SpyService) : null;
							break
						}
						case robotTW2.services.FakeService: {
							robotTW2.services.FakeService && typeof (robotTW2.services.FakeService.init) == "function" ? robotTW2.requestFn.bind("fake", robotTW2.services.FakeService) : null;
							break
						}
						case robotTW2.services.MarketService: {
							robotTW2.services.MarketService && typeof (robotTW2.services.MarketService.init) == "function" ? robotTW2.requestFn.bind("market", robotTW2.services.MarketService) : null;
							break
						}
						/*
						case robotTW2.services.CoinsService: {
							robotTW2.services.CoinsService && typeof (robotTW2.services.CoinsService.init) == "function" ? robotTW2.requestFn.bind("coins", robotTW2.services.CoinsService) : null;
							break
						}
						*/
						case robotTW2.services.SecondVillageService: {
							robotTW2.services.SecondVillageService && typeof (robotTW2.services.SecondVillageService.init) == "function" ? robotTW2.requestFn.bind("secondvillage", robotTW2.services.SecondVillageService) : null;
							break
						}
						case robotTW2.services.VillService: {
							robotTW2.services.VillService && typeof (robotTW2.services.VillService.init) == "function" ? robotTW2.requestFn.bind("village", robotTW2.services.VillService) : null;
							break
						}
						case robotTW2.services.ProvinceService: {
							robotTW2.services.ProvinceService && typeof (robotTW2.services.ProvinceService.init) == "function" ? robotTW2.requestFn.bind("province", robotTW2.services.ProvinceService) : null;
							break
						}
						/*
						case robotTW2.services.LogService: {
							robotTW2.services.LogService && typeof (robotTW2.services.LogService.init) == "function" ? robotTW2.requestFn.bind("log", robotTW2.services.LogService) : null;
							break
						}
						*/
						case "database": {
							robotTW2.loadScript("/services/User_Control.js");
							$rootScope.$on("ready_users", function ($event, data) {
								if (!data) { return }
								robotTW2.ready(function () {
									robotTW2.services.$timeout(function () {
										robotTW2.loadScript("/databases/data_villages.js")
										robotTW2.loadScript("/databases/data_buildingorder.js")
										robotTW2.loadScript("/databases/data_buildinglimit.js")
										robotTW2.loadScript("/databases/data_buildinglist.js")
										robotTW2.loadScript("/databases/data_presets.js")
										robotTW2.services.$timeout(function () {
											robotTW2.loadScript("/databases/data_farm.js");
											//robotTW2.loadScript("/databases/data_deposit.js");
											robotTW2.loadScript("/databases/data_cdr.js");
											robotTW2.loadScript("/databases/data_spy.js");
											robotTW2.loadScript("/databases/data_fake.js");
											robotTW2.loadScript("/databases/data_market.js");
											robotTW2.loadScript("/databases/data_alert.js");
											robotTW2.loadScript("/databases/data_attack.js");
											//robotTW2.loadScript("/databases/data_recon.js");
											robotTW2.loadScript("/databases/data_defense.js");
											robotTW2.loadScript("/databases/data_headquarter.js");
											robotTW2.loadScript("/databases/data_recruit.js");
											robotTW2.loadScript("/databases/data_secondvillage.js");
											//robotTW2.loadScript("/databases/data_coins.js");
											robotTW2.loadScript("/databases/data_log.js");
											robotTW2.loadScript("/databases/data_log_farm.js");
											robotTW2.loadScript("/databases/data_log_cdr.js");
											robotTW2.loadScript("/databases/data_log_defense.js");
											robotTW2.loadScript("/databases/data_log_attack.js");

											robotTW2.services.$timeout(function () {
												robotTW2.loadScript("/databases/data_main.js");
											}, 3000)
										}, 3000)
									}, 1000)

								}, ["all_villages_ready", "tribe_relations"])
							})
							break
						}
						case "data_main": {
							robotTW2.loadScript("/services/MainService.js");
							robotTW2.loadScript("/services/VillService.js");
							robotTW2.loadScript("/services/ProvinceService.js");
							robotTW2.loadScript("/services/ExtensionService.js");
							robotTW2.loadScript("/controllers/MainController.js");
							break
						}
						case "data_farm": {
							robotTW2.loadScript("/services/FarmService.js");
							break
						}
						case "data_attack": {
							robotTW2.loadScript("/services/AttackService.js");
							break
						}
						case "data_defense": {
							robotTW2.loadScript("/services/DefenseService.js");
							break
						}
						/*
						case "data_deposit": {
							robotTW2.loadScript("/services/DepositService.js");
							break
						}
						*/
						case "data_cdr": {
							robotTW2.loadScript("/services/CDRService.js");
							break
						}
						case "data_headquarter": {
							robotTW2.loadScript("/services/HeadquarterService.js");
							break
						}
						/*
						case "data_recon": {
							robotTW2.loadScript("/services/ReconService.js");
							break
						}
						*/
						case "data_alert": {
							robotTW2.loadScript("/services/AlertService.js");
							break
						}
						case "data_recruit": {
							robotTW2.loadScript("/services/RecruitService.js");
							break
						}
						case "data_spy": {
							robotTW2.loadScript("/services/SpyService.js");
							break
						}
						case "data_fake": {
							robotTW2.loadScript("/services/FakeService.js");
							break
						}
						case "data_market": {
							robotTW2.loadScript("/services/MarketService.js");
							break
						}
						/*
						case "data_coins": {
							robotTW2.loadScript("/services/CoinsService.js");
							break
						}
						*/
						case "data_secondvillage": {
							robotTW2.loadScript("/services/SecondVillageService.js");
							break
						}
						/*
						case "data_log": {
							robotTW2.loadScript("/services/LogService.js");
							break
						}
						*/
					}

				});
			})
		});
	}.call(this)


