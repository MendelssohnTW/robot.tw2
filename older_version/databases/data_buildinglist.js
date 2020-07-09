define("robotTW2/databases/data_buildinglist", [
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
	var data_buildinglist = database.get("data_buildinglist")
	, db_buildinglist = {}
	, update_villages = function(){
		services.$timeout(function(){
			db_buildinglist.updateVillages()
		}, 13000)
	}

	db_buildinglist.set = function(){
		database.set("data_buildinglist", data_buildinglist, true)
	}

	db_buildinglist.get = function(){
		return database.get("data_buildinglist")
	}
	
	db_buildinglist.verifyDB = function (villagesExtended){
		updated = false;
		if(!data_buildinglist){data_buildinglist = {}}
		if(!villagesExtended){villagesExtended = {}}
		if(data_buildinglist.villages == undefined){data_buildinglist.villages = {}}
		Object.keys(data_buildinglist.villages).map(function(m){
			return m
		}).forEach(function(v){
			if(!villagesExtended[v]){
				delete data_buildinglist.villages[v]
				updated = true;
			}
		})
		return updated;
	}
	
	db_buildinglist.verifyVillages = function (villagesExtended, callback){
		if(!data_buildinglist){data_buildinglist = {}}
		if(!villagesExtended){villagesExtended = {}}
		let update = false;
		if(!data_buildinglist.villages || data_buildinglist.villages == undefined){data_buildinglist.villages = {}}
		Object.keys(villagesExtended).map(function(m){
			if(!data_buildinglist.villages[m]){
				angular.extend(villagesExtended[m], {
					buildinglist 			: conf.BUILDINGLIST
				})
				data_buildinglist.villages[m] = angular.extend({}, villagesExtended[m])
				update = true;
				return m;
			} else {
				return m
			}
		})
		callback(update)
		return;
	}

	db_buildinglist.updateVillages = function($event){
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
			db_buildinglist.verifyVillages(villagesExtended, function(updated){
				updated ? res() : rej()
			})
		})
		.then(function(){
			if(db_buildinglist.verifyDB(villagesExtended)) {
				data_buildinglist.version = conf.VERSION.BUILDINGLIST
			}
			db_buildinglist.set();
		}, function(){
			if(!data_buildinglist || !data_buildinglist.version || (typeof(data_buildinglist.version) == "number" ? data_buildinglist.version.toString() : data_buildinglist.version) < conf.VERSION.BUILDINGLIST){
				data_buildinglist = {};
				data_buildinglist.version = conf.VERSION.BUILDINGLIST
				db_buildinglist.set();
				db_buildinglist.updateVillages();
			}
		})
	}
	
	services.$rootScope.$on(providers.eventTypeProvider.VILLAGE_LOST, update_villages);
	services.$rootScope.$on(providers.eventTypeProvider.VILLAGE_CONQUERED, update_villages);

	if(!data_buildinglist || !data_buildinglist.version || (typeof(data_buildinglist.version) == "number" ? data_buildinglist.version.toString() : data_buildinglist.version) < conf.VERSION.BUILDINGLIST){
		data_buildinglist = {};
		data_buildinglist.version = conf.VERSION.BUILDINGLIST
		db_buildinglist.updateVillages();
	} else {
		db_buildinglist.updateVillages()	
	}

	Object.setPrototypeOf(data_buildinglist, db_buildinglist);

	return data_buildinglist;
})