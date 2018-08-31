define("robotTW2/database", [
	"robotTW2/services"
	], function(
			services
	) {
	var database = {};
	return database.prefix = services.modelDataService.getSelectedCharacter().getId() + "_" + services.modelDataService.getSelectedCharacter().getWorldId() + "_"
	, database.getKeyPrefix = function(key, options) {
		options = options || {};
		if (options.noPrefix) {
			return key;
		} else {
			return this.prefix + key;
		}
	}
	, database.set = function (key, value, options) {
		var keyName = this.getKeyPrefix(key, options);
		var keyValue = JSON.stringify({"data": value});
		try {
			localStorage.setItem(keyName, keyValue);
		} catch (e) {
			if (console) console.warn("database não pode ser gravado '{"+ key +": "+ value +"}' , porque o localStorage está¡ cheio.");
		}
	}
	, database.get = function (key, missing, options) {
		var keyName = this.getKeyPrefix(key, options),
		value;
		try {
			value = JSON.parse(localStorage.getItem(keyName));
		} catch (e) {
			if(localStorage[keyName]) {
				value = {data: localStorage.getItem(keyName)};
			} else{
				value = null;
			}
		}
		return null === value ? missing : "object" == typeof value && void 0 !== value.data ? value.data : missing
	}
	, database;
})
,
define("robotTW2/data_main", [
	"robotTW2/database",
	"robotTW2/conf",
	"robotTW2/services",
	"robotTW2/notify"
	], function(
			database,
			conf,
			services,
			notify
	) {

	var setExtensions = function(extensions){
		for (var extension in extensions){
			var string = "data_" + extension.toLowerCase();
			var db = database.get(string)
			if(db){
				db.ATIVATE = extensions[extension].ATIVATE
				db.INIT_ATIVATE = extensions[extension].INIT_ATIVATE
				db.ENABLED = extensions[extension].ENABLED
				database.set(string, db, true)
			}
		}
	}

	var getExtensions = function(){
		var extensions = {
				HEADQUARTER		: {
					ATIVATE : database.get("data_headquarter") ? database.get("data_headquarter").ATIVATE : false,
							INIT_ATIVATE : database.get("data_headquarter") ? database.get("data_headquarter").INIT_ATIVATE : false,
									ENABLED : database.get("data_headquarter") ? database.get("data_headquarter").ENABLED : false,
											name : "HEADQUARTER"
				},
				FARM			: {
					ATIVATE : database.get("data_farm") ? database.get("data_farm").ATIVATE : false,
							INIT_ATIVATE : database.get("data_farm") ? database.get("data_farm").INIT_ATIVATE : false,
									ENABLED : database.get("data_farm") ? database.get("data_farm").ENABLED : false,
											name : "FARM"
				},
				DEPOSIT			: {
					ATIVATE : database.get("data_deposit") ? database.get("data_deposit").ATIVATE : false,
							INIT_ATIVATE : database.get("data_deposit") ? database.get("data_deposit").INIT_ATIVATE : false,
									ENABLED : database.get("data_deposit") ? database.get("data_deposit").ENABLED : false,
											name : "DEPOSIT"
				},
				ATTACK			: {
					ATIVATE : database.get("data_attack") ? database.get("data_attack").ATIVATE : false,
							INIT_ATIVATE : database.get("data_attack") ? database.get("data_attack").INIT_ATIVATE : false,
									ENABLED : database.get("data_attack") ? database.get("data_attack").ENABLED : false,
											name : "ATTACK"
				},
				DEFENSE			: {
					ATIVATE : database.get("data_defense") ? database.get("data_defense").ATIVATE : false,
							INIT_ATIVATE : database.get("data_defense") ? database.get("data_defense").INIT_ATIVATE : false,
									ENABLED : database.get("data_defense") ? database.get("data_defense").ENABLED : false,
											name : "DEFENSE"
				},
				SPY				: {
					ATIVATE : database.get("data_spy") ? database.get("data_spy").ATIVATE : false,
							INIT_ATIVATE : database.get("data_spy") ? database.get("data_spy").INIT_ATIVATE : false,
									ENABLED : database.get("data_spy") ? database.get("data_spy").ENABLED : false,
											name : "SPY"
				},
				RECRUIT			: {
					ATIVATE : database.get("data_recruit") ? database.get("data_recruit").ATIVATE : false,
							INIT_ATIVATE : database.get("data_recruit") ? database.get("data_recruit").INIT_ATIVATE : false,
									ENABLED : database.get("data_recruit") ? database.get("data_recruit").ENABLED : false,
											name : "RECRUIT"
				},
				ALERT			: {
					ATIVATE : database.get("data_alert") ? database.get("data_alert").ATIVATE : false,
							INIT_ATIVATE : database.get("data_alert") ? database.get("data_alert").INIT_ATIVATE : false,
									ENABLED : database.get("data_alert") ? database.get("data_alert").ENABLED : false,
											name : "ALERT"
				},
				RECON			: {
					ATIVATE : database.get("data_recon") ? database.get("data_recon").ATIVATE : false,
							INIT_ATIVATE : database.get("data_recon") ? database.get("data_recon").INIT_ATIVATE : false,
									ENABLED : database.get("data_recon") ? database.get("data_recon").ENABLED : false,
											name : "RECON"
				}
		}
		return extensions;
	}

	var setMain = function(data_main){
		if(data_main){
			database.set("data_main", data_main, true)
		}
	}

	var getMain = function(){
		return database.get("data_main")
	}

	var data_main = database.get("data_main");
	var dataNew = {
			MAX_TIME_CORRECTION		: conf.MAX_TIME_CORRECTION,
			TIME_CORRECTION_COMMAND	: conf.TIME_CORRECTION_COMMAND,
			HOTKEY					: conf.HOTKEY.MAIN,
			VERSION					: conf.VERSION.MAIN
	}

	if(!data_main){
		data_main = dataNew
		database.set("data_main", data_main, true)
	} else {
		if(!data_main.VERSION || data_main.VERSION < conf.VERSION.MAIN){
			notify("data_main");
			data_main = dataNew
			database.set("data_main", data_main, true)
		} else {
			if(!data_main.INIT_ATIVATE) data_main.ATIVATE = !1;
			if(data_main.INIT_ATIVATE) data_main.ATIVATE = !0;
			database.set("data_main", data_main, true)		
		}
	}


	var fn = {
			setExtensions				: setExtensions,
			getExtensions				: getExtensions,
			setMain						: setMain,
			getMain						: getMain
	}

	Object.setPrototypeOf(data_main, fn);

	return data_main;


})
,
define("robotTW2/data_attack", [
	"robotTW2/database",
	"robotTW2/conf",
	"robotTW2/services",
	"robotTW2/notify"
	], function(
			database,
			conf,
			services,
			notify
	) {
	var setAttack = function(data_attack){
		if(data_attack){
			database.set("data_attack", data_attack, true)
		}
	}

	var getAttack = function(){
		return database.get("data_attack")
	}

	var getTimeCicle = function(){
		return database.get("data_attack").INTERVAL
	}

	var setTimeCicle = function(timecicle){
		if(timecicle){
			var data = database.get("data_attack")
			data.INTERVAL = timecicle
			database.set("data_attack", data, true)
		}
	}

	var setTimeComplete = function(time){
		if(time){
			var data = database.get("data_attack")
			data.COMPLETED_AT = time
			database.set("data_attack", data, true)
		}
	}

	var data_attack = database.get("data_attack");
	var dataNew = {
			INIT_ATIVATE			: false,
			ATIVATE 				: false,
			ENABLED 				: false,
			HOTKEY					: conf.HOTKEY.ATTACK,
			INTERVAL				: conf.INTERVAL.ATTACK,
			VERSION					: conf.VERSION.ATTACK,
			COMMANDS				: {}
	}

	if(!data_attack){
		data_attack = dataNew
		database.set("data_attack", data_attack, true)
	} else {
		if(!data_attack.VERSION || data_attack.VERSION < conf.VERSION.ATTACK){
			notify("data_attack");
			data_attack = dataNew
			database.set("data_attack", data_attack, true)
		} else {
			if(!data_attack.INIT_ATIVATE) data_attack.ATIVATE = !1;
			if(data_attack.INIT_ATIVATE) data_attack.ATIVATE = !0;
			database.set("data_attack", data_attack, true)		
		}
	}

	var fn = {
			setAttack				: setAttack,
			getAttack				: getAttack,
			getTimeCicle			: getTimeCicle,
			setTimeCicle			: setTimeCicle,
			setTimeComplete			: setTimeComplete
	}

	Object.setPrototypeOf(data_attack, fn);

	return data_attack;
})
,
define("robotTW2/data_support", [
	"robotTW2/database",
	"robotTW2/conf",
	"robotTW2/services",
	"robotTW2/notify"
	], function(
			database,
			conf,
			services,
			notify
	) {
	var setSupport = function(data_support){
		if(data_support){
			database.set("data_support", data_support, true)
		}
	}

	var getSupport = function(){
		return database.get("data_support")
	}

	var getTimeCicle = function(){
		return database.get("data_support").INTERVAL
	}

	var setTimeCicle = function(timecicle){
		if(timecicle){
			var data = database.get("data_support")
			data.INTERVAL = timecicle
			database.set("data_support", data, true)
		}
	}

	var setTimeComplete = function(time){
		if(time){
			var data = database.get("data_support")
			data.COMPLETED_AT = time
			database.set("data_support", data, true)
		}
	}

	var data_support = database.get("data_support");
	var dataNew = {
			INIT_ATIVATE			: false,
			ATIVATE 				: false,
			ENABLED 				: false,
			TIME_CORRECTION_COMMAND	: conf.TIME_CORRECTION_COMMAND,
			HOTKEY					: conf.HOTKEY.ATTACK,
			INTERVAL				: conf.INTERVAL.ATTACK,
			VERSION					: conf.VERSION.ATTACK,
			COMMANDS				: {}
	}

	if(!data_support){
		data_support = dataNew
		database.set("data_support", data_support, true)
	} else {
		if(!data_support.VERSION || data_support.VERSION < conf.VERSION.SUPPORT){
			notify("data_support");
			data_support = dataNew
			database.set("data_support", data_support, true)
		} else {
			if(!data_support.INIT_ATIVATE) data_support.ATIVATE = !1;
			if(data_support.INIT_ATIVATE) data_support.ATIVATE = !0;
			database.set("data_support", data_support, true)		
		}
	}

	var fn = {
			setSupport				: setSupport,
			getSupport				: getSupport,
			getTimeCicle			: getTimeCicle,
			setTimeCicle			: setTimeCicle,
			setTimeComplete			: setTimeComplete
	}

	Object.setPrototypeOf(data_support, fn);

	return data_support;
})
,
define("robotTW2/data_headquarter", [
	"robotTW2/database",
	"robotTW2/conf",
	"robotTW2/services",
	"robotTW2/notify"
	], function(
			database,
			conf,
			services,
			notify
	) {
	var setHeadquarter = function(data_headquarter){
		if(data_headquarter){
			database.set("data_headquarter", data_headquarter, true)
		}
	}

	var getHeadquarter = function(){
		return database.get("data_headquarter")
	}

	var getTimeCicle = function(){
		return database.get("data_headquarter").INTERVAL
	}

	var setTimeCicle = function(timecicle){
		if(timecicle){
			var data = database.get("data_headquarter")
			data.INTERVAL = timecicle
			database.set("data_headquarter", data, true)
		}
	}

	var setTimeComplete = function(time){
		if(time){
			var data = database.get("data_headquarter")
			data.COMPLETED_AT = time
			database.set("data_headquarter", data, true)
		}
	}

	var data_headquarter = database.get("data_headquarter");
	var dataNew = {
			INIT_ATIVATE			: false,
			ATIVATE 				: false,
			ENABLED 				: false,
			HOTKEY					: conf.HOTKEY.HEADQUARTER,
			INTERVAL				: conf.INTERVAL.HEADQUARTER,
			VERSION					: conf.VERSION.HEADQUARTER,
			RESERVA 				: {
				FOOD			: conf.RESERVA.HEADQUARTER.FOOD,
				WOOD			: conf.RESERVA.HEADQUARTER.WOOD,
				CLAY			: conf.RESERVA.HEADQUARTER.CLAY,
				IRON			: conf.RESERVA.HEADQUARTER.IRON,
				SLOTS			: conf.RESERVA.HEADQUARTER.SLOTS
			},
			BUILDINGORDER 			: conf.BUILDINGORDER,
			BUILDINGLIMIT 			: conf.BUILDINGLIMIT,
			BUILDINGLEVELS 			: conf.BUILDINGLEVELS
	}

	if(!data_headquarter){
		data_headquarter = dataNew
		database.set("data_headquarter", data_headquarter, true)
	} else {
		if(!data_headquarter.VERSION || data_headquarter.VERSION < conf.VERSION.HEADQUARTER){
			notify("data_headquarter");
			data_headquarter = dataNew
			database.set("data_headquarter", data_headquarter, true)
		} else {
			if(!data_headquarter.INIT_ATIVATE) data_headquarter.ATIVATE = !1;
			if(data_headquarter.INIT_ATIVATE) data_headquarter.ATIVATE = !0;
			database.set("data_headquarter", data_headquarter, true)		
		}
	}

	var fn = {
			setHeadquarter			: setHeadquarter,
			getHeadquarter			: getHeadquarter,
			getTimeCicle			: getTimeCicle,
			setTimeCicle			: setTimeCicle,
			setTimeComplete			: setTimeComplete
	}

	Object.setPrototypeOf(data_headquarter, fn);

	return data_headquarter;
})
,
define("robotTW2/data_recon", [
	"robotTW2/database",
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
	var setRecon = function(data_recon){
		if(data_recon){
			database.set("data_recon", data_recon, true)
		}
	}

	var getRecon = function(){
		return database.get("data_recon")
	}

	var data_recon = database.get("data_recon");
	var dataNew = {
			INIT_ATIVATE			: false,
			ATIVATE 				: false,
			ENABLED 				: false,
			HOTKEY					: conf.HOTKEY.RECON,
			VERSION					: conf.VERSION.RECON,
			RENAME		 			: unitTypesRenameRecon
	}

	if(!data_recon){
		data_recon = dataNew
		database.set("data_recon", data_recon, true)
	} else {
		if(!data_recon.VERSION || data_recon.VERSION < conf.VERSION.RECON){
			notify("data_recon");
			data_recon = dataNew
			database.set("data_recon", data_recon, true)
		} else {
			if(!data_recon.INIT_ATIVATE) data_recon.ATIVATE = !1;
			if(data_recon.INIT_ATIVATE) data_recon.ATIVATE = !0;
			database.set("data_recon", data_recon, true)		
		}
	}

	var fn = {
			setRecon			: setRecon,
			getRecon			: getRecon
	}

	Object.setPrototypeOf(data_recon, fn);

	return data_recon;
})
,
define("robotTW2/data_deposit", [
	"robotTW2/database",
	"robotTW2/conf",
	"robotTW2/services",
	"robotTW2/notify"
	], function(
			database,
			conf,
			services,
			notify
	) {
	var setDeposit = function(data_deposit){
		if(data_deposit){
			database.set("data_deposit", data_deposit, true)
		}
	}

	var getDeposit = function(){
		return database.get("data_deposit")
	}

	var getTimeCicle = function(){
		return database.get("data_deposit").INTERVAL
	}

	var setTimeCicle = function(timecicle){
		if(timecicle){
			var data = database.get("data_deposit")
			data.INTERVAL = timecicle
			database.set("data_deposit", data, true)
		}
	}

	var setTimeComplete = function(time){
		if(time){
			var data = database.get("data_deposit")
			data.COMPLETED_AT = time
			database.set("data_deposit", data, true)
		}
	}

	var data_deposit = database.get("data_deposit");
	var dataNew = {
			INIT_ATIVATE			: false,
			ATIVATE 				: false,
			ENABLED 				: false,
			USE_REROLL				: false,
			HOTKEY					: conf.HOTKEY.DEPOSIT,
			VERSION					: conf.VERSION.DEPOSIT,
			INTERVAL				: conf.INTERVAL.DEPOSIT
	}

	if(!data_deposit){
		data_deposit = dataNew
		database.set("data_deposit", data_deposit, true)
	} else {
		if(!data_deposit.VERSION || data_deposit.VERSION < conf.VERSION.DEPOSIT){
			notify("data_deposit");
			data_deposit = dataNew
			database.set("data_deposit", data_deposit, true)
		} else {
			if(!data_deposit.INIT_ATIVATE) data_deposit.ATIVATE = !1;
			if(data_deposit.INIT_ATIVATE) data_deposit.ATIVATE = !0;
			database.set("data_deposit", data_deposit, true)		
		}
	}

	var fn = {
			setDeposit			: setDeposit,
			getDeposit			: getDeposit,
			getTimeCicle		: getTimeCicle,
			setTimeCicle		: setTimeCicle,
			setTimeComplete		: setTimeComplete
	}

	Object.setPrototypeOf(data_deposit, fn);

	return data_deposit;
})
,
define("robotTW2/data_recruit", [
	"robotTW2/database",
	"robotTW2/conf",
	"robotTW2/services",
	"robotTW2/notify"
	], function(
			database,
			conf,
			services,
			notify
	) {
	var setRecruit = function(data_recruit){
		if(data_recruit){
			database.set("data_recruit", data_recruit, true)
		}
	}

	var getRecruit = function(){
		return database.get("data_recruit")
	}

	var getTimeCicle = function(){
		return database.get("data_recruit").INTERVAL
	}

	var setTimeCicle = function(timecicle){
		if(timecicle){
			var data = database.get("data_recruit")
			data.INTERVAL = timecicle
			database.set("data_recruit", data, true)
		}
	}

	var setTimeComplete = function(time){
		if(time){
			var data = database.get("data_recruit")
			data.COMPLETED_AT = time
			database.set("data_recruit", data, true)
		}
	}

	var data_recruit = database.get("data_recruit");
	var dataNew = {
			INIT_ATIVATE			: false,
			ATIVATE 				: false,
			ENABLED 				: false,
			HOTKEY					: conf.HOTKEY.RECRUIT,
			VERSION					: conf.VERSION.RECRUIT,
			INTERVAL				: conf.INTERVAL.RECRUIT,
			RESERVA 				: {
				FOOD			: conf.RESERVA.RECRUIT.FOOD,
				WOOD			: conf.RESERVA.RECRUIT.WOOD,
				CLAY			: conf.RESERVA.RECRUIT.CLAY,
				IRON			: conf.RESERVA.RECRUIT.IRON,
				SLOTS			: conf.RESERVA.RECRUIT.SLOTS
			},
			TROOPS_NOT				: conf.TROOPS_NOT,
			GROUPS					: {}
	}

	if(!data_recruit){
		data_recruit = dataNew
		database.set("data_recruit", data_recruit, true)
	} else {
		if(!data_recruit.VERSION || data_recruit.VERSION < conf.VERSION.RECRUIT){
			notify("data_recruit");
			data_recruit = dataNew
			database.set("data_recruit", data_recruit, true)
		} else {
			if(!data_recruit.INIT_ATIVATE) data_recruit.ATIVATE = !1;
			if(data_recruit.INIT_ATIVATE) data_recruit.ATIVATE = !0;
			database.set("data_recruit", data_recruit, true)		
		}
	}

	var fn = {
			setRecruit			: setRecruit,
			getRecruit			: getRecruit,
			getTimeCicle		: getTimeCicle,
			setTimeCicle		: setTimeCicle,
			setTimeComplete		: setTimeComplete
	}

	Object.setPrototypeOf(data_recruit, fn);

	return data_recruit;
})
,
define("robotTW2/data_spy", [
	"robotTW2/database",
	"robotTW2/conf",
	"robotTW2/services",
	"robotTW2/notify"
	], function(
			database,
			conf,
			services,
			notify
	) {
	var setSpy = function(data_spy){
		if(data_spy){
			database.set("data_spy", data_spy, true)
		}
	}

	var getSpy = function(){
		return database.get("data_spy")
	}

	var getTimeCicle = function(){
		return database.get("data_spy").INTERVAL
	}

	var setTimeCicle = function(timecicle){
		if(timecicle){
			var data = database.get("data_spy")
			data.INTERVAL = timecicle
			database.set("data_spy", data, true)
		}
	}

	var setTimeComplete = function(time){
		if(time){
			var data = database.get("data_spy")
			data.COMPLETED_AT = time
			database.set("data_spy", data, true)
		}
	}

	var data_spy = database.get("data_spy");
	var dataNew = {
			INIT_ATIVATE			: false,
			ATIVATE 				: false,
			ENABLED 				: false,
			HOTKEY					: conf.HOTKEY.SPY,
			VERSION					: conf.VERSION.SPY,
			INTERVAL				: conf.INTERVAL.SPY,
	}

	if(!data_spy){
		data_spy = dataNew
		database.set("data_spy", data_spy, true)
	} else {
		if(!data_spy.VERSION || data_spy.VERSION < conf.VERSION.SPY){
			notify("data_spy");
			data_spy = dataNew
			database.set("data_spy", data_spy, true)
		} else {
			if(!data_spy.INIT_ATIVATE) data_spy.ATIVATE = !1;
			if(data_spy.INIT_ATIVATE) data_spy.ATIVATE = !0;
			database.set("data_spy", data_spy, true)		
		}
	}

	var fn = {
			setSpy				: setSpy,
			getSpy				: getSpy,
			getTimeCicle		: getTimeCicle,
			setTimeCicle		: setTimeCicle,
			setTimeComplete		: setTimeComplete

	}

	Object.setPrototypeOf(data_spy, fn);

	return data_spy;
})
,
define("robotTW2/data_alert", [
	"robotTW2/database",
	"robotTW2/conf",
	"robotTW2/services",
	"robotTW2/notify"
	], function(
			database,
			conf,
			services,
			notify
	) {
	var setAlert = function(data_alert){
		if(data_alert){
			database.set("data_alert", data_alert, true)
		}
	}

	var getAlert = function(){
		return database.get("data_alert")
	}

	var setFriends = function(friends){
		var data_alert = database.get("data_alert")
		if(friends){
			data_alert.FRIENDS = friends;
			database.set("data_alert", data_alert, true)
		}
	}

	var getFriends = function(){
		return database.get("data_alert").FRIENDS
	}

	var getTimeCicle = function(){
		return database.get("data_alert").INTERVAL
	}

	var setTimeCicle = function(timecicle){
		if(timecicle){
			var data = database.get("data_alert")
			data.INTERVAL = timecicle
			database.set("data_alert", data, true)
		}
	}

	var setTimeComplete = function(time){
		if(time){
			var data = database.get("data_alert")
			data.COMPLETED_AT = time
			database.set("data_alert", data, true)
		}
	}

	var data_alert = database.get("data_alert");
	var dataNew = {
			INIT_ATIVATE			: false,
			ATIVATE 				: false,
			ENABLED 				: false,
			HOTKEY					: "ctrl+alt+a",
			INTERVAL	 			: conf.INTERVAL.ALERT,
			VERSION					: conf.VERSION.ALERT,
			FRIENDS					: []
	}

	if(!data_alert){
		data_alert = dataNew
		database.set("data_alert", data_alert, true)
	} else {
		if(!data_alert.VERSION || data_alert.VERSION < conf.VERSION.ALERT){
			notify("data_alert");
			data_alert = dataNew
			database.set("data_alert", data_alert, true)
		} else {
			if(!data_alert.INIT_ATIVATE) data_alert.ATIVATE = !1;
			if(data_alert.INIT_ATIVATE) data_alert.ATIVATE = !0;
			database.set("data_alert", data_alert, true)		
		}
	}

	var fn = {
			setAlert			: setAlert,
			getAlert			: getAlert,
			setFriends			: setFriends,
			getFriends			: getFriends,
			getTimeCicle		: getTimeCicle,
			setTimeCicle		: setTimeCicle,
			setTimeComplete		:setTimeComplete
	}

	Object.setPrototypeOf(data_alert, fn);

	return data_alert;
})
,
define("robotTW2/data_farm", [
	"robotTW2/database",
	"robotTW2/conf",
	"robotTW2/services",
	"robotTW2/notify",
	"helper/time"
	], function(
			database,
			conf,
			services,
			notify,
			helper
	) {

	var addException = function(exception){
		if(exception){
			var data_farm = database.get("data_farm");
			angular.merge(data_farm.LIST_EXCEPTIONS, exception)
			database.set("data_farm", data_farm, true)
		}
	}

	var removeException = function(exception){
		if(exception){
			var data_farm = database.get("data_farm");
			data_farm.LIST_EXCEPTIONS = data_farm.LIST_EXCEPTIONS.filter(f => f != exception)
			database.set("data_farm", data_farm, true)
		}
	}

	var getExceptions = function(){
		return database.get("data_farm").LIST_EXCEPTIONS
	}

	var addBB = function(bb){
		if(bb){
			var data_farm = database.get("data_farm");
			angular.merge(data_farm.LIST_BB, bb)
			database.set("data_farm", data_farm, true)
		}
	}

	var clearBB = function(){
		var data_farm = database.get("data_farm");
		data_farm.LIST_BB = []
		database.set("data_farm", data_farm, true)
	}

	var removeBB = function(bb){
		if(bb){
			var data_farm = database.get("data_farm");
			data_farm.LIST_BB = data_farm.LIST_BB.filter(f => f != bb)
			database.set("data_farm", data_farm, true)
		}
	}

	var getBBs = function(){
		return database.get("data_farm").LIST_BB
	}

	var getFarm = function(){
		return database.get("data_farm")
	}

	var setFarm = function(data_farm){
		if(data_farm){
			database.set("data_farm", data_farm, true)
		}
	}

	var setTimeComplete = function(time){
		if(time){
			var data = database.get("data_farm")
			data.COMPLETED_AT = time
			database.set("data_farm", data, true)
		}
	}

	var data_farm = database.get("data_farm");
	var dataNew = {
			INIT_ATIVATE			: false,
			ATIVATE 				: false,
			ENABLED 				: false,
			HOTKEY					: "ctrl+alt+f",
			MAX_COMMANDS			: conf.MAX_COMMANDS,
			MIN_POINTS				: conf.MIN_POINTS,
			MAX_POINTS				: conf.MAX_POINTS,
			VERSION					: conf.VERSION.FARM,
			TEMPO_DE_PERCURSO		: conf.TEMPO_DE_PERCURSO,
			TEMPO_DE_FARM			: conf.TEMPO_DE_FARM,
			INICIO_DE_FARM			: helper.gameTime(),
			TERMINO_DE_FARM			: new Date((services.$filter("date")(new Date(helper.gameTime() + 86400000), "yyyy-MM-dd")) + " 06:00:00").getTime(),
			LIST_EXCEPTIONS			: [],
			LIST_BB					: [],
			LIST_ATIVATE			: {}
	}


	if(!data_farm){
		data_farm = dataNew
		database.set("data_farm", data_farm, true)
	} else {
		if(!data_farm.VERSION || data_farm.VERSION < conf.VERSION.FARM){
			notify("data_farm");
			data_farm = dataNew
			database.set("data_farm", data_farm, true)
		} else {
			if(!data_farm.INIT_ATIVATE) data_farm.ATIVATE = !1;
			if(data_farm.INIT_ATIVATE) data_farm.ATIVATE = !0;
			database.set("data_farm", data_farm, true)		
		}
	}

	var fn = {
			addException		: addException,
			removeException		: removeException,
			getExceptions		: getExceptions,
			addBB				: addBB,
			clearBB				: clearBB,
			removeBB			: removeBB,
			getBBs				: getBBs,
			getFarm				: getFarm,
			setFarm				: setFarm,
			setTimeComplete		: setTimeComplete
	}

	Object.setPrototypeOf(data_farm, fn);

	return data_farm;
})
,
define("robotTW2/data_villages", [
	"robotTW2/database",
	"robotTW2/ready",
	"robotTW2/conf",
	"robotTW2/services",
	"robotTW2/providers"
	], function(
			database,
			ready,
			conf,
			services,
			providers
	) {

	var verifyDB = function (data_villages, villagesExtended){
		if (data_villages == undefined){
			return false;
		}
		updated = false;
		Object.keys(data_villages.VILLAGES).map(function(m){
			return m
		}).forEach(function(v){
			if(!Object.keys(villagesExtended).map(function(m){
				return m
			}).find(f=>f==v)){
				delete data_villages.VILLAGES[v]
				updated = true;
			}
		})
		return updated;
	}
	, verifyVillages = function (data_villages, villagesExtended){
		updated = false;
		if (data_villages == undefined){
			return false;
		}
		Object.keys(villagesExtended).map(function(m){
			return m
		}).forEach(function(v){
			if(!Object.keys(data_villages.VILLAGES).map(function(m){
				return m
			}).find(f=>f==v)){
				angular.merge(villagesExtended[v], {
					EXECUTEBUILDINGORDER 	: conf.EXECUTEBUILDINGORDER,
					BUILDINGORDER 			: conf.BUILDINGORDER,
					BUILDINGLIMIT 			: conf.BUILDINGLIMIT,
					BUILDINGLEVELS 			: conf.BUILDINGLEVELS
				})
				data_villages.VILLAGES[v] = villagesExtended[v]
				updated = true;
			}
		})
		if(updated){setVillages(data_villages.VILLAGES)}
		return updated
	}
	, setVillages = function(vs){
		var data_villages = database.get("data_villages")

		data_villages.VILLAGES = vs;
		database.set("data_villages", data_villages, true)
	}
	, getVillages = function(){
		var data_villages = database.get("data_villages")
		var villagesDB = data_villages.VILLAGES
		return villagesDB
	}
	, updateVillages = function($event){
		var villagesDB = {}
		, villagesExtended = {}
		, updated = false
		, dt_villages = {};

		angular.extend(villagesDB, services.modelDataService.getVillages())
		angular.merge(villagesExtended, villagesDB)

		dt_villages = database.get("data_villages")

		if(!dt_villages || verifyDB(dt_villages, villagesExtended) || verifyVillages(dt_villages, villagesExtended)) {
			if (dt_villages == undefined){
				dt_villages = {}
				, vb = {}
				, ve = {}
				angular.extend(vb, services.modelDataService.getVillages())
				angular.merge(ve, vb)
				dt_villages.VERSION = conf.VERSION.VILLAGES
				dt_villages.VILLAGES = {}
				database.set("data_villages", dt_villages, true)
				verifyVillages(dt_villages, ve)
			} else {
				database.set("data_villages", dt_villages, true)	
			}

		} else {
			if(!dt_villages.VERSION || dt_villages.VERSION < conf.VERSION.VILLAGES){
				dt_villages.VERSION = conf.VERSION.VILLAGES
				database.set("data_villages", dt_villages, true)
			}
		}
		return dt_villages;
	}
	, renameVillage = function($event, data){
		data_villages = database.get("data_villages")
		var id = data.village_id;
		!data_villages.VILLAGES[id] ? !1 : data_villages.VILLAGES[id].data.name = data.name
				setVillages(data_villages.VILLAGES)
	}
	, fn = {
			setVillages 	: setVillages,
			getVillages 	: getVillages
	};

	$rootScope.$on(providers.eventTypeProvider.VILLAGE_LOST, updateVillages);
	$rootScope.$on(providers.eventTypeProvider.VILLAGE_CONQUERED, updateVillages);
	$rootScope.$on(providers.eventTypeProvider.VILLAGE_NAME_CHANGED, renameVillage);

	var data_villages = updateVillages()
	Object.setPrototypeOf(data_villages, fn);
	return data_villages;

})
