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
	var db_alert = {};
	db_alert.set = function(db_alert){
		if(db_alert){
			database.set("data_alert", db_alert, true)
		} else {
			database.set("data_alert", data_alert, true)
		}
	}

	db_alert.get = function(){
		return database.get("data_alert")
	}

	db_alert.setFriends = function(friends){
		var data_alert = database.get("data_alert")
		if(friends){
			data_alert.friends = friends;
			database.set("data_alert", data_alert, true)
		}
	}

	db_alert.getFriends = function(){
		return database.get("data_alert").friends
	}

	db_alert.getTimeCicle = function(){
		return database.get("data_alert").interval
	}

	db_alert.setTimeCicle = function(timecicle){
		if(timecicle){
			var data = database.get("data_alert")
			data.interval = timecicle
			database.set("data_alert", data, true)
		}
	}

	db_alert.setTimeComplete = function(time){
		if(time){
			var data = database.get("data_alert")
			data.completed_at = time
			database.set("data_alert", data, true)
		}
	}

	var data_alert = database.get("data_alert");
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

	return data_alert;
})
