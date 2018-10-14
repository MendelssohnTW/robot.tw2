define("robotTW2/databases/data_villages", [
	"robotTW2/databases",
	"robotTW2/conf",
	"robotTW2/services"
//	"robotTW2/notify"
	], function(
			database,
			conf,
			services
//			notify
	){

	var data_villages = database.get("data_villages") || {}
	, service = {}
	service.verifyDB = function (villagesExtended){
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
	service.verifyVillages = function (villagesExtended){
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
				updated = true;
			}
		})
		if(updated){service.setVillages(data_villages.villages)}
		return updated
	}
	service.getVillageActivate = function(vs){
		return database.get("data_villages").villages[vs].farm_activate
	}
	service.setVillageActivate = function(vs, opt){
		data_villages.vs = opt;
		service.save()
	}
	service.setVillages = function(vs){
		data_villages.villages = vs;
		service.save()
	}
	service.getVillages = function(){
		return database.get("data_villages").villages
	}
	service.save = function(){
		database.set("data_villages", data_villages, true)
	}
	service.updateVillages = function($event){
		var villagesDB = {}
		, villagesExtended = {}
		, updated = false;

		angular.extend(villagesDB, services.modelDataService.getVillages())
		angular.merge(villagesExtended, villagesDB)

		if(!data_villages.villages || service.verifyDB(villagesExtended) || service.verifyVillages(villagesExtended)) {
			if (data_villages == undefined || data_villages.villages == undefined){
				data_villages = {}
				, vb = {}
				, ve = {}
				angular.extend(vb, services.modelDataService.getVillages())
				angular.merge(ve, vb)
				data_villages.version = conf.VERSION.villages
				data_villages.villages = {}
				service.verifyVillages(villagesExtended, ve)
			}

		} else {
			if(!data_villages.version || data_villages.version < conf.VERSION.VILLAGES){
				data_villages.version = conf.VERSION.villages
			}
		} 
		service.save();
	}
	service.renameVillage = function($event, data){
		var id = data.village_id;
		!data_villages.villages[id] ? !1 : data_villages.villages[id].data.name = data.name
				service.setVillages(data_villages.villages)
	}


	$rootScope.$on(providers.eventTypeProvider.VILLAGE_LOST, service.updateVillages);
	$rootScope.$on(providers.eventTypeProvider.VILLAGE_CONQUERED, service.updateVillages);
	$rootScope.$on(providers.eventTypeProvider.VILLAGE_NAME_CHANGED, service.renameVillage);

	service.updateVillages()

	Object.setPrototypeOf(data_villages, service);
	return data_villages;
})
