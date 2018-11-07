define("robotTW2/databases/data_recruit", [
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
	var db_recruit = {};

	db_recruit.set = function(db_recruit){
		if(db_recruit){
			database.set("data_recruit", db_recruit, true)
		} else {
			database.set("data_recruit", data_recruit, true)
		}
	}

	db_recruit.get = function(){
		return database.get("data_recruit")
	}

	db_recruit.getTimeCicle = function(){
		return database.get("data_recruit").interval
	}

	db_recruit.setTimeCicle = function(timecicle){
		if(timecicle){
			var data = database.get("data_recruit")
			data.interval = timecicle
			database.set("data_recruit", data, true)
		}
	}

	db_recruit.setTimeComplete = function(time){
		if(time){
			var data = database.get("data_recruit")
			data.completed_at = time
			database.set("data_recruit", data, true)
		}
	}

	var data_recruit = database.get("data_recruit");
	var dataNew = {
			auto_initialize			: false,
			initialized 			: false,
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
			troops_not				: conf.TROOPS_NOT,
			groups					: {}
	}

	if(!data_recruit){
		data_recruit = dataNew
		database.set("data_recruit", data_recruit, true)
	} else {
		if(!data_recruit.version || data_recruit.version < conf.VERSION.RECRUIT){

			data_recruit = dataNew
			database.set("data_recruit", data_recruit, true)
			notify("data_recruit");
		} else {
			if(!data_recruit.auto_initialize) data_recruit.initialized = !1;
			if(data_recruit.auto_initialize) data_recruit.initialized = !0;
			database.set("data_recruit", data_recruit, true)		
		}
	}

	Object.setPrototypeOf(data_recruit, db_recruit);

	return data_recruit;
})