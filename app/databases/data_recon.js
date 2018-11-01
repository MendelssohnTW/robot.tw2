define("robotTW2/databases/data_recon", [
	"robotTW2/databases/database",
	"robotTW2/conf",
	"robotTW2/services",
	"robotTW2/notify",
	"robotTW2/unitTypesRenameRecon"
	], function(
			database,
			conf,
			services,
			notify,
			unitTypesRenameRecon
	) {
	var db_recon = {};
	db_recon.set = function(data_recon){
		if(data_recon){
			database.set("data_recon", data_recon, true)
		}
	}

	db_recon.get = function(){
		return database.get("data_recon")
	}

	var data_recon = database.get("data_recon");
	var dataNew = {
			auto_initialize			: false,
			initialized 			: false,
			activated 				: false,
			hotkey					: conf.HOTKEY.RECON,
			version					: conf.VERSION.RECON,
			rename		 			: unitTypesRenameRecon
	}

	if(!data_recon){
		data_recon = dataNew
		database.set("data_recon", data_recon, true)
	} else {
		if(!data_recon.version || data_recon.version < conf.VERSION.RECON){

			data_recon = dataNew
			database.set("data_recon", data_recon, true)
			notify("data_recon");
		} else {
			if(!data_recon.auto_initialize) data_recon.initialized = !1;
			if(data_recon.auto_initialize) data_recon.initialized = !0;
			database.set("data_recon", data_recon, true)		
		}
	}

	Object.setPrototypeOf(data_recon, db_recon);

	return data_recon;
})