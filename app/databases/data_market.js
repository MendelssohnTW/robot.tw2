define("robotTW2/databases/data_market", [
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
	var data_market = database.get("data_market")
	, db_market = {};
	
	db_market.set = function(){
			database.set("data_market", data_market, true)
	}

	db_market.get = function(){
		return database.get("data_market")
	}
	
	var dataNew = {
			auto_start				: false,
			init_initialized 		: false,
			activated 				: false,
			complete				: 0,
			hotkey					: conf.HOTKEY.MARKET,
			version					: conf.VERSION.MARKET,
			interval				: conf.INTERVAL.MARKET,
			commands				: {}
	}

	if(!data_market){
		data_market = dataNew
		database.set("data_market", data_market, true)
	} else {
		if(!data_market.version || (typeof(data_market.version) == "number" ? data_market.version.toString() : data_market.version) < conf.VERSION.market){

			data_market = dataNew
			database.set("data_market", data_market, true)
			notify("data_market");
		} else {
			if(!data_market.auto_start) data_market.init_initialized = !1;
			if(data_market.auto_start) data_market.init_initialized = !0;
			database.set("data_market", data_market, true)		
		}
	}

	Object.setPrototypeOf(data_market, db_market);
	
	return data_market;
})