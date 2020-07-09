define("robotTW2/databases/data_buildingorder", [
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
	var data_buildingorder = database.get("data_buildingorder")
	, db_buildingorder = {}
	, update_villages = function(){
		services.$timeout(function(){
			db_buildingorder.updateVillages()
		}, 7000)
	}

	db_buildingorder.set = function(){
		database.set("data_buildingorder", data_buildingorder, true)
	}

	db_buildingorder.get = function(){
		return database.get("data_buildingorder")
	}
	
	db_buildingorder.verifyDB = function (villagesExtended){
		updated = false;
		if(!data_buildingorder){data_buildingorder = {}}
		if(!villagesExtended){villagesExtended = {}}
		if(data_buildingorder.villages == undefined){data_buildingorder.villages = {}}
		Object.keys(data_buildingorder.villages).map(function(m){
			return m
		}).forEach(function(v){
			if(!villagesExtended[v]){
				delete data_buildingorder.villages[v]
				updated = true;
			}
		})
		return updated;
	}
	
	db_buildingorder.verifyVillages = function (villagesExtended, callback){
		if(!data_buildingorder){data_buildingorder = {}}
		if(!villagesExtended){villagesExtended = {}}
		let update = false;
		if(!data_buildingorder.villages || data_buildingorder.villages == undefined){data_buildingorder.villages = {}}
		Object.keys(villagesExtended).map(function(m){
			if(!data_buildingorder.villages[m]){
				angular.extend(villagesExtended[m], {
					buildingorder 			: conf.BUILDINGORDER
				})
				data_buildingorder.villages[m] = angular.extend({}, villagesExtended[m])
				update = true;
				return m;
			} else {
				return m
			}
		})
		callback(update)
		return;
	}

	db_buildingorder.updateVillages = function($event){
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
			db_buildingorder.verifyVillages(villagesExtended, function(updated){
				updated ? res() : rej()
			})
		})
		.then(function(){
			if(db_buildingorder.verifyDB(villagesExtended)) {
				data_buildingorder.version = conf.VERSION.BUILDINGORDER
			}
			db_buildingorder.set();
		}, function(){
			if(!data_buildingorder || !data_buildingorder.version || (typeof(data_buildingorder.version) == "number" ? data_buildingorder.version.toString() : data_buildingorder.version) < conf.VERSION.BUILDINGORDER){
				data_buildingorder = {};
				data_buildingorder.version = conf.VERSION.BUILDINGORDER
				db_buildingorder.set();
				db_buildingorder.updateVillages();
			}
		})
	}
	
	services.$rootScope.$on(providers.eventTypeProvider.VILLAGE_LOST, update_villages);
	services.$rootScope.$on(providers.eventTypeProvider.VILLAGE_CONQUERED, update_villages);

	if(!data_buildingorder || !data_buildingorder.version || (typeof(data_buildingorder.version) == "number" ? data_buildingorder.version.toString() : data_buildingorder.version) < conf.VERSION.BUILDINGORDER){
		data_buildingorder = {};
		data_buildingorder.version = conf.VERSION.BUILDINGORDER
		db_buildingorder.updateVillages();
	} else {
		db_buildingorder.updateVillages()	
	}

	Object.setPrototypeOf(data_buildingorder, db_buildingorder);

	return data_buildingorder;
})