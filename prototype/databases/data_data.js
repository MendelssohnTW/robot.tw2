define("robotTW2/databases/data_data", [
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
	var data_data = database.get("data_data")
	, db_data = {};

	db_data.set = function(){
		database.set("data_data", data_data, true)
	}

	db_data.get = function(){
		return database.get("data_data")
	}

	var dataNew = {
			auto_initialize			: false,
			initialized 			: false,
			activated 				: false,
			hotkey					: conf.HOTKEY.DATA,
			complete				: 0,
			interval	 			: {
				villages	: conf.INTERVAL.DATA.villages,
				tribes		: conf.INTERVAL.DATA.tribes
			},
			version					: conf.VERSION.DATA,
			possible				: true,
			last_update				: new Date().getTime(),
			logs					: []
	}

	if(!data_data){
		data_data = dataNew
		database.set("data_data", data_data, true)
	} else {
		if(!data_data.version || (typeof(data_data.version) == "number" ? data_data.version.toString() : data_data.version) < conf.VERSION.data){
			data_data = dataNew
			notify("data_data");
		} else {
			if(!data_data.auto_initialize) data_data.initialized = !1;
			if(data_data.auto_initialize) data_data.initialized = !0;
		}
		database.set("data_data", data_data, true)
	}

	Object.setPrototypeOf(data_data, db_data);

	services.$rootScope.data_data = data_data;

	services.$rootScope.$watch("data_data", function(){
		data_data.set()
	}, true)

	return data_data;
})
