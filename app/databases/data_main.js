define("robotTW2/databases/data_main", [
	"robotTW2/databases/database",
	"robotTW2/conf",
	"robotTW2/services",
	"robotTW2/notify"
	], function(
			database,
			conf,
			services,
			notify
	){

	var data_main = database.get("data_main")
	, db_main = {};
	db_main.setExtensions = function(extensions){
		for (var extension in extensions){
			var string = "data_" + extension.toLowerCase();
			var db = database.get(string)
			if(db){
				db.initialized = extensions[extension].initialized
				db.auto_initialize = extensions[extension].auto_initialize
				db.activated = extensions[extension].activated
				database.set(string, db, true)
			}
		}
	}
	db_main.getExtensions = function(){
		var extensions = {
				HEADQUARTER		: {
					initialized : database.get("data_headquarter") ? database.get("data_headquarter").initialized : false,
							auto_initialize : database.get("data_headquarter") ? database.get("data_headquarter").auto_initialize : false,
									activated : database.get("data_headquarter") ? database.get("data_headquarter").activated : false,
											name : "HEADQUARTER"
				},
				FARM			: {
					initialized : database.get("data_farm") ? database.get("data_farm").initialized : false,
							auto_initialize : database.get("data_farm") ? database.get("data_farm").auto_initialize : false,
									activated : database.get("data_farm") ? database.get("data_farm").activated : false,
											name : "FARM"
				},
				DEPOSIT			: {
					initialized : database.get("data_deposit") ? database.get("data_deposit").initialized : false,
							auto_initialize : database.get("data_deposit") ? database.get("data_deposit").auto_initialize : false,
									activated : database.get("data_deposit") ? database.get("data_deposit").activated : false,
											name : "DEPOSIT"
				},
				ATTACK			: {
					initialized : database.get("data_attack") ? database.get("data_attack").initialized : false,
							auto_initialize : database.get("data_attack") ? database.get("data_attack").auto_initialize : false,
									activated : database.get("data_attack") ? database.get("data_attack").activated : false,
											name : "ATTACK"
				},
				DEFENSE			: {
					initialized : database.get("data_defense") ? database.get("data_defense").initialized : false,
							auto_initialize : database.get("data_defense") ? database.get("data_defense").auto_initialize : false,
									activated : database.get("data_defense") ? database.get("data_defense").activated : false,
											name : "DEFENSE"
				},
				SPY				: {
					initialized : database.get("data_spy") ? database.get("data_spy").initialized : false,
							auto_initialize : database.get("data_spy") ? database.get("data_spy").auto_initialize : false,
									activated : database.get("data_spy") ? database.get("data_spy").activated : false,
											name : "SPY"
				},
				RECRUIT			: {
					initialized : database.get("data_recruit") ? database.get("data_recruit").initialized : false,
							auto_initialize : database.get("data_recruit") ? database.get("data_recruit").auto_initialize : false,
									activated : database.get("data_recruit") ? database.get("data_recruit").activated : false,
											name : "RECRUIT"
				},
				ALERT			: {
					initialized : database.get("data_alert") ? database.get("data_alert").initialized : false,
							auto_initialize : database.get("data_alert") ? database.get("data_alert").auto_initialize : false,
									activated : database.get("data_alert") ? database.get("data_alert").activated : false,
											name : "ALERT"
				},
				RECON			: {
					initialized : database.get("data_recon") ? database.get("data_recon").initialized : false,
							auto_initialize : database.get("data_recon") ? database.get("data_recon").auto_initialize : false,
									activated : database.get("data_recon") ? database.get("data_recon").activated : false,
											name : "RECON"
				}
		}
		return extensions;
	}
	db_main.save = function(){
		database.set("data_main", data_main, true)
	};

	var dataNew = {
			max_time_correction		: conf.MAX_TIME_CORRECTION,
			time_correction_command	: conf.TIME_CORRECTION_COMMAND,
			version					: conf.VERSION.MAIN,
			name					: "data_main"
	}

	if(!data_main){
		data_main = dataNew
	} else {
		if(!data_main.version || data_main.version < conf.VERSION.MAIN){
			data_main = dataNew
			notify("data_main");
		} else {
			if(!data_main.auto_initialize) data_main.initialized = !1;
			if(data_main.auto_initialize) data_main.initialized = !0;
		}
	}
	db_main.save()

	Object.setPrototypeOf(data_main, db_main);
	return data_main;

})