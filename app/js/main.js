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
	"robotTW2/requestFn",
	"robotTW2/services",
	"robotTW2/conf"
	], function(
			main,
			builderWindow,
			data_main,
			requestFn,
			services,
			conf
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
				fn.build();
			}
		}
		data_main.setExtensions(extensions);
		return $window
	}
	, injectScope = function() {

		var $scope = $window.$data.scope;
		$scope.extension_disabled = services.$filter("i18n")("extension_disabled", $rootScope.loc.ale, "main");
		$scope.title = services.$filter("i18n")("title", $rootScope.loc.ale, "main");
		$scope.introducing = services.$filter("i18n")("introducing", $rootScope.loc.ale, "main");
		$scope.settings = services.$filter("i18n")("settings", $rootScope.loc.ale, "main");
		$scope.init_standard = services.$filter("i18n")("init_standard", $rootScope.loc.ale, "main");
		$scope.module = services.$filter("i18n")("module", $rootScope.loc.ale, "main");
		$scope.text_hotkey = services.$filter("i18n")("text_hotkey", $rootScope.loc.ale, "main");
		$scope.state = services.$filter("i18n")("state", $rootScope.loc.ale, "main");
		$scope.save = services.$filter("i18n")("SAVE", $rootScope.loc.ale);
		$scope.close = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		$scope.extensions = data_main.getExtensions();
		$scope.hotkeys = conf.HOTKEY;

		$scope.gethotkey = function(a) {
			return $scope.hotkeys[a] ? $scope.hotkeys[a].toUpperCase() : "";
		}

		$scope.toggleValueState = function(key, value) {
			if(!value.ATIVATE){
				value.INIT_ATIVATE = false;
				$scope.extensions[key].INIT_ATIVATE = value.INIT_ATIVATE
			}
			$scope.extensions[key].ATIVATE = value.ATIVATE
			data_main.setExtensions($scope.extensions);
			var fn = requestFn.get(key.toLowerCase(), true);
			if(value.ATIVATE){
				if(fn.isInitialized())
					return !1;	
				fn.init();
				fn.build();
			} else {
				if(!fn.isInitialized())
					return !1;	
				if(fn.isRunning())
					fn.stop();
			}
			if (!$rootScope.$$phase) $rootScope.$apply();
		};

		$scope.toggleValueInit= function(key, value) {
			$scope.extensions[key].INIT_ATIVATE = value.INIT_ATIVATE
			data_main.setExtensions($scope.extensions);
			if (!$rootScope.$$phase) $rootScope.$apply();
		};

		if (!$rootScope.$$phase) {
			$rootScope.$apply();
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
