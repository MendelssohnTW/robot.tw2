define("robotTW2/databases/data_attack", [
	"robotTW2/databases/database",
	"robotTW2/conf",
	"robotTW2/services",
//	"robotTW2/notify",
	"helper/time"
	], function(
			database,
			conf,
			services,
//			notify,
			helper
	) {

	var set = function(data_attack){
		if(data_attack){
			database.set("data_attack", data_attack, true)
		}
	}

	var get = function(){
		return database.get("data_attack")
	}

	var getTimeCicle = function(){
		return database.get("data_attack").interval
	}

	var setTimeCicle = function(timecicle){
		if(timecicle){
			var data = database.get("data_attack")
			data.interval = timecicle
			database.set("data_attack", data, true)
		}
	}

	var setTimeComplete = function(time){
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

	var fn = {
			setAttack				: setAttack,
			getAttack				: getAttack,
			getTimeCicle			: getTimeCicle,
			setTimeCicle			: setTimeCicle,
			setTimeComplete			: setTimeComplete
	}

	Object.setPrototypeOf(data_attack, fn);

	return data_attack;
})
