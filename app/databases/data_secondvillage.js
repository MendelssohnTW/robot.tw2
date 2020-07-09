define("robotTW2/databases/data_secondvillage", [
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
	var data_secondvillage = database.get("data_secondvillage")
	, db_deposit = {};

	db_deposit.set = function(){
		database.set("data_secondvillage", data_secondvillage, true)
	}

	db_deposit.get = function(){
		return database.get("data_secondvillage")
	}

	var dataNew = {
			auto_start				: false,
			init_initialized 		: false,
			activated 				: false,
			hotkey					: conf.HOTKEY.SECONDVILLAGE,
			use_reroll				: false,
			complete				: 0,
			version					: conf.VERSION.SECONDVILLAGE,
			interval				: 0
	}

	if(!data_secondvillage){
		data_secondvillage = dataNew
		database.set("data_secondvillage", data_secondvillage, true)
	} else {
		if(!data_secondvillage.version || (typeof(data_secondvillage.version) == "number" ? data_secondvillage.version.toString() : data_secondvillage.version) < conf.VERSION.SECONDVILLAGE){
			data_secondvillage = dataNew
			notify("data_secondvillage");
		} else {
			if(!data_secondvillage.auto_start) data_secondvillage.init_initialized = !1;
			if(data_secondvillage.auto_start) data_secondvillage.init_initialized = !0;
		}
		database.set("data_secondvillage", data_secondvillage, true)
	}

	Object.setPrototypeOf(data_secondvillage, db_deposit);

	return data_secondvillage;
})