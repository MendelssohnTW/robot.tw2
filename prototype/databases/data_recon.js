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
	var data_recon = database.get("data_recon")
	, db_recon = {};

	db_recon.set = function(){
		database.set("data_recon", data_recon, true)
	}

	db_recon.get = function(){
		return database.get("data_recon")
	}

	var dataNew = {
			auto_start				: false,
			init_initialized 		: false,
			activated 				: false,
			hotkey					: conf.HOTKEY.RECON,
			version					: conf.VERSION.RECON,
			rename		 			: unitTypesRenameRecon,
			active_rename			: false
	}

	if(!data_recon){
		data_recon = dataNew
		database.set("data_recon", data_recon, true)
	} else {
		if(!data_recon || data_recon < conf.VERSION.RECON){

			data_recon = dataNew
			database.set("data_recon", data_recon, true)
			notify("data_recon");
		} else {
			if(!data_recon.auto_start) data_recon.init_initialized = !1;
			if(data_recon.auto_start) data_recon.init_initialized = !0;
			database.set("data_recon", data_recon, true)		
		}
	}

	Object.setPrototypeOf(data_recon, db_recon);

	return data_recon;
})