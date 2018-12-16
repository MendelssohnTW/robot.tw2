define("robotTW2/controllers/MainController", [
	"robotTW2",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/conf"
	], function(
			robotTW2,
			services,
			providers,
			conf
	){
	return function MainController($rootScope, $scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		var self = this;
		var toggle = false;

		var update = function(){
			$scope.extensions = $rootScope.data_main.getExtensions();
			for (var extension in $scope.extensions) {
				$scope.extensions[extension.toUpperCase()].hotkey = conf.HOTKEY[extension.toUpperCase()].toUpperCase();
				var arFn = robotTW2.requestFn.get(extension.toLowerCase(), true);
				if(!arFn) {
					$scope.extensions[extension].activated = false;
					continue
				} else {
					if(ext.name == "DATA"){
						if($rootScope.data_data.possible){
							$scope.extensions[ext.name].activated = true;
						} else {
							$scope.extensions[ext.name].activated = false;
						}
					var fn = arFn.fn;

					if(typeof(fn.isPaused) == "function"){
						fn.isRunning() && fn.isPaused() ? $scope.extensions[extension].status = $scope.paused : fn.isRunning() && !fn.isPaused() ? $scope.extensions[extension].status = $scope.running : $scope.extensions[extension].status = $scope.stopped;						
					} else {
						fn.isRunning() ? $scope.extensions[extension].status = $scope.running : $scope.extensions[extension].status = $scope.stopped;
					}
				}
			}
			$rootScope.data_main.setExtensions($scope.extensions);

			if (!$rootScope.$$phase) $rootScope.$apply();

		}

		$scope.recalibrate = function(){
			service.AttackService.calibrate_time();
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
				if(ext.name == "DATA"){
					if($rootScope.data_data.possible){
						$scope.extensions[ext.name].activated = true;
					} else {
						$scope.extensions[ext.name].activated = false;
					}
				} else {
					$scope.extensions[ext.name].activated = true;
				}
				if(ext.initialized){
					if(!fn.isInitialized()){
						if(typeof(fn.init) == "function"){
							if($rootScope.data_main.pages_excludes.includes(ext.name.toLowerCase())){
								$scope.extensions[ext.name].status = $scope.stopped;
								fn.init(true)
							} else {
								$scope.extensions[ext.name].status = $scope.running;
								fn.init()
							}
						}
						if(typeof(fn.analytics) == "function"){fn.analytics()}
					} else {
						if(typeof(fn.start) == "function"){
							if(!$rootScope.data_main.pages_excludes.includes(ext.name.toLowerCase())){
								$scope.extensions[ext.name].status = $scope.running;
								fn.start()
							} else {
								$scope.extensions[ext.name].status = $scope.stopped;
							}
						}
					}
				} else {
					$scope.extensions[ext.name].status = $scope.stopped
					fn.stop();
				}
			}

			toggle = false;

			$rootScope.data_main.setExtensions($scope.extensions);

			services.$timeout(function(){
				update()	
			}, 3000)
		};

		$scope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function($event, data) {
			if(!data){return} 
			if(data.name == "ALERT"){
				if(!toggle){
					update();
				} else {
					services.$timeout(function(){update()}, 3000)
				}
			}
		})

		$scope.toggleValueInit = function(ext) {
			$scope.extensions[ext.name].auto_initialize = ext.auto_initialize
			$rootScope.data_main.setExtensions($scope.extensions);
			update()
		};

		$scope.$on(providers.eventTypeProvider.CHANGE_TIME_CORRECTION, function() {
			update()
		})

		update()

		return $scope;
	}
})