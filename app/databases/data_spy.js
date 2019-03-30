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
	var data_spy = database.get("data_spy")
	, db_spy = {};
	
	db_spy.set = function(){
			database.set("data_spy", data_spy, true)
	}

	db_spy.get = function(){
		return database.get("data_spy")
	}
	
	var dataNew = {
			auto_start				: false,
			init_initialized 		: false,
			activated 				: false,
			complete				: 0,
			hotkey					: conf.HOTKEY.SPY,
			version					: conf.VERSION.SPY,
			interval				: conf.INTERVAL.SPY,
			commands				: {}
	}

	if(!data_spy){
		data_spy = dataNew
		database.set("data_spy", data_spy, true)
	} else {
		if(!data_spy.version || (typeof(data_spy.version) == "number" ? data_spy.version.toString() : data_spy.version) < conf.VERSION.SPY){

			data_spy = dataNew
			database.set("data_spy", data_spy, true)
			notify("data_spy");
		} else {
			if(!data_spy.auto_start) data_spy.init_initialized = !1;
			if(data_spy.auto_start) data_spy.init_initialized = !0;
			database.set("data_spy", data_spy, true)		
		}
	}

	Object.setPrototypeOf(data_spy, db_spy);
	
	return data_spy;
})