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
			if (console) console.warn("database não pode ser gravado '{"+ key +": "+ value +"}' , porque o localStorage está cheio.");
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
	"robotTW2/services"
	], function(
			database,
			conf,
			services
	) {
	var data_main = {}
	return data_main.setExtensions = function(extensions){
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
	, data_main.getExtensions = function(){
		var extensions = {
				HEADQUARTER		: {
					ATIVATE : database.get("data_headquarter") ? database.get("data_headquarter").ATIVATE : false,
							INIT_ATIVATE : database.get("data_headquarter") ? database.get("data_headquarter").INIT_ATIVATE : false,
									ENABLED : database.get("data_headquarter") ? database.get("data_headquarter").ENABLED : false
				},
				FARM			: {
					ATIVATE : database.get("data_farm") ? database.get("data_farm").ATIVATE : false,
							INIT_ATIVATE : database.get("data_farm") ? database.get("data_farm").INIT_ATIVATE : false,
									ENABLED : database.get("data_farm") ? database.get("data_farm").ENABLED : false
				},
				DEPOSIT			: {
					ATIVATE : database.get("data_deposit") ? database.get("data_deposit").ATIVATE : false,
							INIT_ATIVATE : database.get("data_deposit") ? database.get("data_deposit").INIT_ATIVATE : false,
									ENABLED : database.get("data_deposit") ? database.get("data_deposit").ENABLED : false
				},
				ATTACK			: {
					ATIVATE : database.get("data_attack") ? database.get("data_attack").ATIVATE : false,
							INIT_ATIVATE : database.get("data_attack") ? database.get("data_attack").INIT_ATIVATE : false,
									ENABLED : database.get("data_attack") ? database.get("data_attack").ENABLED : false
				},
				DEFENSE			: {
					ATIVATE : database.get("data_defense") ? database.get("data_defense").ATIVATE : false,
							INIT_ATIVATE : database.get("data_defense") ? database.get("data_defense").INIT_ATIVATE : false,
									ENABLED : database.get("data_defense") ? database.get("data_defense").ENABLED : false
				},
				SPY				: {
					ATIVATE : database.get("data_spy") ? database.get("data_spy").ATIVATE : false,
							INIT_ATIVATE : database.get("data_spy") ? database.get("data_spy").INIT_ATIVATE : false,
									ENABLED : database.get("data_spy") ? database.get("data_spy").ENABLED : false
				},
				RECRUIT			: {
					ATIVATE : database.get("data_recruit") ? database.get("data_recruit").ATIVATE : false,
							INIT_ATIVATE : database.get("data_recruit") ? database.get("data_recruit").INIT_ATIVATE : false,
									ENABLED : database.get("data_recruit") ? database.get("data_recruit").ENABLED : false
				},
				ALERT			: {
					ATIVATE : database.get("data_alert") ? database.get("data_alert").ATIVATE : false,
							INIT_ATIVATE : database.get("data_alert") ? database.get("data_alert").INIT_ATIVATE : false,
									ENABLED : database.get("data_alert") ? database.get("data_alert").ENABLED : false
				},
				RECON			: {
					ATIVATE : database.get("data_recon") ? database.get("data_recon").ATIVATE : false,
							INIT_ATIVATE : database.get("data_recon") ? database.get("data_recon").INIT_ATIVATE : false,
									ENABLED : database.get("data_recon") ? database.get("data_recon").ENABLED : false
				},
		}
		return extensions
	}
	, data_main

})
,
define("robotTW2/data_headquarter", [
	"robotTW2/database",
	"robotTW2/conf",
	"robotTW2/services"
	], function(
			database,
			conf,
			services
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

	var data_headquarter = database.get("data_headquarter");
	var dataNew = {
			INIT_ATIVATE			: false,
			ATIVATE 				: false,
			ENABLED 				: false,
			HOTKEY					: conf.HOTKEY.HEADQUARTER,
			INTERVAL				: conf.INTERVAL.HEADQUARTER,
			VERSION					: conf.VERSION.HEADQUARTER,
			BUILDINGORDER 			: conf.BUILDINGORDER,
			BUILDINGLIMIT 			: conf.BUILDINGLIMIT,
			BUILDINGLEVELS 			: conf.BUILDINGLEVELS
	}

	if(!data_headquarter){
		data_headquarter = dataNew
		database.set("data_headquarter", data_headquarter, true)
	} else {
		if(!data_headquarter.VERSION || data_headquarter.VERSION < conf.VERSION.HEADQUARTER){
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
			setTimeCicle			: setTimeCicle
	}

	Object.setPrototypeOf(data_headquarter, fn);

	return data_headquarter;
})
,
define("robotTW2/data_recon", [
	"robotTW2/database",
	"robotTW2/conf",
	"robotTW2/services"
	], function(
			database,
			conf,
			services
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
			RENAME_COMMAND 			: "snob"
	}

	if(!data_recon){
		data_recon = dataNew
		database.set("data_recon", data_recon, true)
	} else {
		if(!data_recon.VERSION || data_recon.VERSION < conf.VERSION.RECON){
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
	"robotTW2/services"
	], function(
			database,
			conf,
			services
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

	var data_deposit = database.get("data_deposit");
	var dataNew = {
			INIT_ATIVATE			: false,
			ATIVATE 				: false,
			ENABLED 				: false,
			USE_REROLL				: false,
			HOTKEY					: conf.HOTKEY.DEPOSIT,
			VERSION					: conf.VERSION.DEPOSIT,
			INTERVAL				: conf.INTERVAL.DEPOSIT,
	}

	if(!data_deposit){
		data_deposit = dataNew
		database.set("data_deposit", data_deposit, true)
	} else {
		if(!data_deposit.VERSION || data_deposit.VERSION < conf.VERSION.DEPOSIT){
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
			setTimeCicle		: setTimeCicle
			
	}

	Object.setPrototypeOf(data_deposit, fn);

	return data_deposit;
})
,
define("robotTW2/data_alert", [
	"robotTW2/database",
	"robotTW2/conf",
	"robotTW2/services"
	], function(
			database,
			conf,
			services
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
			setTimeCicle		: setTimeCicle
	}

	Object.setPrototypeOf(data_alert, fn);

	return data_alert;
})
,
define("robotTW2/data_farm", [
	"robotTW2/database",
	"robotTW2/conf",
	"robotTW2/services",
	"helper/time"
	], function(
			database,
			conf,
			services,
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

	var data_farm = database.get("data_farm");
	var dataNew = {
			INIT_ATIVATE			: false,
			ATIVATE 				: false,
			PAUSED	 				: false,
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
			setFarm				: setFarm
	}

	Object.setPrototypeOf(data_farm, fn);

	return data_farm;
})
,
define("robotTW2/data_villages", [
	"robotTW2/database",
	"robotTW2/conf",
	"robotTW2/services",
	"robotTW2/providers"
	], function(
			database,
			conf,
			services,
			providers
	) {
	var villages = {}
	, villagesExtended = {}



	/*
	Deverá ser implementado verificação de aldeias perdidas ou conquistadas. Manter dados das aldeias existentes
	*/

	angular.extend(villages, services.modelDataService.getVillages())
	angular.merge(villagesExtended, villages)

	Object.values(villagesExtended).forEach(function(village){
		angular.merge(village, {
			EXECUTEBUILDINGORDER 	: conf.EXECUTEBUILDINGORDER,
			BUILDINGORDER 			: conf.BUILDINGORDER,
			BUILDINGLIMIT 			: conf.BUILDINGLIMIT,
			BUILDINGLEVELS 			: conf.BUILDINGLEVELS
		})
	})

	var setVillages = function(villages){
		var data_villages = database.get("data_villages")
		data_villages.VILLAGES = villages;
		database.set("data_villages", data_villages, true)
	}

	var getVillages = function(){
		var data_villages = database.get("data_villages")
		var villages = data_villages.VILLAGES
		return villages
	}

	var data_vills = {
			VILLAGES 		: villagesExtended ,
			VERSION 		: conf.VERSION.VILLAGES
	}

	var data_villages = database.get("data_villages")
	if(!data_villages) {
		data_villages = data_vills
		database.set("data_villages", data_villages, true)
	} else {
		if(!data_villages.VERSION || data_villages.VERSION < conf.VERSION.VILLAGES){
			data_villages = data_vills
			database.set("data_villages", data_villages, true)
		} else {
			var muded = false;
			for (v in data_vills.VILLAGES) {
				if(!villagesExtended[v]){
					delete data_vills.VILLAGES[v]
					muded = true;
				}
			}
			if(muded){
				database.set("data_villages", data_villages, true)
			}
		}
	}

	var fn = {
			setVillages 	: setVillages,
			getVillages 	: getVillages
	}

	var lostVillage = function($event, data){
		var villages = getVillages();
		var vills = Object.keys(villages).map(function(key, index, array){
			if (villages[key].data.villageId != data.villageId) {
				return {[key]:villages[key]}
			} else {
				return
			}
		}).filter(f => f != undefined);
		var vill = {};
		vills.forEach(function(e){
			vill[Object.keys(e)[0]] = Object.values(e)[0]

		})
		setVillages(vill)
	}

	var conqueredVillage = function($event, data){
		var villages = getVillages();
		angular.extend(villages, data.village)
		setVillages(villages)
	}

	Object.setPrototypeOf(data_villages, fn);

	$rootScope.$on(providers.eventTypeProvider.VILLAGE_LOST, lostVillage);
	$rootScope.$on(providers.eventTypeProvider.VILLAGE_CONQUERED, conqueredVillage);

	return data_villages;
})
