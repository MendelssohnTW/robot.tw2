define("robotTW2/databases/data_attack", [
	"robotTW2/databases/database",
	"robotTW2/conf",
	"robotTW2/services",
	"robotTW2/notify",
	"helper/time"
	], function(
			database,
			conf,
			services,
			notify,
			helper
	) {
	var db_attack = {};
	
	db_attack.set = function(db_attack){
		if(db_attack){
			database.set("data_attack", db_attack, true)
		} else {
			database.set("data_attack", data_attack, true)
		}
	}

	db_attack.get = function(){
		return database.get("data_attack")
	}

	db_attack.getTimeCicle = function(){
		return database.get("data_attack").interval
	}

	db_attack.setTimeCicle = function(timecicle){
		if(timecicle){
			var data = database.get("data_attack")
			data.interval = timecicle
			database.set("data_attack", data, true)
		}
	}

	db_attack.setTimeComplete = function(time){
		if(time){
			var data = database.get("data_attack")
			data.completed_at = time
			database.set("data_attack", data, true)
		}
	}

	var data_attack = database.get("data_attack");
	var dataNew = {
			auto_initialize			: false,
			initialized 			: false,
			activated 				: false,
			hotkey					: conf.HOTKEY.ATTACK,
			interval				: conf.INTERVAL.ATTACK,
			version					: conf.VERSION.ATTACK,
			commands				: {}
	}

	if(!data_attack){
		data_attack = dataNew
		database.set("data_attack", data_attack, true)
	} else {
		if(!data_attack.version || data_attack.version < conf.VERSION.ATTACK){

			data_attack = dataNew
			database.set("data_attack", data_attack, true)
			notify("data_attack");
		} else {
			if(!data_attack.auto_initialize) data_attack.initialized = !1;
			if(data_attack.auto_initialize) data_attack.initialized = !0;
			database.set("data_attack", data_attack, true)		
		}
	}

	Object.setPrototypeOf(data_attack, db_attack);

	return data_attack;
})
