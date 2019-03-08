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
		$scope.START = services.$filter("i18n")("START", services.$rootScope.loc.ale);
		$scope.STOP = services.$filter("i18n")("STOP", services.$rootScope.loc.ale);
		$scope.version = services.$filter("i18n")("version", services.$rootScope.loc.ale);
		var self = this
		, toggle = false

		$scope.data_main = data_main;

		$scope.text_version = $scope.version + " " + data_main.version; 

		$scope.extensions = $scope.data_main.getExtensions();
		$scope.extensions_status = {};

		$scope.getStatus = function getStatus(fn){
			var status;
			if(typeof(fn.isPaused) == "function"){
				fn.isRunning() && fn.isPaused() ? status = $scope.paused : fn.isRunning() && !fn.isPaused() ? status = $scope.running : status = $scope.stopped;						
			} else {
				fn.isRunning() ? status = $scope.running : status = $scope.stopped;
			}
			return status;
		}
		
		for (var name in $scope.extensions) {
			$scope.extensions[name.toUpperCase()].hotkey ? $scope.extensions[name.toUpperCase()].hotkey = conf.HOTKEY[name.toUpperCase()].toUpperCase() : null;
			var arFn = robotTW2.requestFn.get(name.toLowerCase(), true);
			var fn = arFn.fn;
			$scope.extensions[name].status = $scope.getStatus(fn);
			if($scope.extensions[name].status == running){
				$scope.extensions_status[name] = true;	
			} else {
				$scope.extensions_status[name] = false;
			}
		};

		var updateCorrection = function(){
			if (!$scope.$$phase) $scope.$apply();
		}
		, update_status = function(){
			for (var name in $scope.extensions) {
//				$scope.extensions[name.toUpperCase()].hotkey ? $scope.extensions[name.toUpperCase()].hotkey = conf.HOTKEY[name.toUpperCase()].toUpperCase() : null;
				var arFn = robotTW2.requestFn.get(name.toLowerCase(), true);
				var fn = arFn.fn;
				$scope.extensions[name].status = $scope.getStatus(fn);
			}
			if (!$scope.$$phase) {$scope.$apply()}
		}
		, startExt = function(name){
			var arFn = robotTW2.requestFn.get(name.toLowerCase(), true);
			var fn = arFn.fn;
			if(!fn.isInitialized()){
				if(typeof(fn.init) == "function"){
					if(!fn.isRunning()){
						fn.init()
					}
				}
				if(typeof(fn.analytics) == "function"){fn.analytics()}
			} else {
				if(typeof(fn.start) == "function"){
					if(!fn.isRunning()){
						if($scope.data_main.pages_excludes.includes(name.toLowerCase())){
							fn.init(true)
						} else {
							fn.init()
						}
						fn.start()
					}
				}
			}
		}
		, stopExt = function(name){
			var arFn = robotTW2.requestFn.get(name.toLowerCase(), true);
			var fn = arFn.fn;
			if(typeof(fn.stop) == "function"){
				if(fn.isRunning()){
					fn.stop()
				}
			}
		};

		$scope.recalibrate = function(){
			services.AttackService.calibrate_time();
		}

		$scope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function($event, data) {
			if(!data){return} 
			services.$timeout(function(){update_status()}, 1500)
		})

		$scope.toggleValueInit = function(ext) {
			$scope.extensions[ext.name].auto_start = ext.auto_start
			$scope.data_main.setExtensions($scope.extensions);
		};
		
		$scope.toggleStartStop = function(ext) {
			if($scope.extensions_status[ext.name]){
				stopExt(ext.name);
			} else {
				startExt(ext.name);
			}
		};
		
		$scope.openExt = function(name) {
		};

		$scope.$on(providers.eventTypeProvider.CHANGE_TIME_CORRECTION, function() {
			updateCorrection()
		})

		$scope.$on("$destroy", function() {
			$scope.data_main.setExtensions($scope.extensions);
		});

		return $scope;
	}
})