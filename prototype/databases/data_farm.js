define("robotTW2/databases/data_farm", [
	"robotTW2",
	"robotTW2/databases/database",
	"robotTW2/conf",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/notify",
	"helper/time"
	], function(
			robotTW2,
			database,
			conf,
			services,
			providers,
			notify,
			helper
	) {

	var data_farm = database.get("data_farm")
	, db_farm = {};

	db_farm.set = function(){
		database.set("data_farm", data_farm, true)
	}
	db_farm.get = function(){
		return database.get("data_farm");
	}

	var dataNew = {
			auto_initialize			: true, 
			initialized				: true, 
			activated				: true,
			hotkey					: conf.HOTKEY.FARM,
			version					: conf.VERSION.FARM,
			farm_time				: conf.FARM_TIME,
			farm_time_start			: helper.gameTime(),
			farm_time_stop			: new Date((services.$filter("date")(new Date(helper.gameTime() + 86400000), "yyyy-MM-dd")) + " 06:00:00").getTime(),
			time_delay_farm			: conf.TIME_DELAY_FARM,
			list_exceptions			: [],
			commands				: {},
			troops_not				: conf.TROOPS_NOT.FARM,
			name					: "data_farm"
	}

	if(!data_farm){
		data_farm = dataNew
	} else {
		if(!data_farm.version || (typeof(data_farm.version) == "number" ? data_farm.version.toString() : data_farm.version) < conf.VERSION.FARM){
			data_farm = dataNew
			notify("data_farm");
		} else {
			if(!data_farm.auto_initialize) data_farm.initialized = !1;
			if(data_farm.auto_initialize) data_farm.initialized = !0;
			database.set("data_farm", data_farm, true)		
		}
	}


	Object.setPrototypeOf(data_farm, db_farm);

	return data_farm;
})
