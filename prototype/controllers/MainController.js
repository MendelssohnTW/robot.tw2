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
		var self = this
		, toggle = false
		, list_extensions = {}

		$scope.data_main = data_main;

		$scope.text_version = $scope.version + " " + data_main.version; 

		$scope.extensions = $scope.data_main.getExtensions();
		
		var update_status = function(){
			for (var extension in $scope.extensions) {
				
			}
		}
		
		$scope.getStatus = function getStatus(fn){
			if(typeof(fn) == "string"){
				fn = list_extensions[fn].fn
			}
			if(typeof(fn.isPaused) == "function"){
				fn.isRunning() && fn.isPaused() ? list_extensions[name].status = $scope.paused : fn.isRunning() && !fn.isPaused() ? list_extensions[name].status = $scope.running : status = $scope.stopped;						
			} else {
				fn.isRunning() ? list_extensions[name].status = $scope.running : list_extensions[name].status = $scope.stopped;
			}
			return list_extensions[fn.name.toUpperCase()].status
		}
		
		for (var name in $scope.extensions) {
			$scope.extensions[name.toUpperCase()].hotkey ? $scope.extensions[name.toUpperCase()].hotkey = conf.HOTKEY[name.toUpperCase()].toUpperCase() : null;
			var arFn = robotTW2.requestFn.get(name.toLowerCase(), true);
			var fn = arFn.fn;
			list_extensions[name] = {
					"fn" 		: fn,
					"status"	: getStatus(fn)
			}
		}

		var update = function(){
			$scope.extensions = $scope.data_main.getExtensions();
			for (var extension in $scope.extensions) {
				$scope.extensions[extension.toUpperCase()].hotkey ? $scope.extensions[extension.toUpperCase()].hotkey = conf.HOTKEY[extension.toUpperCase()].toUpperCase() : null;
				$scope.toggleValueState(extension, true)
			}
			if (!$scope.$$phase) $scope.$apply();

		}
		, updateCorrection = function(){
			if (!$scope.$$phase) $scope.$apply();
		}

		$scope.recalibrate = function(){
			services.AttackService.calibrate_time();
		}

		$scope.startExt = function(name){
			if(!list_extensions[name].fn.isInitialized()){
				if(typeof(list_extensions[name].fn.init) == "function"){
					if(!list_extensions[name].fn.isRunning()){
						list_extensions[name].fn.init()
					}
				}
				if(typeof(list_extensions[name].fn.analytics) == "function"){list_extensions[name].fn.analytics()}
			} else {
				if(typeof(list_extensions[name].fn.start) == "function"){
					if(!list_extensions[name].fn.isRunning()){
						list_extensions[name].fn.start()
					}
				}
			}
		}

		$scope.stopExt = function(name){
			let ext = $scope.extensions[name]
			if(typeof(list_extensions[name].fn.stop) == "function"){
				if(list_extensions[name].fn.isRunning()){
					list_extensions[name].fn.stop()
				}
			}
		}

		$scope.toggleValueState = function(name, opt) {
			let ext = $scope.extensions[name]
//			if(!ext.init_initialized){
//			ext.auto_start = false;
//			}
			var arFn = robotTW2.requestFn.get(name.toLowerCase(), true);
		};

		$scope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function($event, data) {
			if(!data){return} 
			services.$timeout(function(){update()}, 3000)
		})

		$scope.toggleValueInit = function(ext) {
			$scope.extensions[ext.name].auto_start = ext.auto_start
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