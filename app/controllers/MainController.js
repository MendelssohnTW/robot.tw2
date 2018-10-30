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

			$scope.data_main = data_main.get();
			$scope.extensions = data_main.getExtensions();

			if (!$scope.$$phase) {
				$scope.$apply();
			}

		}

		$scope.saveCorrection = function(){
			data_main.set($scope.data_main);
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

			var arFn = robotTW2.requestFn.get(ext.toLowerCase(), true);
			if(!arFn) {
				$scope.extensions[ext].activated = false;
				$scope.extensions[ext].status = $scope.disabled;
			} else {
				var fn = arFn.fn;
				$scope.extensions[ext].activated = true;
				if(ext.initialized){
					if(fn.isInitialized()){
						if(typeof(fn.isPaused) == "function"){
							fn.isRunning() && fn.isPaused() ? $scope.extensions[key].status = $scope.paused : fn.isRunning() && !fn.isPaused() ? $scope.extensions[key].status = $scope.running : $scope.extensions[key].status = $scope.stopped;						
						} else {
							fn.isRunning() ? $scope.extensions[key].status = $scope.running : $scope.extensions[key].status = $scope.stopped;
						}
						return;
					}
					if(typeof(fn.init) == "function"){fn.init()}
					if(typeof(fn.analytics) == "function"){fn.analytics()}
				} else {
					if(fn.isRunning()){
						fn.stop();
					}
				}
			}
			
			data_main.setExtensions($scope.extensions);
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