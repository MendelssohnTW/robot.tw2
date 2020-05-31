define("robotTW2/databases/data_deposit", [
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
	var data_deposit = database.get("data_deposit")
	, db_deposit = {};

	db_deposit.set = function(){
		database.set("data_deposit", data_deposit, true)
	}

	db_deposit.get = function(){
		return database.get("data_deposit")
	}

	var dataNew = {
			auto_start				: false,
			init_initialized 		: false,
			activated 				: false,
			hotkey					: conf.HOTKEY.DEPOSIT,
			use_reroll				: false,
			complete				: 0,
			version					: conf.VERSION.DEPOSIT,
			interval				: conf.INTERVAL.DEPOSIT
	}

	if(!data_deposit){
		data_deposit = dataNew
		database.set("data_deposit", data_deposit, true)
	} else {
		if(!data_deposit.version || (typeof(data_deposit.version) == "number" ? data_deposit.version.toString() : data_deposit.version) < conf.VERSION.DEPOSIT){
			data_deposit = dataNew
			notify("data_deposit");
		} else {
			if(!data_deposit.auto_start) data_deposit.init_initialized = !1;
			if(data_deposit.auto_start) data_deposit.init_initialized = !0;
		}
		database.set("data_deposit", data_deposit, true)
	}

	Object.setPrototypeOf(data_deposit, db_deposit);

	return data_deposit;
})