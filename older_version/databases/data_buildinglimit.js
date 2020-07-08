define("robotTW2/databases/data_buildinglimit", [
	"robotTW2/databases/database",
	"robotTW2/conf",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/notify"
	], function(
			database,
			conf,
			services,
			providers,
			notify
	) {
	var data_buildinglimit = database.get("data_buildinglimit")
	, db_buildinglimit = {}
	, update_villages = function(){
		services.$timeout(function(){
			db_buildinglimit.updateVillages()
		}, 9000)
	}

	db_buildinglimit.set = function(){
		database.set("data_buildinglimit", data_buildinglimit, true)
	}

	db_buildinglimit.get = function(){
		return database.get("data_buildinglimit")
	}
	
	db_buildinglimit.verifyDB = function (villagesExtended){
		updated = false;
		if(!data_buildinglimit){data_buildinglimit = {}}
		if(!villagesExtended){villagesExtended = {}}
		if(data_buildinglimit.villages == undefined){data_buildinglimit.villages = {}}
		Object.keys(data_buildinglimit.villages).map(function(m){
			return m
		}).forEach(function(v){
			if(!villagesExtended[v]){
				delete data_buildinglimit.villages[v]
				updated = true;
			}
		})
		return updated;
	}
	
	db_buildinglimit.verifyVillages = function (villagesExtended, callback){
		if(!data_buildinglimit){data_buildinglimit = {}}
		if(!villagesExtended){villagesExtended = {}}
		let update = false;
		if(!data_buildinglimit.villages || data_buildinglimit.villages == undefined){data_buildinglimit.villages = {}}
		Object.keys(villagesExtended).map(function(m){
			if(!data_buildinglimit.villages[m]){
				angular.extend(villagesExtended[m], {
					buildinglimit 			: conf.BUILDINGLIMIT
				})
				data_buildinglimit.villages[m] = angular.extend({}, villagesExtended[m])
				update = true;
				return m;
			} else {
				return m
			}
		})
		callback(update)
		return;
	}

	db_buildinglimit.updateVillages = function($event){
		var updated = false;
		var villages = services.modelDataService.getVillages();
		var villagesExtended = {};
		try{
			Object.keys(villages).map(function(village_id){
				villagesExtended[village_id] = {}
				var vill = services.villageService.getInitializedVillage(village_id)
			})
		} catch (err){
			return
		}

		var promise = new Promise(function(res, rej){
			db_buildinglimit.verifyVillages(villagesExtended, function(updated){
				updated ? res() : rej()
			})
		})
		.then(function(){
			if(db_buildinglimit.verifyDB(villagesExtended)) {
				data_buildinglimit.version = conf.VERSION.BUILDINGLIMIT
			}
			db_buildinglimit.set();
		}, function(){
			if(!data_buildinglimit || !data_buildinglimit.version || (typeof(data_buildinglimit.version) == "number" ? data_buildinglimit.version.toString() : data_buildinglimit.version) < conf.VERSION.BUILDINGLIMIT){
				data_buildinglimit = {};
				data_buildinglimit.version = conf.VERSION.BUILDINGLIMIT
				db_buildinglimit.set();
				db_buildinglimit.updateVillages();
			}
		})
	}
	
	services.$rootScope.$on(providers.eventTypeProvider.VILLAGE_LOST, update_villages);
	services.$rootScope.$on(providers.eventTypeProvider.VILLAGE_CONQUERED, update_villages);

	if(!data_buildinglimit || !data_buildinglimit.version || (typeof(data_buildinglimit.version) == "number" ? data_buildinglimit.version.toString() : data_buildinglimit.version) < conf.VERSION.BUILDINGLIMIT){
		data_buildinglimit = {};
		data_buildinglimit.version = conf.VERSION.BUILDINGLIMIT
		db_buildinglimit.updateVillages();
	} else {
		db_buildinglimit.updateVillages()	
	}

	Object.setPrototypeOf(data_buildinglimit, db_buildinglimit);

	return data_buildinglimit;
})