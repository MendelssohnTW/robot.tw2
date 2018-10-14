define("robotTW2/databases/database", [
	"robotTW2/services",
	"robotTW2/conf"
	], function(
			services,
			conf
	) {
	var database = {};
	return database.prefixStandard = "kingdom_storage"
		, database.prefix = services.modelDataService.getSelectedCharacter().getId() + "_" + services.modelDataService.getSelectedCharacter().getWorldId() + "_"
		, database.getKeyPrefix = function(key, options) {
		options = options || {};
		if (options.noPrefix) {
			return key;
		} else {
			return this.prefix + key;
		}
	}
	, database.set = function set(key, value, options) {
		var keyName = this.getKeyPrefix(key, options)
		var newValue = {[keyName]: value}
		//var keyValue = JSON.stringify({"data": value});
		var tb = JSON.parse(localStorage.getItem(this.prefixStandard));
		var data = {};
		if(tb){data = tb.data}else{tb = {"data":{}}}

		angular.extend(data, newValue);
		tb.data = data;
		var keyValue = JSON.stringify(tb);

		try {
			//localStorage.setItem(keyName, keyValue);
			localStorage.setItem(this.prefixStandard, keyValue);
		} catch (e) {
			if (console) console.warn("database não pode ser gravado '{"+ key +": "+ value +"}' , porque o localStorage está¡ cheio.");
		}
	}
	, database.get = function get(key, missing, options) {
		var keyName = this.getKeyPrefix(key, options),
		value;
		try {
			//value = JSON.parse(localStorage.getItem(keyName));
			var dbt = JSON.parse(localStorage.getItem(this.prefixStandard));
			value = dbt.data[keyName];
		} catch (e) {
//			if(localStorage[keyName]) {
//			value = {data: localStorage.getItem(keyName)};
//			} else{
//			value = null;
//			}
			if(localStorage[this.prefixStandard]) {
				value = {[this.prefixStandard]: localStorage.getItem(this.prefixStandard)};
			} else{
				value = null;
			}
		}
		//return null === value ? missing : "object" == typeof value && void 0 !== value.data ? value.data : missing
		return null === value ? missing : "object" == typeof value && void 0 !== value ? value : missing
	}
	, database;
})
//,
//define("robotTW2/databases/databases/database/data_attack", [
//	"robotTW2/databases/database",
//	"robotTW2/conf",
//	"robotTW2/services",
//	"robotTW2/notify"
//	], function(
//			database,
//			conf,
//			services,
//			notify
//	) {
//	var setAttack = function(data_attack){
//		if(data_attack){
//			database.set("data_attack", data_attack, true)
//		}
//	}
//
//	var getAttack = function(){
//		return database.get("data_attack")
//	}
//
//	var getTimeCicle = function(){
//		return database.get("data_attack").interval
//	}
//
//	var setTimeCicle = function(timecicle){
//		if(timecicle){
//			var data = database.get("data_attack")
//			data.interval = timecicle
//			database.set("data_attack", data, true)
//		}
//	}
//
//	var setTimeComplete = function(time){
//		if(time){
//			var data = database.get("data_attack")
//			data.completed_at = time
//			database.set("data_attack", data, true)
//		}
//	}
//
//	var data_attack = database.get("data_attack");
//	var dataNew = {
//			auto_initialize			: false,
//			initialized 			: false,
//			activated 				: false,
//			interval				: conf.INTERVAL.ATTACK,
//			version					: conf.VERSION.ATTACK,
//			COMMANDS				: {}
//	}
//
//	if(!data_attack){
//		data_attack = dataNew
//		database.set("data_attack", data_attack, true)
//	} else {
//		if(!data_attack.version || data_attack.version < conf.VERSION.ATTACK){
//
//			data_attack = dataNew
//			database.set("data_attack", data_attack, true)
//			notify("data_attack");
//		} else {
//			if(!data_attack.auto_initialize) data_attack.initialized = !1;
//			if(data_attack.auto_initialize) data_attack.initialized = !0;
//			database.set("data_attack", data_attack, true)		
//		}
//	}
//
//	var fn = {
//			setAttack				: setAttack,
//			getAttack				: getAttack,
//			getTimeCicle			: getTimeCicle,
//			setTimeCicle			: setTimeCicle,
//			setTimeComplete			: setTimeComplete
//	}
//
//	Object.setPrototypeOf(data_attack, fn);
//
//	return data_attack;
//})
//,
//define("robotTW2/databases/databases/database/data_support", [
//	"robotTW2/databases/database",
//	"robotTW2/conf",
//	"robotTW2/services",
//	"robotTW2/notify"
//	], function(
//			database,
//			conf,
//			services,
//			notify
//	) {
//	var setSupport = function(data_support){
//		if(data_support){
//			database.set("data_support", data_support, true)
//		}
//	}
//
//	var getSupport = function(){
//		return database.get("data_support")
//	}
//
//	var getTimeCicle = function(){
//		return database.get("data_support").interval
//	}
//
//	var setTimeCicle = function(timecicle){
//		if(timecicle){
//			var data = database.get("data_support")
//			data.interval = timecicle
//			database.set("data_support", data, true)
//		}
//	}
//
//	var setTimeComplete = function(time){
//		if(time){
//			var data = database.get("data_support")
//			data.completed_at = time
//			database.set("data_support", data, true)
//		}
//	}
//
//	var data_support = database.get("data_support");
//	var dataNew = {
//			auto_initialize			: false,
//			initialized 				: false,
//			activated 				: false,
//			TIME_CORRECTION_COMMAND	: conf.TIME_CORRECTION_COMMAND,
//			interval				: conf.INTERVAL.ATTACK,
//			version					: conf.VERSION.ATTACK,
//			COMMANDS				: {}
//	}
//
//	if(!data_support){
//		data_support = dataNew
//		database.set("data_support", data_support, true)
//	} else {
//		if(!data_support.version || data_support.version < conf.VERSION.SUPPORT){
//
//			data_support = dataNew
//			database.set("data_support", data_support, true)
//			notify("data_support");
//		} else {
//			if(!data_support.auto_initialize) data_support.initialized = !1;
//			if(data_support.auto_initialize) data_support.initialized = !0;
//			database.set("data_support", data_support, true)		
//		}
//	}
//
//	var fn = {
//			setSupport				: setSupport,
//			getSupport				: getSupport,
//			getTimeCicle			: getTimeCicle,
//			setTimeCicle			: setTimeCicle,
//			setTimeComplete			: setTimeComplete
//	}
//
//	Object.setPrototypeOf(data_support, fn);
//
//	return data_support;
//})
//,
//define("robotTW2/databases/databases/database/data_headquarter", [
//	"robotTW2/databases/database",
//	"robotTW2/conf",
//	"robotTW2/services",
//	"robotTW2/notify"
//	], function(
//			database,
//			conf,
//			services,
//			notify
//	) {
//	var setHeadquarter = function(data_headquarter){
//		if(data_headquarter){
//			database.set("data_headquarter", data_headquarter, true)
//		}
//	}
//
//	var getHeadquarter = function(){
//		return database.get("data_headquarter")
//	}
//
//	var getTimeCicle = function(){
//		return database.get("data_headquarter").interval
//	}
//
//	var setTimeCicle = function(timecicle){
//		if(timecicle){
//			var data = database.get("data_headquarter")
//			data.interval = timecicle
//			database.set("data_headquarter", data, true)
//		}
//	}
//
//	var setTimeComplete = function(time){
//		if(time){
//			var data = database.get("data_headquarter")
//			data.completed_at = time
//			database.set("data_headquarter", data, true)
//		}
//	}
//
//	var data_headquarter = database.get("data_headquarter");
//	var dataNew = {
//			auto_initialize			: false,
//			initialized 				: false,
//			activated 				: false,
//			interval				: conf.INTERVAL.HEADQUARTER,
//			version					: conf.VERSION.HEADQUARTER,
//			reserva 				: {
//				food			: conf.RESERVA.HEADQUARTER.FOOD,
//				wood			: conf.RESERVA.HEADQUARTER.WOOD,
//				clay			: conf.RESERVA.HEADQUARTER.CLAY,
//				iron			: conf.RESERVA.HEADQUARTER.IRON,
//				slots			: conf.RESERVA.HEADQUARTER.SLOTS
//			},
//			BUILDINGORDER 			: conf.BUILDINGORDER,
//			BUILDINGLIMIT 			: conf.BUILDINGLIMIT,
//			BUILDINGLEVELS 			: conf.BUILDINGLEVELS
//	}
//
//	if(!data_headquarter){
//		data_headquarter = dataNew
//		database.set("data_headquarter", data_headquarter, true)
//	} else {
//		if(!data_headquarter.version || data_headquarter.version < conf.VERSION.HEADQUARTER){
//
//			data_headquarter = dataNew
//			database.set("data_headquarter", data_headquarter, true)
//			notify("data_headquarter");
//		} else {
//			if(!data_headquarter.auto_initialize) data_headquarter.initialized = !1;
//			if(data_headquarter.auto_initialize) data_headquarter.initialized = !0;
//			database.set("data_headquarter", data_headquarter, true)		
//		}
//	}
//
//	var fn = {
//			setHeadquarter			: setHeadquarter,
//			getHeadquarter			: getHeadquarter,
//			getTimeCicle			: getTimeCicle,
//			setTimeCicle			: setTimeCicle,
//			setTimeComplete			: setTimeComplete
//	}
//
//	Object.setPrototypeOf(data_headquarter, fn);
//
//	return data_headquarter;
//})
//,
//define("robotTW2/databases/databases/database/data_recon", [
//	"robotTW2/databases/database",
//	"robotTW2/conf",
//	"robotTW2/services",
//	"robotTW2/notify",
//	"robotTW2/unitTypesRenameRecon"
//	], function(
//			database,
//			conf,
//			services,
//			notify,
//			unitTypesRenameRecon
//	) {
//	var setRecon = function(data_recon){
//		if(data_recon){
//			database.set("data_recon", data_recon, true)
//		}
//	}
//
//	var getRecon = function(){
//		return database.get("data_recon")
//	}
//
//	var data_recon = database.get("data_recon");
//	var dataNew = {
//			auto_initialize			: false,
//			initialized 				: false,
//			activated 				: false,
//			version					: conf.VERSION.RECON,
//			RENAME		 			: unitTypesRenameRecon
//	}
//
//	if(!data_recon){
//		data_recon = dataNew
//		database.set("data_recon", data_recon, true)
//	} else {
//		if(!data_recon.version || data_recon.version < conf.VERSION.RECON){
//
//			data_recon = dataNew
//			database.set("data_recon", data_recon, true)
//			notify("data_recon");
//		} else {
//			if(!data_recon.auto_initialize) data_recon.initialized = !1;
//			if(data_recon.auto_initialize) data_recon.initialized = !0;
//			database.set("data_recon", data_recon, true)		
//		}
//	}
//
//	var fn = {
//			setRecon			: setRecon,
//			getRecon			: getRecon
//	}
//
//	Object.setPrototypeOf(data_recon, fn);
//
//	return data_recon;
//})
//,
//define("robotTW2/databases/databases/database/data_deposit", [
//	"robotTW2/databases/database",
//	"robotTW2/conf",
//	"robotTW2/services",
//	"robotTW2/notify"
//	], function(
//			database,
//			conf,
//			services,
//			notify
//	) {
//	var setDeposit = function(data_deposit){
//		if(data_deposit){
//			database.set("data_deposit", data_deposit, true)
//		}
//	}
//
//	var getDeposit = function(){
//		return database.get("data_deposit")
//	}
//
//	var getTimeCicle = function(){
//		return database.get("data_deposit").interval
//	}
//
//	var setTimeCicle = function(timecicle){
//		if(timecicle){
//			var data = database.get("data_deposit")
//			data.interval = timecicle
//			database.set("data_deposit", data, true)
//		}
//	}
//
//	var setTimeComplete = function(time){
//		if(time){
//			var data = database.get("data_deposit")
//			data.completed_at = time
//			database.set("data_deposit", data, true)
//		}
//	}
//
//	var data_deposit = database.get("data_deposit");
//	var dataNew = {
//			auto_initialize			: false,
//			initialized 				: false,
//			activated 				: false,
//			use_reroll				: false,
//			version					: conf.VERSION.DEPOSIT,
//			interval				: conf.INTERVAL.DEPOSIT
//	}
//
//	if(!data_deposit){
//		data_deposit = dataNew
//		database.set("data_deposit", data_deposit, true)
//	} else {
//		if(!data_deposit.version || data_deposit.version < conf.VERSION.DEPOSIT){
//
//			data_deposit = dataNew
//			database.set("data_deposit", data_deposit, true)
//			notify("data_deposit");
//		} else {
//			if(!data_deposit.auto_initialize) data_deposit.initialized = !1;
//			if(data_deposit.auto_initialize) data_deposit.initialized = !0;
//			database.set("data_deposit", data_deposit, true)		
//		}
//	}
//
//	var fn = {
//			setDeposit			: setDeposit,
//			getDeposit			: getDeposit,
//			getTimeCicle		: getTimeCicle,
//			setTimeCicle		: setTimeCicle,
//			setTimeComplete		: setTimeComplete
//	}
//
//	Object.setPrototypeOf(data_deposit, fn);
//
//	return data_deposit;
//})
//,
//define("robotTW2/databases/databases/database/data_recruit", [
//	"robotTW2/databases/database",
//	"robotTW2/conf",
//	"robotTW2/services",
//	"robotTW2/notify"
//	], function(
//			database,
//			conf,
//			services,
//			notify
//	) {
//	var setRecruit = function(data_recruit){
//		if(data_recruit){
//			database.set("data_recruit", data_recruit, true)
//		}
//	}
//
//	var getRecruit = function(){
//		return database.get("data_recruit")
//	}
//
//	var getTimeCicle = function(){
//		return database.get("data_recruit").interval
//	}
//
//	var setTimeCicle = function(timecicle){
//		if(timecicle){
//			var data = database.get("data_recruit")
//			data.interval = timecicle
//			database.set("data_recruit", data, true)
//		}
//	}
//
//	var setTimeComplete = function(time){
//		if(time){
//			var data = database.get("data_recruit")
//			data.completed_at = time
//			database.set("data_recruit", data, true)
//		}
//	}
//
//	var data_recruit = database.get("data_recruit");
//	var dataNew = {
//			auto_initialize			: false,
//			initialized 				: false,
//			activated 				: false,
//			version					: conf.VERSION.RECRUIT,
//			interval				: conf.INTERVAL.RECRUIT,
//			reserva 				: {
//				food			: conf.RESERVA.RECRUIT.FOOD,
//				wood			: conf.RESERVA.RECRUIT.WOOD,
//				clay			: conf.RESERVA.RECRUIT.CLAY,
//				iron			: conf.RESERVA.RECRUIT.IRON,
//				slots			: conf.RESERVA.RECRUIT.SLOTS
//			},
//			troops_not				: conf.TROOPS_NOT,
//			groups					: {}
//	}
//
//	if(!data_recruit){
//		data_recruit = dataNew
//		database.set("data_recruit", data_recruit, true)
//	} else {
//		if(!data_recruit.version || data_recruit.version < conf.VERSION.RECRUIT){
//
//			data_recruit = dataNew
//			database.set("data_recruit", data_recruit, true)
//			notify("data_recruit");
//		} else {
//			if(!data_recruit.auto_initialize) data_recruit.initialized = !1;
//			if(data_recruit.auto_initialize) data_recruit.initialized = !0;
//			database.set("data_recruit", data_recruit, true)		
//		}
//	}
//
//	var fn = {
//			setRecruit			: setRecruit,
//			getRecruit			: getRecruit,
//			getTimeCicle		: getTimeCicle,
//			setTimeCicle		: setTimeCicle,
//			setTimeComplete		: setTimeComplete
//	}
//
//	Object.setPrototypeOf(data_recruit, fn);
//
//	return data_recruit;
//})
//,
//define("robotTW2/databases/databases/database/data_spy", [
//	"robotTW2/databases/database",
//	"robotTW2/conf",
//	"robotTW2/services",
//	"robotTW2/notify"
//	], function(
//			database,
//			conf,
//			services,
//			notify
//	) {
//	var setSpy = function(data_spy){
//		if(data_spy){
//			database.set("data_spy", data_spy, true)
//		}
//	}
//
//	var getSpy = function(){
//		return database.get("data_spy")
//	}
//
//	var getTimeCicle = function(){
//		return database.get("data_spy").interval
//	}
//
//	var setTimeCicle = function(timecicle){
//		if(timecicle){
//			var data = database.get("data_spy")
//			data.interval = timecicle
//			database.set("data_spy", data, true)
//		}
//	}
//
//	var setTimeComplete = function(time){
//		if(time){
//			var data = database.get("data_spy")
//			data.completed_at = time
//			database.set("data_spy", data, true)
//		}
//	}
//
//	var data_spy = database.get("data_spy");
//	var dataNew = {
//			auto_initialize			: false,
//			initialized 				: false,
//			activated 				: false,
//			version					: conf.VERSION.SPY,
//			interval				: conf.INTERVAL.SPY,
//	}
//
//	if(!data_spy){
//		data_spy = dataNew
//		database.set("data_spy", data_spy, true)
//	} else {
//		if(!data_spy.version || data_spy.version < conf.VERSION.SPY){
//
//			data_spy = dataNew
//			database.set("data_spy", data_spy, true)
//			notify("data_spy");
//		} else {
//			if(!data_spy.auto_initialize) data_spy.initialized = !1;
//			if(data_spy.auto_initialize) data_spy.initialized = !0;
//			database.set("data_spy", data_spy, true)		
//		}
//	}
//
//	var fn = {
//			setSpy				: setSpy,
//			getSpy				: getSpy,
//			getTimeCicle		: getTimeCicle,
//			setTimeCicle		: setTimeCicle,
//			setTimeComplete		: setTimeComplete
//
//	}
//
//	Object.setPrototypeOf(data_spy, fn);
//
//	return data_spy;
//})
//,
//define("robotTW2/databases/databases/database/data_alert", [
//	"robotTW2/databases/database",
//	"robotTW2/conf",
//	"robotTW2/services",
//	"robotTW2/notify"
//	], function(
//			database,
//			conf,
//			services,
//			notify
//	) {
//	var setAlert = function(data_alert){
//		if(data_alert){
//			database.set("data_alert", data_alert, true)
//		}
//	}
//
//	var getAlert = function(){
//		return database.get("data_alert")
//	}
//
//	var setFriends = function(friends){
//		var data_alert = database.get("data_alert")
//		if(friends){
//			data_alert.friends = friends;
//			database.set("data_alert", data_alert, true)
//		}
//	}
//
//	var getFriends = function(){
//		return database.get("data_alert").friends
//	}
//
//	var getTimeCicle = function(){
//		return database.get("data_alert").interval
//	}
//
//	var setTimeCicle = function(timecicle){
//		if(timecicle){
//			var data = database.get("data_alert")
//			data.interval = timecicle
//			database.set("data_alert", data, true)
//		}
//	}
//
//	var setTimeComplete = function(time){
//		if(time){
//			var data = database.get("data_alert")
//			data.completed_at = time
//			database.set("data_alert", data, true)
//		}
//	}
//
//	var data_alert = database.get("data_alert");
//	var dataNew = {
//			auto_initialize			: false,
//			initialized 				: false,
//			activated 				: false,
//			interval	 			: conf.INTERVAL.ALERT,
//			version					: conf.VERSION.ALERT,
//			friends					: []
//	}
//
//	if(!data_alert){
//		data_alert = dataNew
//		database.set("data_alert", data_alert, true)
//	} else {
//		if(!data_alert.version || data_alert.version < conf.VERSION.ALERT){
//			data_alert = dataNew
//			database.set("data_alert", data_alert, true)
//			notify("data_alert");
//		} else {
//			if(!data_alert.auto_initialize) data_alert.initialized = !1;
//			if(data_alert.auto_initialize) data_alert.initialized = !0;
//			database.set("data_alert", data_alert, true)		
//		}
//	}
//
//	var fn = {
//			setAlert			: setAlert,
//			getAlert			: getAlert,
//			setFriends			: setFriends,
//			getFriends			: getFriends,
//			getTimeCicle		: getTimeCicle,
//			setTimeCicle		: setTimeCicle,
//			setTimeComplete		:setTimeComplete
//	}
//
//	Object.setPrototypeOf(data_alert, fn);
//
//	return data_alert;
//})
