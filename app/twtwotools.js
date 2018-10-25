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

	var host = "https://mendelssohntw.github.io/robot.tw2/app";
	var $rootScope				= injector.get('$rootScope');
	var $templateCache 			= injector.get('$templateCache');
	var $timeout	 			= injector.get('$timeout');
	var $compile 				= injector.get('$compile');
	var httpService 			= injector.get("httpService");
	var windowManagerService 	= injector.get("windowManagerService");
	var templateManagerService 	= injector.get("templateManagerService");
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
					if(!fs.params) {
						fs.fn.apply(this, [])
					} else {
						fs.fn.apply(this, fs.params)
					}
				} else {
					if(!fs.params) {
						fs.fn.apply(this, params)
					} else {
						fs.fn.apply(this, fs.params)
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
		,
		service
	})()
	, commandQueueAttack = (function (){
		var service = {};
		return service.bind = function(key, fn, opt_db) {
			if(!key) return;
			if(opt_db && typeof(opt_db.get) == "function"){
				var db = opt_db.get()
				!db.commands[key] ? db.commands[key] = params : null;
				opt_db.set(db);
				$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.CHANGE_COMMANDS)
			}
			requestFn.bind(key, fn)
		}
		,
		service.trigger = function(key, params) {
			if(!key) return;
			requestFn.trigger(key, [params]);
		}
		,
		service.unbind = function(key, opt_db) {
			if(!key) return;
			if(opt_db && typeof(opt_db.get) == "function"){
				robotTW2.services.$timeout.cancel(requestFn.get(key));
				var db = opt_db.get()
				delete db.commands[key];
				opt_db.set(db);
				$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.CHANGE_COMMANDS)
			}
			requestFn.unbind(key);
		}
		,
		service.unbindAll = function(opt_db) {
			if(!opt_db) return
			var db = opt_db.get()
			Object.keys(db).forEach(function(key) {
				try {
					robotTW2.services.$timeout.cancel(requestFn.get(key));
				} catch(err){

				}
			})
			db.commands = {}
			opt_db.set(db);
			$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.CHANGE_COMMANDS)
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
	, createScopeLang = function(module){
		var scope = {};
		var jsont = window.getTextObject(module);
		Object.keys(jsont).map(function(elem, index, array){
			if(typeof(jsont[elem]) == "string") {
				Object.keys(jsont).map(function(e, i, a){
					scope[e] = jsont[e];
				})
			}
		})
		return scope
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
	, loadScript = function(url){
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
				exports[f][g] = type
				if(f == "databases"){
					$rootScope.$broadcast("ready", g);
				} else {
					$rootScope.$broadcast("ready", type);
				}
			})
		};
