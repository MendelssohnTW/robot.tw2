require(["robotTW2/time", "helper/time"], function(convertedTime, helper){
	var modelDataService = injector.get("modelDataService")
	var socketService = injector.get("socketService")
	var eventTypeProvider = injector.get("eventTypeProvider")
	var routeProvider = injector.get("routeProvider")
	var $timeout = injector.get("$timeout")
	var $rootScope = injector.get("$rootScope")
	var villages = modelDataService.getVillages()
	, village = villages[Object.keys(villages).shift()]
	, units = {}
	, unitInfo = village.unitInfo.getUnits()
	, listener_completed = undefined
	, gTime
	, duration = undefined
	, timetable = modelDataService.getGameData().data.units.map(function(obj, index, array){
		return [obj.speed * 60, obj.name]
	}).map(m => {
		return [m[0], m[1]];
	}).sort((a, b) => {
		return a[0] - b[0];
	})
	, units = {}
	, unitInfo = village.unitInfo.getUnits();

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

	if(!units){
		console.log("no units")
		return
	}

	var newTimeTable = [];

	if(Object.keys(units).find(f=> f == "knight")) {
		newTimeTable.push([480, "light_cavalry"])
	} else {
		timetable.map(m => {
			if(Object.keys(units).find(f=> f == m[1])) {newTimeTable.push(m)}
		});
	}

	var timeCampo = newTimeTable.sort((a, b) => {
		return b[0] - a[0];
	})[0][0];

	socketService.emit(providers.routeProvider.MAP_GET_NEAREST_BARBARIAN_VILLAGE, {
		'x' : village.data.x,
		'y' : village.data.y
	}, function(bb) {
		if (bb) {

			var x1 = village.getX(), 
			y1 = village.getY(), 
			x2 = bb.x, 
			y2 = bb.y;

			if (y1 % 2) //se y é impar
				x1 += .5;
			if (y2 % 2)
				x2 += .5;
			var dy = y1 - y2,
			dx = x1 - x2; 

			var distancia = Math.abs(Math.sqrt(Math.pow(dx,2) + (Math.pow(dy,2) * 0.75)));
			duration = helper.unreadableSeconds(helper.readableSeconds(timeCampo * distancia, false))

			$timeout(function(){
				listener_completed ? listener_completed() : listener_completed;
				listener_completed = undefined;
				listener_completed = $rootScope.$on(providers.eventTypeProvider.COMMAND_SENT, function ($event, data){
					if(!data){return;}
					if(data.direction =="forward" && data.origin.id == village.data.villageId){
						var outgoing = modelDataService.getSelectedCharacter().getVillage(village.data.villageId).data.commands.outgoing;
						var completedAt = outgoing[Object.keys(outgoing).pop()].completedAt;
						var dif = completedAt - duration * 1000 - gTime;
						if(!$rootScope.data_main.max_time_correction || (dif > -$rootScope.data_main.max_time_correction && dif < $rootScope.data_main.max_time_correction)) {
							$rootScope.data_main.time_correction_command = dif
							$rootScope.$broadcast(providers.eventTypeProvider.CHANGE_TIME_CORRECTION)
						}
						$timeout(function(){
							socketService.emit(providers.routeProvider.COMMAND_CANCEL, {
								command_id: data.command_id
							})
						}, 5000)
						listener_completed();
						listener_completed = undefined;
					}
				})
				gTime = convertedTime();
				socketService.emit(providers.routeProvider.SEND_CUSTOM_ARMY, {
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