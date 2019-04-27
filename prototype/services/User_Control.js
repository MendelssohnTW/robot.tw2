define("robotTW2/services/User_Control", [
	"robotTW2",
	"robotTW2/conf",
	"conf/conf",
	"robotTW2/getJSON"
	], function(
			robotTW2,
			conf,
			conf_conf,
			getJSON
	){
	return (function User_Control(
			$rootScope,
			socketService,
			providers,
			modelDataService,
			$timeout
	) {

		let user_control =  new getJSON("user_control")

		$timeout(function(){
			let name = robotTW2.services.modelDataService.getPlayer().getSelectedCharacter().getName()
			, id = robotTW2.services.modelDataService.getPlayer().getSelectedCharacter().getId()
			, world_id = robotTW2.services.modelDataService.getPlayer().getSelectedCharacter().getWorldId()
			, server = world_id.slice(0,2)
			, world = world_id.slice(2,4)
			if(Object.keys(user_control).length){
				if(Object.keys(user_control).find(f=>f==server)){
					if(Object.keys(user_control[server]).length){
						if(Object.keys(user_control[server]).find(f=>f==world)){
							if(Object.keys(user_control[server][world]).length){
								if(Object.keys(user_control[server][world])[id].length){
									if(Object.keys(user_control[server][world])[id] == name){
										$rootScope.$broadcast("ready_users", true)
									}
								}
							}
						}
					}				
				}
			}
			$rootScope.$broadcast("ready_users", false)
		}, 5000)


	})(
			robotTW2.services.$rootScope,
			robotTW2.services.socketService,
			robotTW2.providers,
			robotTW2.services.modelDataService,
			robotTW2.services.$timeout
	)
})