//		b.src = host + url + '?' + a;
		b.src = host + url;
		document.head.appendChild(b);
	}
	, builderWindow = function (params){
		this.included_controller 	= params.included_controller;
		this.controller 			= params.controller;
		this.provider_listener 		= params.provider_listener;
		this.scopeLang 				= params.scopeLang;
//		this.style 					= params.style;
		this.hotkey 				= params.hotkey;
//		this.classes 				= params.classes;
		this.templateName 			= params.templateName;
//		screens[params.templateName] 	= this;
		params.hotkey ? this.addhotkey() : null;
		params.provider_listener ? this.addlistener() : null;
		return this
	}
	, build = function(params){
		return new builderWindow(params)
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

	builderWindow.prototype.addWin = function() {
		var self = this;
		!self.listener_include ? self.listener_include = scope.$on("$includeContentLoaded", function(event, screenTemplateName, data){
			screenTemplateName.indexOf(templateName) ? self.openned = !0 : self.openned = !1;
			var $scope = exports.loadController(self.included_controller);
			if(!$scope) return;
			self.scopeLang ? angular.extend($scope, self.scopeLang) : null;

		}): null;
		new Promise(function(res, rej){
			var opt_loadCallback = function(data){
				res(data)
			};

			exports.services.windowManagerService.getScreen(self.templateName, opt_loadCallback, undefined, undefined)
		})
		.then(function(data){
			var pai = $('[ng-controller=' + self.included_controller + ']');
			var filho = pai.children("div").children(".box-paper").children(".scroll-wrap"); 
			filho.append(template)
			var scp = exports.loadController(self.included_controller);
			if(!scp){return}
			angular.extend(scp, self.scopeLang)
			exports.services.$compile(template)(scp)

			self.controller.apply(self.controller, [data.rootScope, data.scope])

		}, function(reason) {
			//console.log(reason); // Error!
		});

	}
	,
	builderWindow.prototype.buildWin = function() {
		var scope = $rootScope.$new();
		var self = this;
		self.scopeLang ? angular.extend(scope, self.scopeLang) : null;
		!self.listener ? self.listener = scope.$on("$includeContentLoaded", function(event, screenTemplateName, data){
			screenTemplateName.indexOf(templateName) ? self.openned = !0 : self.openned = !1;
			self.recalcScrollbar()
			self.setCollapse()
		}): null;
		new Promise(function(res, rej){
			var opt_loadCallback = function(data){
				res(data)
			};

			var opt_destroyCallback = undefined;
			var opt_toggle = undefined;

			exports.services.windowManagerService.getScreenWithInjectedScope(self.templateName, scope, opt_loadCallback, opt_destroyCallback, opt_toggle)
//			getScreen(templateName, scope, function(data){
//			res(data)
//			})
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
				var a = screens[this.templateName];
				a.$window.querySelectorAll(".twx-section.collapse").forEach(function(b) {
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
										a.recalcScrollbar()
					})
				})
				if(a.templateName == "farm"){
					$(".win-foot .btn-orange").forEach(function(d){
						d.setAttribute("style", "min-width:80px")
					})
				}
			}

			if(self.openned){
				self.recalcScrollbar()
				self.setCollapse()
			}

			self.controller.apply(self.controller, [data.rootScope, data.scope])

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
		self.listener_layout = robotTW2.services.$rootScope.$on(self.provider_listener, function(){
			fnThis.apply(self, null)
		})
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
			$compile 					: $compile,
			$timeout 					: $timeout,
			httpService 				: httpService,
			windowManagerService 		: windowManagerService,
			templateManagerService 		: templateManagerService
	};

	exports.providers 			= {};
	exports.controllers			= {};
	exports.databases			= {};

	exports.ready				= ready;
	exports.register			= register;
	exports.host				= host;
	exports.build				= build;
	exports.loadScript			= loadScript;
	exports.createScopeLang 	= createScopeLang;
	exports.requestFn 			= requestFn;
	exports.commandQueueAttack 	= commandQueueAttack;

	(function ($rootScope){
		requestFile($rootScope.loc.ale);
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
					MAX_COMMANDS			: 42,
					MIN_POINTS				: 0,
					MAX_POINTS				: 12000,
					MAP_CHUNCK_LEN 			: 30 / 2,
					TIME_CORRECTION_COMMAND : -225,
					TIME_DELAY_UPDATE		: 30 * seg,
					MAX_TIME_CORRECTION 	: 3 * seg,
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
						DEPOSIT			: 2.3
					},
					JOURNEY_TIME     		: h,
					FARM_TIME		      	: h,
					INTERVAL				: {
						HEADQUARTER	: h,
						RECRUIT		: h,
						DEPOSIT		: 15 * min,
						ALERT		: 5 * min,
						ATTACK		: h
					},
					HOTKEY					: {
						MAIN 			: "ctrl+alt+p",
						HEADQUARTER 	: "ctrl+alt+h",
						ALERT		 	: "ctrl+alt+w",
						RECON		 	: "",
						SPY			 	: "",
						ATTACK		 	: "ctrl+alt+a",
						DEFENSE		 	: "ctrl+alt+d",
						FARM		 	: "ctrl+alt+f",
						RECRUIT		 	: "ctrl+alt+e",
						DEPOSIT		 	: ""
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
			robotTW2.register("services", "modelDataService");
			robotTW2.register("services", "socketService");
			robotTW2.register("services", "premiumActionService");
			robotTW2.register("services", "villageService");
			robotTW2.register("services", "buildingService");
			robotTW2.register("services", "armyService");
			robotTW2.register("services", "$filter");

//			robotTW2.loadScript("/services/HeadquarterService.js");
//			robotTW2.loadScript("/services/DefenseService.js");
//			robotTW2.loadScript("/services/ReconService.js");
//			robotTW2.loadScript("/services/AlertService.js");
//			robotTW2.loadScript("/services/SpyService.js");
//			robotTW2.loadScript("/services/RecruitService.js");
//			robotTW2.loadScript("/services/DepositService.js");
//			robotTW2.loadScript("/services/MedicService.js");

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
				"SOCKET_RECEPT_COMMAND"			: "Internal/robotTW2/socket_recept_command"
			});
			return robotTW2.providers;
		}))

		angular.extend(robotTW2.controllers, define("robotTW2/controllers", [], function(){
			robotTW2.loadScript("/controllers/MainController.js");
			return robotTW2.controllers;
		}))

		require(["robotTW2/services"]);
		require(["robotTW2/databases"]);
		require(["robotTW2/controllers"]);

		var $rootScope = robotTW2.services.$rootScope;
		
		define("robotTW2/notify", [
			'helper/firework'
			], function(
					firework
			) {
			return function(message){
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

					$rootScope.$broadcast(providers.eventTypeProvider.NOTIFICATION_SHOW);

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

				return display(robotTW2.services.$filter("i18n")(message, $rootScope.loc.ale, "notify"));
			}
		})

		$rootScope.$on("ready", function($event, type){
			require(["robotTW2/conf"], function(conf){
				switch (type) {
				case robotTW2.controllers.MainController : {
					robotTW2.loadScript("/controllers/FarmController.js");
//					robotTW2.loadScript("/controllers/HeadquarterController.js");
					robotTW2.loadScript("/controllers/AttackController.js");
//					robotTW2.loadScript("/controllers/DefenseController.js");
//					robotTW2.loadScript("/controllers/ReconController.js");
//					robotTW2.loadScript("/controllers/AlertController.js");
//					robotTW2.loadScript("/controllers/SpyController.js");
//					robotTW2.loadScript("/controllers/DepositController.js");
//					robotTW2.loadScript("/controllers/MedicController.js");
					robotTW2.build(
							{
								controller		: robotTW2.controllers.MainController,
								scopeLang 		: robotTW2.createScopeLang("main"),
								hotkey 			: conf.HOTKEY.MAIN,
								templateName 	: "main",
								classes 		: null,
								style 			: {
									width : "850px"
								}
							}
					)
					break
				}
				case robotTW2.controllers.FarmController : {
					var params = {
							controller		: robotTW2.controllers.FarmController,
							scopeLang 		: robotTW2.createScopeLang("farm"),
							hotkey 			: conf.HOTKEY.FARM,
							templateName 	: "farm",
							classes 		: "fullsize",
							style 			: null
					}		
//					robotTW2.services.FarmService && typeof(robotTW2.services.FarmService.init) == "function" ? robotTW2.requestFn.bind("robotTW2/farm", robotTW2.services.FarmService.init) : null;	
					robotTW2.build(params)
					break
				}
				case robotTW2.controllers.AttackController : {
					var params = {
							controller		: robotTW2.controllers.AttackController,
							scopeLang 		: robotTW2.createScopeLang("attack"),
							hotkey 			: conf.HOTKEY.ATTACK,
							templateName 	: "attack",
							classes 		: "fullsize",
							style 			: null
					}		
//					robotTW2.services.AttackService && typeof(robotTW2.services.AttackService.init) == "function" ? robotTW2.requestFn.bind("robotTW2/attack", robotTW2.services.AttackService.init) : null;	
					robotTW2.build(params)
					break
				}
				case robotTW2.controllers.AttackCompletionController : {
					var params = {
							included_controller		: "ModalCustomArmyController",
							controller				: robotTW2.controllers.AttackCompletionController,
							provider_listener		: robotTW2.providers.eventTypeProvider.PREMIUM_SHOP_OFFERS,
							scopeLang 				: robotTW2.createScopeLang("attack"),
							templateName 			: "attackcompletion"
					}	
//					robotTW2.services.AttackService && typeof(robotTW2.services.AttackService.init) == "function" ? robotTW2.requestFn.bind("robotTW2/attack", robotTW2.services.AttackService.init) : null;	
					robotTW2.build(params)
					break
				}
				case "database" : {
					robotTW2.loadScript("/databases/data_main.js");
					robotTW2.loadScript("/databases/data_villages.js")
					robotTW2.loadScript("/databases/data_farm.js");
					robotTW2.loadScript("/databases/data_attack.js");
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
				}

			});

		})
	});
}.call(this)
