define("robotTW2/databases/data_medic", [
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
	var data_medic = database.get("data_medic")
	, db_medic = {};
	
	db_medic.set = function(){
			database.set("data_medic", data_medic, true)
	}

	db_medic.get = function(){
		return database.get("data_medic")
	}

//	db_medic.getTimeCicle = function(){
//		return database.get("data_medic").interval
//	}
//
//	db_medic.setTimeCicle = function(timecicle){
//		if(timecicle){
//			var data = database.get("data_medic")
//			data.interval = timecicle
//			database.set("data_medic", data, true)
//		}
//	}
//
//	db_medic.setTimeComplete = function(time){
//		if(time){
//			var data = database.get("data_medic")
//			data.completed_at = time
//			database.set("data_medic", data, true)
//		}
//	}

	
	var dataNew = {
			auto_initialize			: false,
			initialized 			: false,
			activated 				: false,
			hotkey					: conf.HOTKEY.MEDIC,
			version					: conf.VERSION.MEDIC,
			interval				: conf.INTERVAL.MEDIC
	}

	if(!data_medic){
		data_medic = dataNew
		database.set("data_medic", data_medic, true)
	} else {
		if(!data_medic.version || data_medic.version < conf.VERSION.MEDIC){

			data_medic = dataNew
			database.set("data_medic", data_medic, true)
			notify("data_medic");
		} else {
			if(!data_medic.auto_initialize) data_medic.initialized = !1;
			if(data_medic.auto_initialize) data_medic.initialized = !0;
			database.set("data_medic", data_medic, true)		
		}
	}

	Object.setPrototypeOf(data_medic, db_medic);
	
	services.$rootScope.data_medic = data_medic;

	services.$rootScope.$watch("data_medic", function(){
		data_medic.set()
	}, true)

	return data_medic;
})