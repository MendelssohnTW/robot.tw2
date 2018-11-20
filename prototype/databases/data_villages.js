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

	var getPst = function (v) {


		var presets_d = services.presetListService.getPresetsForVillageId(v)

		if(!Object.keys(presets_d).length) {return}

		if(!data_villages.villages[v]){data_villages.villages[v] = {"presets" : {}}}

		Object.keys(presets_d).forEach(function (pst) {
//			presets_d[pst.id] = angular.copy(pst);
//			angular.extend(presets_d[pst.id], {					
//			max_journey_distance	: conf.MAX_JOURNEY_DISTANCE,
//			min_journey_distance	: conf.MIN_JOURNEY_DISTANCE,
//			max_journey_time		: conf.MAX_JOURNEY_TIME,
//			min_journey_time		: conf.MIN_JOURNEY_TIME,
//			max_points_farm			: conf.MAX_POINTS_FARM,
//			min_points_farm			: conf.MIN_POINTS_FARM,
//			quadrants				: [1, 2, 3, 4]
//			});
			if(!data_villages.villages[v].presets[pst] || data_villages.villages[v].presets[pst].load){
				angular.extend(presets_d[pst], {
					load					: true,
					max_journey_distance	: conf.MAX_JOURNEY_DISTANCE,
					min_journey_distance	: conf.MIN_JOURNEY_DISTANCE,
					max_journey_time		: conf.MAX_JOURNEY_TIME,
					min_journey_time		: conf.MIN_JOURNEY_TIME,
					max_points_farm			: conf.MAX_POINTS_FARM,
					min_points_farm			: conf.MIN_POINTS_FARM,
					quadrants				: [1, 2, 3, 4]
				});
			}

			Object.keys(data_villages.villages[v].presets).map(function (id) {
				if(!Object.keys(presets_d).find(f => f == id)) {
					delete data_villages.villages[v].presets[id]
				} else {
					angular.merge(data_villages.villages[v].presets[id], presets_d[pst])
				}
			})

			if(!Object.keys(data_villages.villages[v].presets).find(f => f == pst)) {
				data_villages.villages[v].presets[pst] = angular.extend({}, presets_d[pst])
			} else {
				angular.merge(data_villages.villages[v].presets[pst], presets_d[pst])
			}


		});


		return data_villages.villages[v].presets;

	}
	, data_villages = database.get("data_villages") || {}
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

		if(services.modelDataService.getPresetList().isLoadedValue){
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
						presets					: getPst(v)
					})
					data_villages.villages[v] = angular.extend({}, villagesExtended[v])
					updated = true;
				}
			})
			return updated
		} else {
			services.socketService.emit(providers.routeProvider.GET_PRESETS, {});
			return services.$timeout(function(){
				return db_villages.verifyVillages(villagesExtended)
			}, 5000)
		}
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
