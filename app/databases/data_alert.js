define("robotTW2/databases/data_alert", [
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
	var data_alert = database.get("data_alert")
	, db_alert = {};
	
	db_alert.set = function(){
			database.set("data_alert", data_alert, true)
	}

	db_alert.get = function(){
		return database.get("data_alert")
	}

	var dataNew = {
			auto_initialize			: false,
			initialized 			: false,
			activated 				: false,
			hotkey					: conf.HOTKEY.ALERT,
			interval	 			: conf.INTERVAL.ALERT,
			version					: conf.VERSION.ALERT,
			friends					: []
	}

	if(!data_alert){
		data_alert = dataNew
		database.set("data_alert", data_alert, true)
	} else {
		if(!data_alert.version || data_alert.version < conf.VERSION.ALERT){
			data_alert = dataNew
			notify("data_alert");
		} else {
			if(!data_alert.auto_initialize) data_alert.initialized = !1;
			if(data_alert.auto_initialize) data_alert.initialized = !0;
		}
		database.set("data_alert", data_alert, true)
	}

	Object.setPrototypeOf(data_alert, db_alert);
	
	services.$rootScope.data_alert = data_alert;

	services.$rootScope.$watchCollection("data_alert", function(){
		data_alert.set()
	})

	return data_alert;
})
