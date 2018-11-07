define("robotTW2/databases/data_defense", [
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
	
	var db_defense = {};
	
	db_defense.set = function(db_defense){
		if(db_defense){
			database.set("data_defense", db_defense, true)
		} else {
			database.set("data_defense", data_defense, true)
		}
	}

	db_defense.get = function(){
		return database.get("data_defense")
	}

	db_defense.getTimeCicle = function(){
		return database.get("data_defense").interval
	}

	db_defense.setTimeCicle = function(timecicle){
		if(timecicle){
			var data = database.get("data_defense")
			data.interval = timecicle
			database.set("data_defense", data, true)
		}
	}

	db_defense.setTimeComplete = function(time){
		if(time){
			var data = database.get("data_defense")
			data.completed_at = time
			database.set("data_defense", data, true)
		}
	}

	var data_defense = database.get("data_defense");
	var dataNew = {
			auto_initialize			: false,
			initialized 			: false,
			activated 				: false,
			hotkey					: conf.HOTKEY.DEFENSE,
			time_correction_command	: conf.TIME_CORRECTION_COMMAND,
			interval				: conf.INTERVAL.DEFENSE,
			version					: conf.VERSION.DEFENSE,
			time_sniper_ant			: conf.TIME_SNIPER_ANT,
			time_sniper_post		: conf.TIME_SNIPER_POST,
			commands				: {}
	}

	if(!data_defense){
		data_defense = dataNew
		database.set("data_defense", data_defense, true)
	} else {
		if(!data_defense.version || data_defense.version < conf.VERSION.DEFENSE){

			data_defense = dataNew
			database.set("data_defense", data_defense, true)
			notify("data_defense");
		} else {
			if(!data_defense.auto_initialize) data_defense.initialized = !1;
			if(data_defense.auto_initialize) data_defense.initialized = !0;
			database.set("data_defense", data_defense, true)		
		}
	}

	Object.setPrototypeOf(data_defense, db_defense);

	return data_defense;
})