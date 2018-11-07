define("robotTW2/databases/data_villages", [
	"robotTW2/databases/database",
	"robotTW2/conf",
	"robotTW2/services",
	"robotTW2/providers"
	], function(
			database,
			conf,
			services,
			providers
	){

	var data_villages = database.get("data_villages") || {}
	, db_villages = {}

	db_villages.set = function(){
		database.set("data_villages", data_villages, true)
	}
	db_villages.get = function(){
		return database.get("data_villages")
	}
	db_villages.verifyDB = function (villagesExtended){
		if (data_villages == undefined || data_villages.villages == undefined){
			return false;
		}
		updated = false;
		Object.keys(data_villages.villages).map(function(m){
			return m
		}).forEach(function(v){
			if(!Object.keys(villagesExtended).map(function(m){
				return m
			}).find(f=>f==v)){
				delete data_villages.villages[v]
				updated = true;
			}
		})
		return updated;
	}
	db_villages.verifyVillages = function (villagesExtended){
		updated = false;
		if (data_villages == undefined || data_villages.villages == undefined){
			return false;
		}
		Object.keys(villagesExtended).map(function(m){
			return m
		}).forEach(function(v){
			if(!Object.keys(data_villages.villages).map(function(m){
				return m
			}).find(f=>f==v)){
				angular.merge(villagesExtended[v], {
					executebuildingorder 	: conf.EXECUTEBUILDINGORDER,
					buildingorder 			: conf.BUILDINGORDER,
					buildinglimit 			: conf.BUILDINGLIMIT,
					buildinglevels 			: conf.BUILDINGLEVELS,
					farm_activate 			: true
				})
				data_villages.villages[v] = villagesExtended[v]
//				updated = true;
			}
		})
//		if(updated){db_villages.setVillages(data_villages.villages)}
		return updated
	}
//	db_villages.getVillageActivate = function(vs){
//	return database.get("data_villages").villages[vs].farm_activate
//	}
//	db_villages.setVillageActivate = function(vs, opt){
//	data_villages.vs = opt;
//	db_villages.save()
//	}
//	db_villages.setVillages = function(vs){
//	data_villages.villages = vs;
//	db_villages.save()
//	}
//	db_villages.getVillages = function(){
//	return database.get("data_villages").villages
//	}
//	db_villages.save = function(){
//	database.set("data_villages", data_villages, true)
//	}
	db_villages.updateVillages = function($event){
		var villagesDB = {}
		, villagesExtended = {}
		, updated = false;

		angular.extend(villagesDB, services.modelDataService.getVillages())
		angular.merge(villagesExtended, villagesDB)

		if(!data_villages.villages || db_villages.verifyDB(villagesExtended) || db_villages.verifyVillages(villagesExtended)) {
			if (data_villages == undefined || data_villages.villages == undefined){
				data_villages = {}
				, vb = {}
				, ve = {}
				angular.extend(vb, services.modelDataService.getVillages())
				angular.merge(ve, vb)
				data_villages.version = conf.VERSION.VILLAGES
				data_villages.villages = {}
				db_villages.verifyVillages(villagesExtended, ve)
			}

		} else {
			if(!data_villages.version || data_villages.version < conf.VERSION.VILLAGES){
				data_villages.version = conf.VERSION.VILLAGES
			}
		} 
		database.set("data_villages", data_villages, true)
	}
	db_villages.renameVillage = function($event, data){
		var id = data.village_id;
		!data_villages.villages[id] ? !1 : data_villages.villages[id].data.name = data.name
//				db_villages.setVillages(data_villages.villages)
	}

	services.$rootScope.$on(providers.eventTypeProvider.VILLAGE_LOST, db_villages.updateVillages);
	services.$rootScope.$on(providers.eventTypeProvider.VILLAGE_CONQUERED, db_villages.updateVillages);
	services.$rootScope.$on(providers.eventTypeProvider.VILLAGE_NAME_CHANGED, db_villages.renameVillage);

	db_villages.updateVillages()

	Object.setPrototypeOf(data_villages, db_villages);

	services.$rootScope.data_villages = data_villages;

	services.$rootScope.$watchCollection("data_villages", function(){
		data_villages.set()
	})
	return data_villages;
})
