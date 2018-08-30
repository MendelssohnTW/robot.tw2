define("robotTW2/main", [
	], function(
	){
	var isInitialized = !1
	, isRunning = !1
	, init = function (){
		isInitialized = !0;
	}
	, stop = function (){
		isInitialized = !1;
	}

	return	{
		init			: init,
		stop 			: stop,
		isRunning		: function() {
			return isRunning
		},
		isInitialized	: function(){
			return isInitialized
		},
		version			: "1.0.0",
		name			: "main"
	}
})
,
define("robotTW2/main/ui", [
	"robotTW2/main",
	"robotTW2/builderWindow",
	"robotTW2/data_main",
	"robotTW2/data_deposit",
	"robotTW2/data_recon",
	"robotTW2/requestFn",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/conf",
	"helper/time",
	"robotTW2/unitTypes",
	"robotTW2/unitTypesRenameRecon"
	], function(
			main,
			builderWindow,
			data_main,
			data_deposit,
			data_recon,
			requestFn,
			services,
			providers,
			conf,
			helper,
			unitTypes,
			unitTypesRenameRecon
	) {
	var $window
	, build = function(callback) {
		var hotkey = conf.HOTKEY.MAIN;
		var templateName = "main";
		$window = new builderWindow(hotkey, templateName, callback)
		var extensions = data_main.getExtensions();
		for (var extension in extensions) {
			var fn = requestFn.get(extension.toLowerCase(), true);
			if(!fn) {
				extensions[extension].ENABLED = false;
				continue
			} else {
				extensions[extension].ENABLED = true;
			}
			if(extensions[extension].ATIVATE && extensions[extension].INIT_ATIVATE){
				if(fn.isInitialized())
					return !1;	
				fn.init();
				if(typeof(fn.build) == "function"){fn.build()}
				if(typeof(fn.analytics) == "function"){fn.analytics()}
			}
		}
		data_main.setExtensions(extensions);
		return $window
	}
	, injectScope = function() {
		var $scope = $window.$data.scope;
		$($window.$data.rootnode).addClass("fullsize");
		$scope.extension_disabled = services.$filter("i18n")("extension_disabled", $rootScope.loc.ale, "main");
		$scope.extension_enabled = services.$filter("i18n")("extension_enabled", $rootScope.loc.ale, "main");
		$scope.title = services.$filter("i18n")("title", $rootScope.loc.ale, "main");
		$scope.introducing = services.$filter("i18n")("introducing", $rootScope.loc.ale, "main");
		$scope.settings = services.$filter("i18n")("settings", $rootScope.loc.ale, "main");
		$scope.settings_module = services.$filter("i18n")("settings_module", $rootScope.loc.ale, "main");
		$scope.settings_main = services.$filter("i18n")("settings_main", $rootScope.loc.ale, "main");
		$scope.init_standard = services.$filter("i18n")("init_standard", $rootScope.loc.ale, "main");
		$scope.module = services.$filter("i18n")("module", $rootScope.loc.ale, "main");
		$scope.text_hotkey = services.$filter("i18n")("text_hotkey", $rootScope.loc.ale, "main");
		$scope.text_status = services.$filter("i18n")("text_status", $rootScope.loc.ale, "main");
		$scope.running = services.$filter("i18n")("running", $rootScope.loc.ale, "main");
		$scope.stopped = services.$filter("i18n")("stopped", $rootScope.loc.ale, "main");
		$scope.paused = services.$filter("i18n")("paused", $rootScope.loc.ale, "main");
		$scope.state = services.$filter("i18n")("state", $rootScope.loc.ale, "main");
		$scope.text_max_time_correction = services.$filter("i18n")("text_max_time_correction", $rootScope.loc.ale, "main");
		$scope.text_time_correction_command = services.$filter("i18n")("text_time_correction_command", $rootScope.loc.ale, "main");

		$scope.save = services.$filter("i18n")("SAVE", $rootScope.loc.ale);
		$scope.close = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);

		$scope.text_interval_deposit = services.$filter("i18n")("text_interval_deposit", $rootScope.loc.ale, "deposit");
		$scope.use_reroll_deposit = services.$filter("i18n")("use_reroll_deposit", $rootScope.loc.ale, "deposit");
		$scope.settings_deposit = services.$filter("i18n")("settings", $rootScope.loc.ale, "deposit");

		$scope.settings_recon = services.$filter("i18n")("settings", $rootScope.loc.ale, "recon");

		$scope.data_main = data_main.getMain();
		$scope.extensions = data_main.getExtensions();

		$scope.extensions_copy = {};
		$scope.hotkeys = conf.HOTKEY;

		$scope.data_deposit = data_deposit.getDeposit();

		angular.merge($scope.extensions_copy, $scope.extensions);

		for (ext in $scope.extensions){
			var fn = requestFn.get(ext.toLowerCase(), true);
			if(!fn){
				continue	
			} else {
				$scope.extensions_copy[ext].ISRUNNING = fn.isRunning()
				if(typeof(fn.isPaused)=="function"){
					$scope.extensions_copy[ext].ISPAUSED = fn.isPaused()
				} else {
					$scope.extensions_copy[ext].ISPAUSED = false;
				}
			}
			!$scope.extensions_copy[ext].ISRUNNING ? $scope.extensions_copy[ext].STATUS = $scope.stopped : ($scope.extensions_copy[ext].ISPAUSED ? $scope.extensions_copy[ext].STATUS = $scope.paused : $scope.extensions_copy[ext].STATUS = $scope.running)
		}

		$scope.saveCorrection = function(){
			data_main.setMain($scope.data_main);
		}

		$scope.toggleValueState = function(ext) {
			if(!ext.ATIVATE){
				ext.INIT_ATIVATE = false;
				$scope.extensions[ext.name].INIT_ATIVATE = ext.INIT_ATIVATE
			}
			$scope.extensions[ext.name].ATIVATE = ext.ATIVATE
			data_main.setExtensions($scope.extensions);
			var fn = requestFn.get(ext.name.toLowerCase(), true);
			if(ext.ATIVATE){
				if(!fn.isInitialized()){
					if(ext.name != "FARM"){
						fn.init();
					}
					if(typeof(fn.build) == "function"){fn.build()}
					if(typeof(fn.analytics) == "function"){fn.analytics()}
				} else {
					if(ext.name != "FARM"){
						fn.start();
					}
				}
			} else {
				if(fn.isRunning()){
					fn.stop();
				}
			}
			angular.merge($scope.extensions_copy, $scope.extensions);
		};

		$rootScope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function($event, data) {
			if(!data){return} 
			var fn = requestFn.get(data.name.toLowerCase(), true);
			$scope.extensions_copy[data.name].ISRUNNING = fn.isRunning();
			!$scope.extensions_copy[data.name].ISRUNNING ? $scope.extensions_copy[data.name].STATUS = $scope.stopped : ($scope.extensions_copy[data.name].ISPAUSED ? $scope.extensions_copy[data.name].STATUS = $scope.paused : $scope.extensions_copy[data.name].STATUS = $scope.running)
					if(typeof(fn.isPaused)=="function"){
						$scope.extensions_copy[data.name].ISPAUSED = fn.isPaused()
					} else {
						$scope.extensions_copy[data.name].ISPAUSED = false;
					}
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		})

		$scope.toggleValueInit= function(ext) {
			$scope.extensions[ext.name].INIT_ATIVATE = ext.INIT_ATIVATE
			data_main.setExtensions($scope.extensions);
			angular.merge($scope.extensions_copy, $scope.extensions);
		};

		$rootScope.$on(providers.eventTypeProvider.CHANGE_TIME_CORRECTION, function() {
			$scope.data_main = data_main.getMain();
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		})


		/*
		 * Deposit
		 */

		$scope.interval_deposit = helper.readableMilliseconds(data_deposit.getTimeCicle())
		$scope.data_deposit.COMPLETED_AT ? $scope.deposit_completed_at = $scope.data_deposit.COMPLETED_AT : $scope.deposit_completed_at = 0;

		helper.timer.add(function(){
			if($scope.deposit_completed_at == 0) {return}
			$scope.interval_deposit =  helper.readableMilliseconds($scope.deposit_completed_at - helper.gameTime());
		});

		$scope.$watch("data_deposit.USE_REROLL", function(){
			data_deposit.setDeposit($scope.data_deposit)
		})

		$rootScope.$on(providers.eventTypeProvider.INTERVAL_CHANGE_DEPOSIT, function() {
			$scope.interval_deposit = helper.readableMilliseconds(data_deposit.getTimeCicle())
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		})


		/*
		 * Recon
		 */

		$scope.getKey = function(k){
			return services.$filter("i18n")(k, $rootScope.loc.ale, "recon");
		}

		$scope.getClass = function(k){
			return "icon-20x20-unit-" + k;
		}

		$scope.data_recon = data_recon.getRecon();

		$scope.$watchCollection("data_recon.RENAME", function(){
			data_recon.setRecon($scope.data_recon)
		})

		if (!$scope.$$phase) {
			$scope.$apply();
		}

		setTimeout(function(){
			$window.setCollapse();
			$window.recalcScrollbar();
		}, 500)

	}

	Object.setPrototypeOf(main, {
		build : function(){
			build(injectScope)
		}
	})

})
