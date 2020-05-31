define("robotTW2/controllers/MainController", [
	"robotTW2",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/conf",
	"robotTW2/databases/data_main",
	"robotTW2/calibrate_time"
], function (
	robotTW2,
	services,
	providers,
	conf,
	data_main,
	calibrate_time
) {
		return function MainController($scope) {
			$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale)
			$scope.CLEAR = services.$filter("i18n")("CLEAR", services.$rootScope.loc.ale)
			$scope.START = services.$filter("i18n")("START", services.$rootScope.loc.ale)
			$scope.STOP = services.$filter("i18n")("STOP", services.$rootScope.loc.ale)
			$scope.OPEN = services.$filter("i18n")("OPEN", services.$rootScope.loc.ale)
			$scope.UPDATE = services.$filter("i18n")("UPDATE", services.$rootScope.loc.ale)
			$scope.version = services.$filter("i18n")("version", services.$rootScope.loc.ale)

			$scope.data_main = data_main;
			$scope.text_version = $scope.version + " " + data_main.version;
			$scope.extensions = $scope.data_main.getExtensions()
			$scope.extensions_status = {}

			var self = this
				, toggle = false
				, getStatus = function getStatus(fn) {
					var status;
					if (typeof (fn.isPaused) == "function") {
						fn.isRunning() && fn.isPaused() ? status = $scope.paused : fn.isRunning() && !fn.isPaused() ? status = $scope.running : status = $scope.stopped;
					} else {
						fn.isRunning() ? status = $scope.running : status = $scope.stopped;
					}
					return status;
				}
				, updateCorrection = function () {
					if (!$scope.$$phase) $scope.$apply()
				}
				, update_status = function () {
					for (var name in $scope.extensions) {
						//				$scope.extensions[name.toUpperCase()].hotkey ? $scope.extensions[name.toUpperCase()].hotkey = conf.HOTKEY[name.toUpperCase()].toUpperCase() : null;
						var arFn = robotTW2.requestFn.get(name.toLowerCase(), true)
						var fn = arFn.fn;
						$scope.extensions[name].status = getStatus(fn)
					}
					if (!$scope.$$phase) { $scope.$apply() }
				}
				, initExt = function (ext) {
					if (ext.init_initialized && ext.activated) {
						var arFn = robotTW2.requestFn.get(ext.name.toLowerCase(), true)
						var fn = arFn.fn;
						if (!fn.isInitialized()) {
							if (typeof (fn.init) == "function") {
								if (!fn.isRunning()) {
									fn.init()
								}
							}
							if (typeof (fn.analytics) == "function") { fn.analytics() }
						}
					}
				}
				, startExt = function (name) {
					var arFn = robotTW2.requestFn.get(name.toLowerCase(), true)
					var fn = arFn.fn;
					if (!fn.isInitialized()) {
						if (typeof (fn.init) == "function") {
							if (!fn.isRunning()) {
								fn.init()
							}
						}
						if (typeof (fn.analytics) == "function") { fn.analytics() }
					} else {
						if (typeof (fn.start) == "function") {
							if (!fn.isRunning()) {
								fn.init()
								/*
								if ($scope.data_main.pages_excludes.includes(name.toLowerCase())) {
									fn.init(true)
								} else {
									fn.init()
								}
								*/
								//fn.start()
							}
						}
					}
				}
				, stopExt = function (name) {
					var arFn = robotTW2.requestFn.get(name.toLowerCase(), true)
					var fn = arFn.fn;
					if (typeof (fn.stop) == "function") {
						if (fn.isRunning()) {
							fn.stop()
						}
					}
				}

			for (var name in $scope.extensions) {
				$scope.extensions[name.toUpperCase()].hotkey ? $scope.extensions[name.toUpperCase()].hotkey = conf.HOTKEY[name.toUpperCase()].toUpperCase() : null;
				var arFn = robotTW2.requestFn.get(name.toLowerCase(), true)
				var fn = arFn.fn;

				$scope.extensions[name].status = getStatus(fn)
				if ($scope.extensions[name].status == $scope.running) {
					$scope.extensions_status[name] = true;

				} else {
					$scope.extensions_status[name] = false;
				}

			}

			$scope.clearDB = function (ext_name) {
				if ("headquarter" == ext_name.toLowerCase()) {
					robotTW2.databases["data_headquarter"].version = undefined
					robotTW2.databases["data_headquarter"].set()
					robotTW2.databases["data_buildinglimit"].version = undefined
					robotTW2.databases["data_buildinglimit"].set()
					robotTW2.databases["data_buildingorder"].version = undefined
					robotTW2.databases["data_buildingorder"].set()
					robotTW2.databases["data_buildinglist"].version = undefined
					robotTW2.databases["data_buildinglist"].set()
				} else if ("farm" == ext_name.toLowerCase()) {
					robotTW2.databases["data_farm"].version = undefined
					robotTW2.databases["data_farm"].set()
					robotTW2.databases["data_presets"].version = undefined
					robotTW2.databases["data_presets"].set()
				} else {
					var db = "data_" + ext_name.toLowerCase();
					robotTW2.databases[db].version = undefined
					robotTW2.databases[db].set()
				}
				services.$timeout(function () { location.reload() }, 1000)
			}

			$scope.updateDB = function () {
				var db = "data_villages";
				robotTW2.databases[db].version = undefined
				robotTW2.databases[db].set()
				services.$timeout(function () { location.reload() }, 1000)
			}

			$scope.clearAllDB = function () {
				Object.values(robotTW2.databases).map(function (db) {
					if (db.name != "database") {
						db.version = undefined;
						db.set();
					}
				})
				services.$timeout(function () { location.reload() }, 2000)
			}

			//		$scope.recalibrate = function(){
			//		$scope.data_main.auto_calibrate = true;
			//		calibrate_time()
			//		}

			$scope.updateTimeCorrection = function () {
				updateCorrection();
			}

			$scope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function ($event, data) {
				if (!data) { return }
				services.$timeout(function () { update_status() }, 1500)
			})

			$scope.toggleStartStop = function (ext) {
				if (!$scope.extensions_status[ext.name]) {
					stopExt(ext.name)
				} else {
					startExt(ext.name)
				}
			}

			$scope.initExt = function (ext) {
				initExt(ext.name)
			}

			$scope.openExt = function (name) {
				var text = "OPEN_";
				var concat = text + name.toUpperCase();
				services.$rootScope.$broadcast(providers.eventTypeProvider[concat])
			}

			$scope.$watch("extensions", function () {
				if (!$scope.extensions) { return }
				$scope.data_main.setExtensions($scope.extensions)
			}, true)

			$scope.$watch("data_main", function () {
				$scope.data_main.set()
			}, true)

			//		$scope.$watch("data_main.time_correction_command", function(){
			//		$scope.data_main.auto_calibrate = false;
			//		}, true)

			$scope.$on(providers.eventTypeProvider.CHANGE_TIME_CORRECTION, function () {
				updateCorrection()
			})

			$scope.$on("$destroy", function () {
				$scope.data_main.setExtensions($scope.extensions)
			})

			$scope.setCollapse();

			return $scope;
		}
	})
