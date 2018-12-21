require.config({

	// alias libraries paths
	baseUrl: "js",
	paths: {
		'angular'		: 'https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.6.5/angular.min',
		'ngRoute'		: 'https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.6.5/angular-route',
		'ngCookies'		: 'https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.6.5/angular-cookies'
	},

	// angular does not support AMD out of the box, put it in a shim
	shim: {
		'angular'		: {exports: 'angular'},
		'ngRoute'		: {deps: ['angular']},
		'ngCookies'		: {deps: ['angular']}
	},

	// kick start application
	deps: ['./bootstrap'],
	waitSeconds: 0
});


require.config({
//	urlArgs: "version = 1.0.00"
	urlArgs: "version = 1.0.00_" + (new Date()).getTime()
});

//require.config({
///* ... paths, shims, etc. */
//onNodeCreated: function(node, config, moduleName, url) {
////console.log('module ' + moduleName + ' is about to be loaded');

//node.addEventListener('load', function() {
//console.log('module ' + moduleName + ' has been loaded');
//});

//node.addEventListener('error', function() {
//console.log('module ' + moduleName + ' could not be loaded');
//});
//},
//});

/**
 * @license RequireJS domReady 2.0.1 Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/requirejs/domReady for details
 */
/*jslint */
/*global require: false, define: false, requirejs: false,
  window: false, clearInterval: false, document: false,
  self: false, setInterval: false */


define("domReady", function () {
	'use strict';

	var isTop, testDiv, scrollIntervalId,
	isBrowser = typeof window !== "undefined" && window.document,
	isPageLoaded = !isBrowser,
	doc = isBrowser ? document : null,
			readyCalls = [];

	function runCallbacks(callbacks) {
		var i;
		for (i = 0; i < callbacks.length; i += 1) {
			callbacks[i](doc);
		}
	}

	function callReady() {
		var callbacks = readyCalls;

		if (isPageLoaded) {
			//Call the DOM ready callbacks
			if (callbacks.length) {
				readyCalls = [];
				runCallbacks(callbacks);
			}
		}
	}

	/**
	 * Sets the page as loaded.
	 */
	function pageLoaded() {
		if (!isPageLoaded) {
			isPageLoaded = true;
			if (scrollIntervalId) {
				clearInterval(scrollIntervalId);
			}

			callReady();
		}
	}

	if (isBrowser) {
		if (document.addEventListener) {
			//Standards. Hooray! Assumption here that if standards based,
			//it knows about DOMContentLoaded.
			document.addEventListener("DOMContentLoaded", pageLoaded, false);
			window.addEventListener("load", pageLoaded, false);
		} else if (window.attachEvent) {
			window.attachEvent("onload", pageLoaded);

			testDiv = document.createElement('div');
			try {
				isTop = window.frameElement === null;
			} catch (e) {}

			//DOMContentLoaded approximation that uses a doScroll, as found by
			//Diego Perini: http://javascript.nwbox.com/IEContentLoaded/,
			//but modified by other contributors, including jdalton
			if (testDiv.doScroll && isTop && window.external) {
				scrollIntervalId = setInterval(function () {
					try {
						testDiv.doScroll();
						pageLoaded();
					} catch (e) {}
				}, 30);
			}
		}

		//Check if document already complete, and if so, just trigger page load
		//listeners. Latest webkit browsers also use "interactive", and
		//will fire the onDOMContentLoaded before "interactive" but not after
		//entering "interactive" or "complete". More details:
		//http://dev.w3.org/html5/spec/the-end.html#the-end
		//http://stackoverflow.com/questions/3665561/document-readystate-of-interactive-vs-ondomcontentloaded
		//Hmm, this is more complicated on further use, see "firing too early"
		//bug: https://github.com/requirejs/domReady/issues/1
		//so removing the || document.readyState === "interactive" test.
		//There is still a window.onload binding that should get fired if
		//DOMContentLoaded is missed.
		if (document.readyState === "complete") {
			pageLoaded();
		}
	}

	/** START OF PUBLIC API **/

	/**
	 * Registers a callback for DOM ready. If DOM is already ready, the
	 * callback is called immediately.
	 * @param {Function} callback
	 */
	function domReady(callback) {
		if (isPageLoaded) {
			callback(doc);
		} else {
			readyCalls.push(callback);
		}
		return domReady;
	}

	domReady.version = '2.0.1';

	/**
	 * Loader Plugin API method
	 */
	domReady.load = function (name, req, onLoad, config) {
		if (config.isBuild) {
			onLoad(null);
		} else {
			domReady(onLoad);
		}
	};

	/** END OF PUBLIC API **/

	return domReady;
});


