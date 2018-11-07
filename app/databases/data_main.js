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
	
	db_main.set = function(db_main){
		if(db_main){
			database.set("data_main", db_main, true)
		} else {
			database.set("data_main", data_main, true)
		}
	}

	db_main.get = function(){
		return database.get("data_main")
	}
	db_main.setExtensions = function(extensions){
		for (var extension in extensions){
			var string = "data_" + extension.toLowerCase();
//			var db = database.get(string)
			var db = robotTW2.services.$rootScope[string]
			if(db){
				db.initialized = extensions[extension].initialized
				db.auto_initialize = extensions[extension].auto_initialize
				db.activated = extensions[extension].activated
				database.set(string, db, true)
			}
		}
	}
	db_main.getExtensions = function(){
		if(database.get("data_headquarter")){
			HEADQUARTER = {
					HEADQUARTER : {
						initialized 		: database.get("data_headquarter").initialized,
						auto_initialize 	: database.get("data_headquarter").auto_initialize,
						activated 			: database.get("data_headquarter").activated,
						name 				: "HEADQUARTER",
						hotkey				: conf.HOTKEY.HEADQUARTER
					}
			}
		} else {
			HEADQUARTER = {
					HEADQUARTER : {
						initialized 		: false,
						auto_initialize 	: false,
						activated 			: false,
						name 				: "HEADQUARTER",
						hotkey				: conf.HOTKEY.HEADQUARTER

					}
			}
		}
		
		if(database.get("data_farm")){
			FARM = {
					FARM : {
						initialized 		: database.get("data_farm").initialized,
						auto_initialize 	: database.get("data_farm").auto_initialize,
						activated 			: database.get("data_farm").activated,
						name 				: "FARM",
						hotkey				: conf.HOTKEY.FARM

					}
			}
		} else {
			FARM = {
					FARM : {
						initialized 		: false,
						auto_initialize 	: false,
						activated 			: false,
						name 				: "FARM",
						hotkey				: conf.HOTKEY.FARM

					}
			}
		}
		
		if(database.get("data_deposit")){
			DEPOSIT = {
					DEPOSIT : {
						initialized 		: database.get("data_deposit").initialized,
						auto_initialize 	: database.get("data_deposit").auto_initialize,
						activated 			: database.get("data_deposit").activated,
						name 				: "DEPOSIT",
						hotkey				: conf.HOTKEY.DEPOSIT

					}
			}
		} else {
			DEPOSIT = {
					DEPOSIT : {
						initialized 		: false,
						auto_initialize 	: false,
						activated 			: false,
						name 				: "DEPOSIT",
						hotkey				: conf.HOTKEY.DEPOSIT

					}
			}
		}
		
		if(database.get("data_attack")){
			ATTACK = {
					ATTACK : {
						initialized 		: database.get("data_attack").initialized,
						auto_initialize 	: database.get("data_attack").auto_initialize,
						activated 			: database.get("data_attack").activated,
						name 				: "ATTACK",
						hotkey				: conf.HOTKEY.ATTACK

					}
			}
		} else {
			ATTACK = {
					ATTACK : {
						initialized 		: false,
						auto_initialize 	: false,
						activated 			: false,
						name 				: "ATTACK",
						hotkey				: conf.HOTKEY.ATTACK

					}
			}
		}
		
		if(database.get("data_defense")){
			DEFENSE = {
					DEFENSE : {
						initialized 		: database.get("data_defense").initialized,
						auto_initialize 	: database.get("data_defense").auto_initialize,
						activated 			: database.get("data_defense").activated,
						name 				: "DEFENSE",
						hotkey				: conf.HOTKEY.DEFENSE

					}
			}
		} else {
			DEFENSE = {
					DEFENSE : {
						initialized 		: false,
						auto_initialize 	: false,
						activated 			: false,
						name 				: "DEFENSE",
						hotkey				: conf.HOTKEY.DEFENSE

					}
			}
		}
		
		if(database.get("data_spy")){
			SPY = {
					SPY : {
						initialized 		: database.get("data_spy").initialized,
						auto_initialize 	: database.get("data_spy").auto_initialize,
						activated 			: database.get("data_spy").activated,
						name 				: "SPY",
						hotkey				: conf.HOTKEY.SPY

					}
			}
		} else {
			SPY = {
					SPY : {
						initialized 		: false,
						auto_initialize 	: false,
						activated 			: false,
						name 				: "SPY",
						hotkey				: conf.HOTKEY.SPY

					}
			}
		}

		if(database.get("data_recruit")){
			RECRUIT = {
					RECRUIT : {
						initialized 		: database.get("data_recruit").initialized,
						auto_initialize 	: database.get("data_recruit").auto_initialize,
						activated 			: database.get("data_recruit").activated,
						name 				: "RECRUIT",
						hotkey				: conf.HOTKEY.RECRUIT

					}
			}
		} else {
			RECRUIT = {
					RECRUIT : {
						initialized 		: false,
						auto_initialize 	: false,
						activated 			: false,
						name 				: "RECRUIT",
						hotkey				: conf.HOTKEY.RECRUIT

					}
			}
		}
		
		if(database.get("data_alert")){
			ALERT = {
					ALERT : {
						initialized 		: database.get("data_alert").initialized,
						auto_initialize 	: database.get("data_alert").auto_initialize,
						activated 			: database.get("data_alert").activated,
						name 				: "ALERT",
						hotkey				: conf.HOTKEY.ALERT

					}
			}
		} else {
			ALERT = {
					ALERT : {
						initialized 		: false,
						auto_initialize 	: false,
						activated 			: false,
						name 				: "ALERT",
						hotkey				: conf.HOTKEY.ALERT

					}
			}
		}

		if(database.get("data_recon")){
			RECON = {
					RECON : {
						initialized 		: database.get("data_recon").initialized,
						auto_initialize 	: database.get("data_recon").auto_initialize,
						activated 			: database.get("data_recon").activated,
						name 				: "RECON",
						hotkey				: conf.HOTKEY.RECON

					}
			}
		} else {
			RECON = {
					RECON : {
						initialized 		: false,
						auto_initialize 	: false,
						activated 			: false,
						name 				: "RECON",
						hotkey				: conf.HOTKEY.RECON

					}
			}
		}
		
		if(database.get("data_medic")){
			MEDIC = {
					MEDIC : {
						initialized 		: database.get("data_medic").initialized,
						auto_initialize 	: database.get("data_medic").auto_initialize,
						activated 			: database.get("data_medic").activated,
						name 				: "MEDIC",
						hotkey				: conf.HOTKEY.MEDIC

					}
			}
		} else {
			MEDIC = {
					MEDIC : {
						initialized 		: false,
						auto_initialize 	: false,
						activated 			: false,
						name 				: "MEDIC",
						hotkey				: conf.HOTKEY.MEDIC

					}
			}
		}
		
		var extensions = {};
		angular.extend(extensions, HEADQUARTER);
		angular.extend(extensions, FARM);
		angular.extend(extensions, DEPOSIT);
		angular.extend(extensions, ATTACK);
		angular.extend(extensions, DEFENSE);
		angular.extend(extensions, SPY);
		angular.extend(extensions, RECRUIT);
		angular.extend(extensions, HEADQUARTER);
		angular.extend(extensions, ALERT);
		angular.extend(extensions, RECON);
		angular.extend(extensions, MEDIC);

		return extensions;
	}

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
	database.set("data_main", data_main, true)

	Object.setPrototypeOf(data_main, db_main);
	return data_main;

})