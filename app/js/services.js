var $rootScope = angular.element(document).scope()
define("robotTW2/services", [], function() {
	return {
		$timeout 				: injector.get("$timeout"),
		$filter 				: injector.get("$filter"),
		hotkeys 				: injector.get("hotkeys"),
		modelDataService 		: injector.get("modelDataService"),
		socketService 			: injector.get("socketService"),
		httpService 			: injector.get("httpService"),
		groupService 			: injector.get("groupService"),
		windowManagerService 	: injector.get("windowManagerService"),
		premiumActionService 	: injector.get("premiumActionService"),
		villageService 			: injector.get("villageService"),
		buildingService 		: injector.get("buildingService"),
		overviewService 		: injector.get("overviewService"),
		windowManagerService 	: injector.get("windowManagerService")
	}
})
,
define("robotTW2/providers", function() {
	var eventTypeProvider = injector.get("eventTypeProvider")
	, routeProvider = injector.get("routeProvider")
	angular.merge(eventTypeProvider, {
		"ISRUNNING_CHANGE"				: "Internal/robotTW2/isrunning_change",
		"RESUME_CHANGE_FARM"			: "Internal/robotTW2/resume_change_farm",
		"RESUME_CHANGE_RECRUIT"			: "Internal/robotTW2/resume_change_recruit",
		"INTERVAL_CHANGE_RECRUIT"		: "Internal/robotTW2/interval_change_recruit",
		"RESUME_CHANGE_HEADQUARTER"		: "Internal/robotTW2/resume_change_headquarter",
		"INTERVAL_CHANGE_HEADQUARTER"	: "Internal/robotTW2/interval_change_headquarter"
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
