define("robotTW2/databases/data_recruit", [
	"robotTW2/databases/database",
	"robotTW2/conf",
	"robotTW2/services",
	"robotTW2/notify",
	"robotTW2/providers"
	], function(
			database,
			conf,
			services,
			notify,
			providers
	) {
	var data_recruit = database.get("data_recruit")
	, db_recruit = {};

	db_recruit.set = function(){
			database.set("data_recruit", data_recruit, true)
	}

	db_recruit.get = function(){
		return database.get("data_recruit")
	}
	
	db_recruit.update = function($event){
		db_recruit.Groups = services.groupService.getGroups()
		db_recruit.GroupsKeys = Object.keys(services.groupService.getGroups())
		db_recruit.GroupsName = Object.keys(services.groupService.getGroups()).map(m => services.groupService.getGroups()[m].name)
		db_recruit.GroupsCount = Object.keys(services.groupService.getGroups()).length
	}

	var dataNew = {
			auto_start				: false,
			init_initialized 		: false,
			activated 				: false,
			hotkey					: conf.HOTKEY.RECRUIT,
			version					: conf.VERSION.RECRUIT,
			interval				: conf.INTERVAL.RECRUIT,
			reserva 				: {
				food			: conf.RESERVA.RECRUIT.FOOD,
				wood			: conf.RESERVA.RECRUIT.WOOD,
				clay			: conf.RESERVA.RECRUIT.CLAY,
				iron			: conf.RESERVA.RECRUIT.IRON,
				slots			: conf.RESERVA.RECRUIT.SLOTS
			},
			troops_not				: conf.TROOPS_NOT.RECRUIT,
			groups					: services.groupService.getGroups(),
	}

	if(!data_recruit){
		data_recruit = dataNew
		database.set("data_recruit", data_recruit, true)
	} else {
		if(!data_recruit.version || (typeof(data_recruit.version) == "number" ? data_recruit.version.toString() : data_recruit.version) < conf.VERSION.RECRUIT){

			data_recruit = dataNew
			database.set("data_recruit", data_recruit, true)
			notify("data_recruit");
		} else {
			if(!data_recruit.auto_start) data_recruit.init_initialized = !1;
			if(data_recruit.auto_start) data_recruit.init_initialized = !0;
			database.set("data_recruit", data_recruit, true)		
		}
	}
	
	services.$rootScope.$on(providers.eventTypeProvider.GROUPS_UPDATED, db_recruit.update);
	services.$rootScope.$on(providers.eventTypeProvider.GROUPS_CREATED, db_recruit.update);
	services.$rootScope.$on(providers.eventTypeProvider.GROUPS_DESTROYED, db_recruit.update);

	Object.setPrototypeOf(data_recruit, db_recruit);
	
	return data_recruit;
})