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
			auto_initialize			: false,
			initialized 			: true,
			activated 				: true,
			complete				: 0,
			hotkey					: conf.HOTKEY.SPY,
			version					: conf.VERSION.SPY,
			interval				: conf.INTERVAL.SPY,
			completed_at			: 0
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
			if(!data_spy.auto_initialize) data_spy.initialized = !1;
			if(data_spy.auto_initialize) data_spy.initialized = !0;
			database.set("data_spy", data_spy, true)		
		}
	}

	Object.setPrototypeOf(data_spy, db_spy);
	
	services.$rootScope.data_spy = data_spy;

	services.$rootScope.$watch("data_spy", function(){
		data_spy.set()
	}, true)

	return data_spy;
})