define("robotTW2/databases/data_map", [
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
	var data_map = database.get("data_map")
	, db_map = {};

	db_map.set = function(){
		database.set("data_map", data_map, true)
	}

	db_map.get = function(){
		return database.get("data_map")
	}

	var dataNew = {
			auto_initialize			: false,
			initialized 			: false,
			activated 				: false,
			hotkey					: conf.HOTKEY.MAP,
			version					: conf.VERSION.MAP,
			highlights				: {
				village: {},
				character: {},
				tribe: {}
			},
			cacheVillages			: {}
	}

	if(!data_map){
		data_map = dataNew
		database.set("data_map", data_map, true)
	} else {
		if(!data_map.version || (typeof(data_map.version) == "number" ? data_map.version.toString() : data_map.version) < conf.VERSION.MAP){
			data_map = dataNew
			notify("data_map");
		} else {
			if(!data_map.auto_initialize) data_map.initialized = !1;
			if(data_map.auto_initialize) data_map.initialized = !0;
		}
		database.set("data_map", data_map, true)
	}

	Object.setPrototypeOf(data_map, db_map);

	services.$rootScope.data_map = data_map;

	services.$rootScope.$watch("data_map", function(){
		data_map.set()
	}, true)

	return data_map;
})