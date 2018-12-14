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
	var data_attack = database.get("data_attack")
	, db_attack = {};

	db_attack.set = function(){
		database.set("data_attack", data_attack, true)
	}

	db_attack.get = function(){
		return database.get("data_attack")
	}

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
		if(!data_attack.version || (typeof(data_attack.version) == "number" ? data_attack.version.toString() : data_attack.version) < conf.VERSION.ATTACK){
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

	services.$rootScope.data_attack = data_attack;

	services.$rootScope.$watch("data_attack", function(){
		data_attack.set()
	}, true)

	return data_attack;
})
