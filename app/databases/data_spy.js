define("robotTW2/databases/data_spy", [
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
	var db_spy = {};
	db_spy.set = function(data_spy){
		if(data_spy){
			database.set("data_spy", data_spy, true)
		}
	}

	db_spy.get = function(){
		return database.get("data_spy")
	}

	db_spy.getTimeCicle = function(){
		return database.get("data_spy").interval
	}

	db_spy.setTimeCicle = function(timecicle){
		if(timecicle){
			var data = database.get("data_spy")
			data.interval = timecicle
			database.set("data_spy", data, true)
		}
	}

	db_spy.setTimeComplete = function(time){
		if(time){
			var data = database.get("data_spy")
			data.completed_at = time
			database.set("data_spy", data, true)
		}
	}

	var data_spy = database.get("data_spy");
	var dataNew = {
			auto_initialize			: false,
			initialized 			: false,
			activated 				: false,
			hotkey					: conf.HOTKEY.SPY,
			version					: conf.VERSION.SPY,
			interval				: conf.INTERVAL.SPY,
	}

	if(!data_spy){
		data_spy = dataNew
		database.set("data_spy", data_spy, true)
	} else {
		if(!data_spy.version || data_spy.version < conf.VERSION.SPY){

			data_spy = dataNew
			database.set("data_spy", data_spy, true)
			notify("data_spy");
		} else {
			if(!data_spy.auto_initialize) data_spy.initialized = !1;
			if(data_spy.auto_initialize) data_spy.initialized = !0;
			database.set("data_spy", data_spy, true)		
		}
	}

	Object.setPrototypeOf(data_spy, db_spy);

	return data_spy;
})