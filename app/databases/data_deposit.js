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
			auto_initialize			: false,
			initialized 			: false,
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
		if(!data_deposit.version || data_deposit.version < conf.VERSION.DEPOSIT){
			data_deposit = dataNew
			notify("data_deposit");
		} else {
			if(!data_deposit.auto_initialize) data_deposit.initialized = !1;
			if(data_deposit.auto_initialize) data_deposit.initialized = !0;
		}
		database.set("data_deposit", data_deposit, true)
	}

	Object.setPrototypeOf(data_deposit, db_deposit);

	services.$rootScope.data_deposit = data_deposit;

	services.$rootScope.$watch("data_deposit", function(){
		data_deposit.set()
	}, true)

	return data_deposit;
})