define("robotTW2/databases/data_headquarter", [
	"robotTW2/databases/database",
	"robotTW2/conf",
	"robotTW2/services",
	"robotTW2/notify"
	], function(
			database,
			conf,
			services,
			notify
	) {
	var data_headquarter = database.get("data_headquarter")
	, db_headquarter = {};

	db_headquarter.set = function(){
		database.set("data_headquarter", data_headquarter, true)
	}

	db_headquarter.get = function(){
		return database.get("data_headquarter")
	}

	var dataNew = {
			auto_initialize			: false,
			initialized 			: false,
			activated 				: false,
			hotkey					: conf.HOTKEY.HEADQUARTER,
			interval				: conf.INTERVAL.HEADQUARTER,
			time_complete			: 0,
			version					: conf.VERSION.HEADQUARTER,
			seq						: false,
			reserva 				: {
				food			: conf.RESERVA.HEADQUARTER.FOOD,
				wood			: conf.RESERVA.HEADQUARTER.WOOD,
				clay			: conf.RESERVA.HEADQUARTER.CLAY,
				iron			: conf.RESERVA.HEADQUARTER.IRON,
				slots			: conf.RESERVA.HEADQUARTER.SLOTS
			},
			buildingorder 			: conf.BUILDINGORDER.academy,
			buildinglimit 			: conf.BUILDINGLIMIT.academy,
			buildinglevels 			: conf.BUILDINGLEVELS,
			selects				: Object.keys(conf.BUILDINGORDER)
	}

	if(!data_headquarter){
		data_headquarter = dataNew
		database.set("data_headquarter", data_headquarter, true)
	} else {
		if(!data_headquarter.version || (typeof(data_headquarter.version) == "number" ? data_headquarter.version.toString() : data_headquarter.version) < conf.VERSION.HEADQUARTER){

			data_headquarter = dataNew
			database.set("data_headquarter", data_headquarter, true)
			notify("data_headquarter");
		} else {
			if(!data_headquarter.auto_initialize) data_headquarter.initialized = !1;
			if(data_headquarter.auto_initialize) data_headquarter.initialized = !0;
			database.set("data_headquarter", data_headquarter, true)		
		}
	}

	Object.setPrototypeOf(data_headquarter, db_headquarter);
	
	services.$rootScope.data_headquarter = data_headquarter;

	services.$rootScope.$watch("data_headquarter", function(){
		data_headquarter.set()
	}, true)

	return data_headquarter;
})