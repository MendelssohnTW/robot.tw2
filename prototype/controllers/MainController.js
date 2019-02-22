define("robotTW2/controllers/MainController", [
	"robotTW2",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/conf",
	"robotTW2/databases/data_main"
	], function(
			robotTW2,
			services,
			providers,
			conf,
			data_main
	){
	return function MainController($scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
		var self = this;
		var toggle = false;

		$scope.data_main = data_main;

		$scope.text_version = "-" + $scope.version + " " + data_main.version; 


		var update = function(){
			$scope.extensions = $scope.data_main.getExtensions();
			for (var extension in $scope.extensions) {
				$scope.extensions[extension.toUpperCase()].hotkey ? $scope.extensions[extension.toUpperCase()].hotkey = conf.HOTKEY[extension.toUpperCase()].toUpperCase() : null;
				$scope.toggleValueState(extension)
			}
			if (!$scope.$$phase) $scope.$apply();

		}
		, updateCorrection = function(){
			if (!$scope.$$phase) $scope.$apply();
		}

		$scope.recalibrate = function(){
			services.AttackService.calibrate_time();
		}

		$scope.toggleValueState = function(name) {
			let ext = $scope.extensions[name]
			if(!ext.initialized){
				ext.auto_initialize = false;
			}
			var arFn = robotTW2.requestFn.get(name.toLowerCase(), true);
			if(!arFn) {
				ext.activated = false;
				ext.status = $scope.disabled;
			} else {
				var fn = arFn.fn;
				if(ext.initialized){
					if(!fn.isInitialized()){
						if(typeof(fn.init) == "function"){
							if($scope.data_main.pages_excludes.includes(name.toLowerCase())){
								ext.status = $scope.stopped;
								fn.init(true)
							} else {
								ext.status = $scope.running;
								fn.init()
							}
						}
						if(typeof(fn.analytics) == "function"){fn.analytics()}
					} else {
						if(typeof(fn.start) == "function"){
							if(!$scope.data_main.pages_excludes.includes(name.toLowerCase())){
								ext.status = $scope.running;
								fn.start()
							} else {
								ext.status = $scope.stopped;
							}
						}
					}
				} else {
					ext.status = $scope.stopped
					if(ext.activated){
						fn.stop();
					}
				}
			}

			services.$timeout(function(){
				if(typeof(fn.isPaused) == "function"){
					fn.isRunning() && fn.isPaused() ? ext.status = $scope.paused : fn.isRunning() && !fn.isPaused() ? ext.status = $scope.running : ext.status = $scope.stopped;						
				} else {
					fn.isRunning() ? ext.status = $scope.running : ext.status = $scope.stopped;
				}	
			}, 3000)
		};

		$scope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function($event, data) {
			if(!data){return} 
			services.$timeout(function(){update()}, 3000)
		})

		$scope.toggleValueInit = function(ext) {
			$scope.extensions[ext.name].auto_initialize = ext.auto_initialize
			$scope.data_main.setExtensions($scope.extensions);
			update()
		};

		$scope.$on(providers.eventTypeProvider.CHANGE_TIME_CORRECTION, function() {
			updateCorrection()
		})

		$scope.$on("$destroy", function() {
			$scope.data_main.setExtensions($scope.extensions);
		});

		update()

		return $scope;
	}
})