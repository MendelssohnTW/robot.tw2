define("robotTW2/databases/data_log", [
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
	var data_log = database.get("data_log")
	, db_log = {};
	
	db_log.set = function(){
			database.set("data_log", data_log, true)
	}

	db_log.get = function(){
		return database.get("data_log")
	}

	var dataNew = {
			auto_start				: false,
			init_initialized 		: false,
			activated 				: false,
			farm		: [],
			headquarter	: [],
			attack 		: [],
			defense		: [],
			data		: [],
			recruit		: [],
			spy			: [],
			version		: conf.VERSION.LOG,
	}

	if(!data_log){
		data_log = dataNew
		database.set("data_log", data_log, true)
	} else {
		if(!data_log.version || (typeof(data_log.version) == "number" ? data_log.version.toString() : data_log.version) < conf.VERSION.ALERT){
			data_log = dataNew
			notify("data_log");
		} else {
			if(!data_log.auto_start) data_log.init_initialized = !1;
			if(data_log.auto_initialize) data_log.init_initialized = !0;
		}
		database.set("data_log", data_log, true)
	}

	Object.setPrototypeOf(data_log, db_log);
	
	return data_log;
})
