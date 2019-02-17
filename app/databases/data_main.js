define("robotTW2/databases/data_main", [
	"robotTW2/databases/database",
	"robotTW2/conf",
	"robotTW2/services",
	"robotTW2/notify",
	"robotTW2/databases/data_alert",
	"robotTW2/databases/data_attack",
	"robotTW2/databases/data_defense",
	"robotTW2/databases/data_deposit",
	"robotTW2/databases/data_farm",
	"robotTW2/databases/data_headquarter",
	"robotTW2/databases/data_log",
	"robotTW2/databases/data_recon",
	"robotTW2/databases/data_recruit",
	"robotTW2/databases/data_secondvillage",
	"robotTW2/databases/data_spy",
	"robotTW2/databases/data_villages",
	], function(
			database,
			conf,
			services,
			notify,
			data_alert,
			data_attack,
			data_defense,
			data_deposit,
			data_farm,
			data_headquarter,
			data_log,
			data_recon,
			data_recruit,
			data_secondvillage,
			data_spy,
			data_villages
	){

	var data = {
			data_alert: 		data_alert,
			data_attack: 		data_attack,
			data_defense: 		data_defense,
			data_deposit: 		data_deposit,
			data_farm: 			data_farm,
			data_headquarter: 	data_headquarter,
			data_log: 			data_log,
			data_recon: 		data_recon,
			data_recruit: 		data_recruit,
			data_secondvillage: data_secondvillage,
			data_spy: 			data_spy,
			data_villages: 		data_villages
	}
	var data_main = database.get("data_main")
	, db_main = {};

	db_main.set = function(){
		database.set("data_main", data_main, true)
	}

	db_main.get = function(){
		return database.get("data_main")
	}
	db_main.setExtensions = function(extensions){
		for (var extension in extensions){
			var string = "data_" + extension.toLowerCase();
			var db = data[string]
			if(db){
				db.initialized = extensions[extension].initialized
				db.auto_initialize = extensions[extension].auto_initialize
				db.activated = extensions[extension].activated
				db.status = extensions[extension].status
				db.set();
			}
		}
	}
	db_main.getExtensions = function(){
		var dbs = conf.DBS
		, extensions = {};

		dbs.forEach(function(db_name){
			var string = "data_" + db_name.toLowerCase();
			var db = data[string]
			if(db && string != "data_log"){
				angular.extend(extensions, {
					[db_name.toUpperCase()] : {
						initialized 		: db.initialized,
						auto_initialize 	: db.auto_initialize,
						activated 			: db.activated,
						name 				: db_name.toUpperCase(),
						hotkey				: conf.HOTKEY[db_name.toUpperCase()]

					}		
				});
			}	
		})

		return extensions;
	}

	var dataNew = {
			max_time_correction		: conf.MAX_TIME_CORRECTION,
			time_correction_command	: conf.TIME_CORRECTION_COMMAND,
			version					: conf.VERSION.MAIN,
			pages_excludes			: ["farm", "recruit", "headquarter", "data"],
			name					: "data_main"
	}

	if(!data_main){
		data_main = dataNew
	} else {
		if(!data_main.version || (typeof(data_main.version) == "number" ? data_main.version.toString() : data_main.version) < conf.VERSION.MAIN){
			data_main = dataNew
			notify("data_main");
		} else {
			if(!data_main.auto_initialize) data_main.initialized = !1;
			if(data_main.auto_initialize) data_main.initialized = !0;
		}
	}
	database.set("data_main", data_main, true)

	Object.setPrototypeOf(data_main, db_main);

	return data_main;

})