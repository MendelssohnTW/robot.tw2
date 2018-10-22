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
	, requestFn = function(){
		var fns = {}
		, service = {};
		return service.prefix = "robotTW2/" 
			, service.bind = function(key, fn, params) {
			fns.hasOwnProperty(key) || (fns[key] = []),
			fns[key].push({fn:fn, params:params})
		}
		,
		service.trigger = function(key, params) {
			fns.hasOwnProperty(key) && fns[key].forEach(function(fs) {
				fs.fn.apply(this, params)
			})
		}
		,
		service.get = function(key, opt_prefix, index) {
			if(!key) return;
			!index ? index = 0 : index;
			return opt_prefix && fns[this.prefix + key] ? fns[this.prefix + key][index] : fns[key] ? fns[key][index] : null 
		}
		,
		service
	}
	, createScopeLang = function(module){
		var scope = {};
		var jsont = window.getTextObject(module);
		Object.keys(jsont).map(function(elem, index, array){
			if(typeof(jsont[elem]) != "string") {
				if(elem == module){
					Object.keys(jsont[module]).map(function(e, i, a){
						scope[e] = jsont[module][e];
					})
				}
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
			require([i], function(controller){
				exports[f][g] = controller
				$rootScope.$broadcast("ready", controller);
			})
		};
		b.src = host + url + '?' + a;
//		b.src = host + url;
		document.head.appendChild(b);
	}
	, builderWindow = function (params){
		this.controller = params.controller;
//		this.scopeLang = params.scopeLang;
//		this.style = params.style;
		this.hotkey = params.hotkey;
//		this.classes = params.classes;
		this.templateName = params.templateName;
//		screens[params.templateName] = this;
		params.hotkey ? this.addhotkey() : null;
		return this
	}
	, build = function(params){
		return new builderWindow(params)
	}

	builderWindow.prototype.buildWin = function() {
		var scope = $rootScope.$new();
		var self = this;
//		angular.extend(scope, screens[templateName].scopeLang)
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
		var that = this;
		exports.services.hotkeys.add(this.hotkey, function(){
			//fnThis.call(getTemp())
			fnThis.apply(that, null)
		}, ["INPUT", "SELECT", "TEXTAREA"])
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

	exports.providers 		= {};
	exports.controllers		= {};
	exports.databases		= {};

	exports.register		= register;
	exports.host			= host;
	exports.build			= build;
	exports.loadScript		= loadScript;
	exports.createScopeLang	= createScopeLang;

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
						MAIN			: 2.15,
						VILLAGES		: 2.15,
						HEADQUARTER		: 2.15,
						ALERT			: 2.15,
						RECON			: 2.15,
						SPY				: 2.15,
						ATTACK			: 2.15,
						DEFENSE			: 2.15,
						FARM			: 2.15,
						RECRUIT			: 2.15,
						DEPOSIT			: 2.15
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
//			robotTW2.loadScript("/services/.js");
			robotTW2.register("services", "hotkeys");
			robotTW2.register("services", "modelDataService");
			robotTW2.register("services", "socketService");
			robotTW2.register("services", "premiumActionService");
			robotTW2.register("services", "villageService");
			robotTW2.register("services", "buildingService");
			robotTW2.register("services", "armyService");
			robotTW2.register("services", "$filter");
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

		$rootScope.$on("ready", function($event, controller){
			switch (controller) {
			case robotTW2.controllers.MainController : {
				robotTW2.build(
						{
							controller		: robotTW2.controllers.MainController,
							scopeLang 		: robotTW2.createScopeLang("main"),
							hotkey 			: "ctrl+alt+p",
							templateName 	: "main",
							classes 		: null,
							style 			: {
								width : "850px"
							}
						}
				)
				break
			}
			case robotTW2.databases.database : {
				robotTW2.loadScript("/databases/data_main.js");
				robotTW2.loadScript("/databases/data_villages.js");
				robotTW2.loadScript("/databases/data_farm.js");
				break
			}

			}
		})
	});
}.call(this)
