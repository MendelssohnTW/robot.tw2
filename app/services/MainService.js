define("robotTW2/services/MainService", [
	"robotTW2",
	"robotTW2/conf",
	"robotTW2/databases/data_main",
	"robotTW2/calibrate_time",
], function (
	robotTW2,
	conf,
	data_main,
	calibrate_time
) {
		return (function MainService(
			$rootScope,
			$timeout,
			requestFn,
			secondVillageService,
			modelDataService,
			providers,
			loadScript
		) {
			var timeout = undefined
				, completion_loaded = !1;

			function onError() {
				if (timeout && timeout.$$state && timeout.$$state.status == 0) {
					robotTW2.services.$timeout.cancel(timeout)
				}
				window.location.reload()
			}

			function onErrorTimeout() {
				if (timeout && timeout.$$state && timeout.$$state.status == 0) {
					robotTW2.services.$timeout.cancel(timeout)
				}
				timeout = robotTW2.services.$timeout(function () {
					onError()
				}, 30000)
			}

			var verifyConnection = function verifyConnection() {
				if (document.querySelector('[ng-controller=ModalSocketController]')) {
					timeout = undefined;
					onErrorTimeout()
				}
			}

			var service = {};
			return service.initExtensions = function () {
				if (!completion_loaded) {
					completion_loaded = !0;
					loadScript("/controllers/MainCompletionController.js");
				}
				var extensions = data_main.getExtensions();
				for (var extension in extensions) {
					var arFn = requestFn.get(extension.toLowerCase(), true);
					if (!arFn || (extension.toLowerCase() == "secondvillage" && !secondVillageService.isFeatureActive() || extension.toLowerCase() == "fake")
					) {
						extensions[extension].activated = false;
						continue
					} else {
						var fn = arFn.fn;
						extensions[extension].hotkey = conf.HOTKEY[extension].toUpperCase();
						extensions[extension].activated = true;

						if (extensions[extension].auto_start) {
							extensions[extension].init_initialized = true;
							if (fn.isInitialized())
								return !1;
							if (typeof (fn.init) == "function") { fn.init() }
							if (typeof (fn.analytics) == "function") { fn.analytics() }
						} else if (extension.toLowerCase() == "log") {
							if (typeof (fn.init) == "function") { fn.init() }
						}
					}
				}
				data_main.setExtensions(extensions);

				$timeout(function () {
					calibrate_time()
				}, 5000)

				$rootScope.$on(providers.eventTypeProvider.SOCKET_ERROR, onErrorTimeout);
				$rootScope.$on(providers.eventTypeProvider.SOCKET_RECONNECT_ERROR, onError);
				$rootScope.$on(providers.eventTypeProvider.SOCKET_RECONNECT_FAILED, onError);

				$timeout(function () {
					$rootScope.$broadcast(providers.eventTypeProvider.INSERT_BUTTON);
				}, 10000)


				window.setInterval(function () {
					verifyConnection()
				}, 300000) // 5 min
				window.setInterval(function () {
					calibrate_time()
				}, 1800000) // 30 min

				return extensions
			}
				, service.getSelects = function (obj, selected, key) {
					if (!obj) { return }
					let ob;
					if (selected) {
						if (key) {
							ob = obj.find(f => f[key] == selected[key])
						} else {
							ob = obj.find(f => f == selected)
						}
					} else {
						ob = obj[0]
					}

					var select = {
						"availableOptions": obj,
						"selectedOption": ob
					}

					return select
				}
				, service.verifyConnection = verifyConnection
				, service
		})(
			robotTW2.services.$rootScope,
			robotTW2.services.$timeout,
			robotTW2.requestFn,
			robotTW2.services.secondVillageService,
			robotTW2.services.modelDataService,
			robotTW2.providers,
			robotTW2.loadScript
		)
	})