define("robotTW2/databases/data_fake", [
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
	var data_fake = database.get("data_fake")
	, db_fake = {};
	
	db_fake.set = function(){
			database.set("data_fake", data_fake, true)
	}

	db_fake.get = function(){
		return database.get("data_fake")
	}
	
	var dataNew = {
			auto_start				: false,
			init_initialized 		: false,
			activated 				: false,
			hotkey					: conf.HOTKEY.FAKE,
			version					: conf.VERSION.FAKE,
			commands				: {}
	}

	if(!data_fake){
		data_fake = dataNew
		database.set("data_fake", data_fake, true)
	} else {
		if(!data_fake.version || (typeof(data_fake.version) == "number" ? data_fake.version.toString() : data_fake.version) < conf.VERSION.FAKE){

			data_fake = dataNew
			database.set("data_fake", data_fake, true)
			notify("data_fake");
		} else {
			if(!data_fake.auto_start) data_fake.init_initialized = !1;
			if(data_fake.auto_start) data_fake.init_initialized = !0;
			database.set("data_fake", data_fake, true)		
		}
	}

	Object.setPrototypeOf(data_fake, db_fake);
	
	return data_fake;
})