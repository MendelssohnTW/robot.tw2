require(["robotTW2/time"], function(convertedTime){
	var modelDataService = injector.get("modelDataService")
	var socketService = injector.get("socketService")
	var eventTypeProvider = injector.get("eventTypeProvider")
	var routeProvider = injector.get("routeProvider")
	var $timeout = injector.get("$timeout")
	var $rootScope = injector.get("$rootScope")
	var villages = modelDataService.getVillages();
	var village = villages[Object.keys(villages).shift()];
	var units = {};
	var unitInfo = village.unitInfo.getUnits();
	var listener_completed = undefined;
	var gTime;
	var gId;
	var vId;

	var units = {};
	var unitInfo = village.unitInfo.getUnits();
	if (!unitInfo) {return};
	for(obj in unitInfo){
		if (unitInfo.hasOwnProperty(obj)){
			if (unitInfo[obj].available > 0){
				var campo = {[obj]: unitInfo[obj].available};
				units[Object.keys(campo)[0]] = 
					Object.keys(campo).map(function(key) {return campo[key]})[0];
			}
		}
	}

	console.log(village.data);

	if(!units){
		console.log("no units")
		return
	}
	socketService.emit(routeProvider.MAP_GET_NEAREST_BARBARIAN_VILLAGE, {
		'x' : village.data.x,
		'y' : village.data.y
	}, function(bb) {
		if (bb) {
			$timeout(function(){
				listener_completed ? listener_completed() : listener_completed;
				listener_completed = undefined;
				listener_completed = $rootScope.$on(eventTypeProvider.COMMAND_SENT, function ($event, data){
					console.log("sent")
					console.log(data)
					if(!data){return;}
					if(data.direction =="forward" && data.origin.id == village.data.id){
						socketService.emit(routeProvider.COMMAND_CANCEL, {
							command_id: data.command_id
						})
						listener_completed();
						listener_completed = undefined;
					}
				})
				gTime = convertedTime();
				gId = bb.id;
				socketService.emit(routeProvider.SEND_CUSTOM_ARMY, {
					start_village: village.getId(),
					target_village: bb.id,
					type: "support",
					units: units,
					icon: 0,
					officers: {},
					catapult_target: null
				});
			}, 1000);
		}
	});
})