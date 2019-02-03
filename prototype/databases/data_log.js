define("robotTW2/databases/data_logs", [
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
	var data_logs = database.get("data_logs")
	, db_logs = {};
	
	db_logs.set = function(){
			database.set("data_logs", data_logs, true)
	}

	db_logs.get = function(){
		return database.get("data_logs")
	}

	var dataNew = {
			farm		: [],
			headquarter	: [],
			attack 		: [],
			defense		: [],
			data		: [],
			recruit		: [],
			spy			: [],
			version		: conf.VERSION.LOGS,
	}

	if(!data_logs){
		data_logs = dataNew
		database.set("data_logs", data_logs, true)
	} else {
		if(!data_logs.version || (typeof(data_logs.version) == "number" ? data_logs.version.toString() : data_logs.version) < conf.VERSION.ALERT){
			data_logs = dataNew
			notify("data_logs");
		} else {
			if(!data_logs.auto_initialize) data_logs.initialized = !1;
			if(data_logs.auto_initialize) data_logs.initialized = !0;
		}
		database.set("data_logs", data_logs, true)
	}

	Object.setPrototypeOf(data_logs, db_logs);
	
	return data_logs;
})
