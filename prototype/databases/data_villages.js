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
		updated = false;
		if(!data_villages){data_villages = {}}
		if(!villagesExtended){villagesExtended = {}}
		if(data_villages.villages == undefined){data_villages.villages = {}}
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
		if(!data_villages){data_villages = {}}
		if(!villagesExtended){villagesExtended = {}}
		if(data_villages.villages == undefined){data_villages.villages = {}}
		Object.keys(villagesExtended).map(function(m){
			return m
		}).forEach(function(v){
			if(!Object.keys(data_villages.villages).map(function(m){
				return m
			}).find(f=>f==v)){
				angular.extend(villagesExtended[v], {
					executebuildingorder 	: conf.EXECUTEBUILDINGORDER,
					buildingorder 			: conf.BUILDINGORDER,
					buildinglimit 			: conf.BUILDINGLIMIT,
					buildinglevels 			: conf.BUILDINGLEVELS,
					farm_activate 			: true,
					assigned_presets		: [],
					presets					: [],
					quadrants				: [1, 2, 3, 4]
				})
				data_villages.villages[v] = angular.extend({}, villagesExtended[v])
				updated = true;
			}
		})
		return updated
	}

	db_villages.updateVillages = function($event){
		var villagesDB = {}
		, villagesExtended = {}
		, updated = false;

		angular.extend(villagesDB, services.modelDataService.getVillages())
		angular.merge(villagesExtended, villagesDB)

		if(db_villages.verifyDB(villagesExtended) || db_villages.verifyVillages(villagesExtended)) {
			data_villages.version = conf.VERSION.VILLAGES
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
	}
	
	db_villages.getAssignedPresets = function(){
		Object.keys(data_villages.villages).map(function(a){
			var presetsByVillage = services.modelDataService.getPresetList().presetsByVillage;
			data_villages.villages[a].assigned_presets = presetsByVillage[a] ? Object.keys(presetsByVillage[a]) : [];
		})	
	}

	services.$rootScope.$on(providers.eventTypeProvider.VILLAGE_LOST, db_villages.updateVillages);
	services.$rootScope.$on(providers.eventTypeProvider.VILLAGE_CONQUERED, db_villages.updateVillages);
	services.$rootScope.$on(providers.eventTypeProvider.VILLAGE_NAME_CHANGED, db_villages.renameVillage);

	db_villages.updateVillages()

	

	Object.setPrototypeOf(data_villages, db_villages);

	services.$rootScope.data_villages = data_villages;

	services.$rootScope.$watch("data_villages", function(){
		data_villages.set()
	}, true)
	return data_villages;
})