define("modules", [
	//Controllers
//	'./controllers/AppController',
//	'./controllers/MapController',
	'./controllers/MainController',
	'./controllers/LoginController',
	'./controllers/ReservationController',
//	'./controllers/OperationController',
//	'./controllers/MenuOperationController',
//	'./controllers/SquadronsController',
//	'./controllers/MenuSquadronsController',
//	'./controllers/AttackController',
//	'./controllers/InfoController',
	'./controllers/NotificationController',

	//Services
//	'./services/MapService',
//	'./services/OperationService',
	'./services/AuthenticationService',
	'./services/ReservationService',
	'./services/UserService',
	'./services/socket',
	'./services/SocketService',
	'./services/ModalService',
	'./services/SendMsg',

	//Providers
	'./providers/routeProvider',
	'./providers/eventTypeProvider',
	'./providers/Base64',
	'./providers/Pad',
	'./providers/tilesize',
	'./providers/isEmpty',
	'./providers/conf',
	'./providers/map',
	'./providers/templates',
	'./providers/translate',


	//Configs
	'./configs/location',

	//Directives
	'./directives/datepickerTimezone',
	'./directives/timerpickerTimezone',
	'./directives/formatoData',
	'./directives/translateType'

	], function () {});

define("app.controllers", ['angular'], function (angular) {
	'use strict';
	return angular.module('app.controllers', []);
});

define("app.services", ['angular'], function (angular) {
	'use strict';
	return angular.module('app.services', []);
});

define("app.providers", ['angular'], function (angular) {
	'use strict';
	return angular.module('app.providers', []);
});

define("app.configs", ['angular'], function (angular) {
	'use strict';
	return angular.module('app.configs', []);
});

define("app.directives", ['angular'], function (angular) {
	'use strict';
	return angular.module('app.directives', []);
});

define("base", function () {

	var url = window.location,
	url_base = "/" + window.location.pathname.split('/')[1];
	var type_socket = "ws:"; 
	if(window.location.protocol == "https:") 
		type_socket = "wss:";
	return{

		URL					: url,
		URL_BASE			: url_base,
		URL_SOCKET			: type_socket + "//" + window.location.host + "/" + window.location.pathname.split('/')[1] + "/chaos_dynasty_server",
		RESTRICTED_PAGES	: [
			url_base + '/', 
			url_base + '/index.html',
			url_base + '/login']
//			url_base + '/register']
	}
});

define('app',[
	'angular', 
	'modules',
	'base'
	], function(
			angular, 
			modules,
			base
	) {
	return angular.module('app', ['ngRoute', 'ngCookies', 'app.controllers', 'app.services', 'app.providers', 'app.configs', 'app.directives'])
	.run([
		"$rootScope", 
		'$location', 
		'$cookies', 
		'$http',
		'eventTypeProvider',
		function(
				$rootScope, 
				$location, 
				$cookies, 
				$http,
				eventTypeProvider
		){
			$rootScope.comp_url = "br";
			$rootScope.formatData = "dd/MM/yyyy";
			$rootScope.formatTime = "HH:mm:ss";
			$rootScope.unformatData = "yyyy-MM-dd";
			$rootScope.globals = angular.fromJson($cookies.get('globals')) || {};
			if ($rootScope.globals.currentUser && $rootScope.globals.currentUser.authdata) {
				$http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.globals.currentUser.authdata;
			}
			$rootScope.$on('$locationChangeStart', function (event, next, current) {
				var restrictedPage = !($.inArray($location.path(), base.RESTRICTED_PAGES) === -1);
				var loggedIn = undefined;
				if ($rootScope.globals.currentUser != undefined){
					loggedIn = $rootScope.globals.currentUser;
					//$rootScope.user = $rootScope.globals.currentUser;
				}
				if (restrictedPage && !loggedIn) {
					$location.path(base.URL_BASE + '/login');
				}
			});
		}])
});

define('conf/locale',[],function(){return{"LANGUAGE":"pt_br","LOCALE":"pt_br"};});
