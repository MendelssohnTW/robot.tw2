var $rootScope = angular.element(document).scope()
define("robotTW2/services", [], function() {
	return {
		$timeout : injector.get("$timeout"),
		$filter : injector.get("$filter"),
		hotkeys : injector.get("hotkeys"),
		modelDataService : injector.get("modelDataService"),
		socketService : injector.get("socketService"),
		httpService : injector.get("httpService"),
		groupService : injector.get("groupService"),
		windowManagerService : injector.get("windowManagerService"),
		villageService : injector.get("villageService"),
		buildingService : injector.get("buildingService"),
		overviewService : injector.get("overviewService"),
		windowManagerService : injector.get("windowManagerService")
	}
})
,
define("robotTW2/providers", function() {
	var eventTypeProvider = injector.get("eventTypeProvider")
	, routeProvider = injector.get("routeProvider")
	angular.merge(eventTypeProvider, {
		"OPEN_ATTACK"			: "Internal/robotTW2/open_attack",
		"HEADQUARTER_READY"		: "Internal/robotTW2/headquarter_ready",
	})
	angular.merge(routeProvider, {
		"INIT_DATA":{
			type:"init_data",
			data:["character_id"],
		}
	})

	return {
		eventTypeProvider : eventTypeProvider,
		routeProvider : routeProvider
	}

})
