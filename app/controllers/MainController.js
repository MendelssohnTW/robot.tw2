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
		var toggle = false;

		var data_main = databases.data_main;
		var update = function(){

			$scope.extensions = data_main.getExtensions();
			for (var extension in $scope.extensions) {
				var arFn = robotTW2.requestFn.get(extension.toLowerCase(), true);
				if(!arFn) {
					$scope.extensions[extension].activated = false;
					continue
				} else {
					var fn = arFn.fn;
					if(typeof(fn.isPaused) == "function"){
						fn.isRunning() && fn.isPaused() ? $scope.extensions[extension].status = $scope.paused : fn.isRunning() && !fn.isPaused() ? $scope.extensions[extension].status = $scope.running : $scope.extensions[extension].status = $scope.stopped;						
					} else {
						fn.isRunning() ? $scope.extensions[extension].status = $scope.running : $scope.extensions[extension].status = $scope.stopped;
					}
				}
			}
			data_main.setExtensions($scope.extensions);

			$scope.data_main = data_main.get();

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
			toggle = true;
			if(!ext.initialized){
				ext.auto_initialize = false;
				$scope.extensions[ext.name].auto_initialize = ext.auto_initialize
			}
			$scope.extensions[ext.name].initialized = ext.initialized

			var arFn = robotTW2.requestFn.get(ext.name.toLowerCase(), true);
			if(!arFn) {
				$scope.extensions[ext.name].activated = false;
				$scope.extensions[ext.name].status = $scope.disabled;
			} else {
				var fn = arFn.fn;
				$scope.extensions[ext.name].activated = true;
				if(ext.initialized){
					$scope.extensions[ext.name].status = $scope.running;
					if(!fn.isInitialized()){
						if(typeof(fn.init) == "function"){fn.init()}
						if(typeof(fn.analytics) == "function"){fn.analytics()}
					}
				} else {
					if(fn.isRunning()){
						$scope.extensions[ext.name].status = $scope.stopped
						fn.stop();
					}
				}
			}

			toggle = false;

			data_main.setExtensions($scope.extensions);
			update()
		};

		$rootScope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function($event, data) {
			if(!data){return} 
			if(data.name == "ALERT"){
				if(!toggle){
					update();
				} else {
					robotTW2.services.$timeout(function(){update()}, 3000)
				}
			}
		})

		$scope.toggleValueInit = function(ext) {
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