define("robotTW2/databases/data_headquarter", [
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
	var data_headquarter = database.get("data_headquarter")
	, db_headquarter = {};

	db_headquarter.set = function(){
		database.set("data_headquarter", data_headquarter, true)
	}

	db_headquarter.get = function(){
		return database.get("data_headquarter")
	}

	var id = 0;
	
	var dataNew = {
			auto_start				: false,
			init_initialized 		: false,
			activated 				: false,
			hotkey					: conf.HOTKEY.HEADQUARTER,
			interval				: conf.INTERVAL.HEADQUARTER,
			version					: conf.VERSION.HEADQUARTER,
//			seq_type				: "seq_flex",
			reserva 				: {
				food			: conf.RESERVA.HEADQUARTER.FOOD,
				wood			: conf.RESERVA.HEADQUARTER.WOOD,
				clay			: conf.RESERVA.HEADQUARTER.CLAY,
				iron			: conf.RESERVA.HEADQUARTER.IRON,
				slots			: conf.RESERVA.HEADQUARTER.SLOTS
			},
			selects			    	: Object.keys(conf.BUILDINGORDER).map(function(elem){
				return {
					id		: ++id,
					name	: services.$filter("i18n")(elem, services.$rootScope.loc.ale, "headquarter"),
					value	: elem
				}
			})
//			,
//			standard				: {
//				"buildingorder"	: conf.BUILDINGORDER["standard"],
//				"buildinglimit"	: conf.BUILDINGLIMIT["standard"],
//				"buildinglist"	: conf.BUILDINGLIST["standard"]
//			}

	}

	if(!data_headquarter){
		data_headquarter = dataNew
		database.set("data_headquarter", data_headquarter, true)
	} else {
		if(!data_headquarter.version || (typeof(data_headquarter.version) == "number" ? data_headquarter.version.toString() : data_headquarter.version) < conf.VERSION.HEADQUARTER){
			data_headquarter = dataNew
			database.set("data_headquarter", data_headquarter, true)
			notify("data_headquarter");
		} else {
			if(!data_headquarter.auto_start) data_headquarter.init_initialized = !1;
			if(data_headquarter.auto_start) data_headquarter.init_initialized = !0;
			database.set("data_headquarter", data_headquarter, true)		
		}
	}

	Object.setPrototypeOf(data_headquarter, db_headquarter);

	return data_headquarter;
})