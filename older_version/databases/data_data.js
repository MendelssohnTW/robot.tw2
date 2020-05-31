define("robotTW2/databases/data_data", [
	"robotTW2/databases/database",
	"robotTW2/conf",
	"robotTW2/services",
	"robotTW2/notify",
	"robotTW2/time"
	], function(
			database,
			conf,
			services,
			notify,
			time
	) {
	var data_data = database.get("data_data")
	, db_data = {};

	db_data.set = function(){
		database.set("data_data", data_data, true)
	}

	db_data.get = function(){
		return database.get("data_data")
	}

	var dataNew = {
			auto_start				: false,
			init_initialized 		: false,
			activated 				: false,
			hotkey					: conf.HOTKEY.DATA,
			xmin					: 0,
			xmax					: 1000,
			ymin					: 0,
			ymax					: 1000,
			count					: 100,
			full					: true,
			complete_villages		: 0,
			complete_tribes			: 0,
			complete_members		: 0,
			complete_logs			: 0,
			tribes					: [],
			members					: [],
			interval	 			: {
				villages	: conf.INTERVAL.DATA.villages,
				tribes		: conf.INTERVAL.DATA.tribes,
				members		: conf.INTERVAL.DATA.members,
				logs		: conf.INTERVAL.DATA.logs
			},
			version					: conf.VERSION.DATA,
			possible				: true,
			last_update				: {
				villages	: time.convertedTime(),
				tribes 		: time.convertedTime(),
				members		: time.convertedTime(),
				logs 		: time.convertedTime()
			},
			last_position			: {
				x	: 0,
				y 	: 0
			}
	}

	if(!data_data){
		data_data = dataNew
		database.set("data_data", data_data, true)
	} else {
		if(!data_data.version || (typeof(data_data.version) == "number" ? data_data.version.toString() : data_data.version) < conf.VERSION.data){
			data_data = dataNew
			notify("data_data");
		} else {
			if(!data_data.auto_start) data_data.init_initialized = !1;
			if(data_data.auto_start) data_data.init_initialized = !0;
		}
		database.set("data_data", data_data, true)
	}

	Object.setPrototypeOf(data_data, db_data);

	return data_data;
})
