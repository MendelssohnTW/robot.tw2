
!function(root, factory){
	if (typeof exports !== "undefined") {
		if (typeof module !== "undefined" && module.exports) {
			exports = module.exports = factory(root, exports)
		}
	} else if (typeof define === "function" && define.amd) {
		define("robotTW2", function(){
			return factory(root)}
		);
	} else {
		root.robotTW2 = factory(root, {})
	}

}(this, function(root){
	"use strict";
	return function(){
		
		require([
			"robotTW2/ready", 
			"robotTW2/builderWindow",
			"robotTW2/services",
			"robotTW2/providers",
			"robotTW2/main",
			"robotTW2/main/ui",
			"app"
			], function(
					ready, 
					builderWindow,
					services,
					providers,
					main,
					mainUI,
					app
			){
			ready(function() {
				if (!builderWindow.isInitialized()){
					builderWindow.init()
				}
				if (!main.isInitialized()){
					services.hotkeys.add("esc", function() {
						$rootScope.$broadcast(providers.eventTypeProvider.WINDOW_CLOSED)
					}, ["INPUT", "SELECT", "TEXTAREA"])
					main.init()
					main.build()
				}
				return 
			})
		})
	}
})
, function(){
	require(["robotTW2"], function(robotTW2){
		this.robotTW2 = robotTW2;
		robotTW2();
	});

}.call(this)
