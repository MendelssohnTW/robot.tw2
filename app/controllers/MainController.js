define("robotTW2/controllers/MainController", [
	"robotTW2",
	"robotTW2/databases",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/conf"
	], function(
			robotTW2,
			databases,
			services,
			providers,
			conf
	){
	return function MainController($rootScope, $scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		var self = this;
		var data_main = databases.data_main;
		var update = function(){
			var extensions = services.MainService.getExtensions();

			Object.keys(extensions).forEach(function(key){
				extensions[key].hotkey = conf.HOTKEY[key].toUpperCase();
				var arFn = robotTW2.requestFn.get(key.toLowerCase(), true);
				if(!arFn){
					extensions[key].status = $scope.disabled;
				} else {
					var fn = arFn.fn;
					fn.isRunning() && fn.isPaused() ? extensions[key].status = $scope.paused : fn.isRunning() && (typeof(fn.isPaused) == "function" && !fn.isPaused()) ? extensions[key].status = $scope.running : extensions[key].status = $scope.stopped;
				}
			})

			data_main.setExtensions(extensions);
			data_main.save();

			$scope.data_main = data_main;
			$scope.extensions = extensions

			if (!$scope.$$phase) {
				$scope.$apply();
			}

		}

		$scope.saveCorrection = function(){
			data_main.setMain($scope.data_main);
		}

		$scope.recalibrate = function(){
			robotTW2.service.AttackService.calibrate_time();
		}

		$scope.toggleValueState = function(ext) {
			if(!ext.initialized){
				ext.auto_initialize = false;
				$scope.extensions[ext.name].auto_initialize = ext.auto_initialize
			}
//			$scope.extensions[ext.name].initialized = ext.initialized
			data_main.setExtensions($scope.extensions);
			var arFn = robotTW2.requestFn.get(ext.name.toLowerCase(), true);
			var fn = arFn.fn;
			var params = arFn.params;

			if(ext.initialized){
				if(!fn.isInitialized()){
					if(ext.name != "FARM"){
						fn.init();
					}
					if(typeof(fn.build) == "function"){fn.build(params)}
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
			update()
		};

		$rootScope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function($event, data) {
			if(!data){return} 
			update();
		})

		$scope.toggleValueInit= function(ext) {
			$scope.extensions[ext.name].auto_initialize = ext.auto_initialize
			data_main.setExtensions($scope.extensions);
			update()
		};

		$rootScope.$on(providers.eventTypeProvider.CHANGE_TIME_CORRECTION, function() {
			update()
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		})


		/*
		 * Deposit
		 */
//		$scope.data_deposit = data_deposit.getDeposit();
//		$scope.interval_deposit = helper.readableMilliseconds(data_deposit.getTimeCicle())
//		$scope.data_deposit.COMPLETED_AT ? $scope.deposit_completed_at = $scope.data_deposit.COMPLETED_AT : $scope.deposit_completed_at = 0;

//		helper.timer.add(function(){
//		if($scope.deposit_completed_at == 0) {return}
//		$scope.interval_deposit =  helper.readableMilliseconds($scope.deposit_completed_at - helper.gameTime());
//		});

//		$scope.$watch("data_deposit.USE_REROLL", function(){
//		data_deposit.setDeposit($scope.data_deposit)
//		})

//		$rootScope.$on(providers.eventTypeProvider.INTERVAL_CHANGE_DEPOSIT, function() {
//		$scope.interval_deposit = helper.readableMilliseconds(data_deposit.getTimeCicle())
//		if (!$scope.$$phase) {
//		$scope.$apply();
//		}
//		})


		/*
		 * Recon
		 */

//		$scope.getKey = function(k){
//		return services.$filter("i18n")(k, $rootScope.loc.ale, "recon");
//		}

//		$scope.getClass = function(k){
//		return "icon-20x20-unit-" + k;
//		}

//		$scope.data_recon = data_recon.getRecon();

//		$scope.$watchCollection("data_recon.RENAME", function(){
//		data_recon.setRecon($scope.data_recon)
//		})

		update()

		return $scope;
	}
})