define("robotTW2/databases/data_villages", [
	"robotTW2/databases/database",
	"robotTW2/conf",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/calculateTravelTime",
	], function(
			database,
			conf,
			services,
			providers,
			calculateTravelTime
	){
	var rallyPointSpeedBonusVsBarbarians = services.modelDataService.getWorldConfig().getRallyPointSpeedBonusVsBarbarians()
	, get_dist = function (v, max_journey_time, units) {
		var village = services.modelDataService.getVillage(v)
		, army = {
				'officers'	: {},
				"units"		: units
			}
		, travelTime = calculateTravelTime(army, village, "attack", {
			'barbarian'		: true
		})
		
		return Math.trunc((max_journey_time / 1000 / travelTime) / 2);
	}
	, getPst = function (v) {
		var presets_d = services.presetListService.getPresetsForVillageId(v)
		if(!Object.keys(presets_d).length) {return {}}
		if(!data_villages.villages[v]){data_villages.villages[v] = {"presets" : {}}}
		Object.keys(presets_d).forEach(function (pst) {
			if(!data_villages.villages[v].presets){data_villages.villages[v].presets = {}}
			Object.keys(data_villages.villages[v].presets).map(function (id) {
				if(!Object.keys(presets_d).find(f => f == id)) {
					delete data_villages.villages[v].presets[id]
				}
			})
			if(!Object.keys(data_villages.villages[v].presets).find(f => f == pst)) {
				if(!data_villages.villages[v].presets[pst]){
					angular.extend(presets_d[pst], {
						load					: true,
						max_journey_distance	: get_dist(v, conf.MAX_JOURNEY_TIME, presets_d[pst].units),
						min_journey_distance	: get_dist(v, conf.MIN_JOURNEY_TIME, presets_d[pst].units),
						max_journey_time		: conf.MAX_JOURNEY_TIME,
						min_journey_time		: conf.MIN_JOURNEY_TIME,
						max_points_farm			: conf.MAX_POINTS_FARM,
						min_points_farm			: conf.MIN_POINTS_FARM,
						quadrants				: [1, 2, 3, 4],
						max_commands_farm		: conf.MAX_COMMANDS_FARM
					});
				} 
			} else {
				if(!data_villages.villages[v].presets[pst].load){
					angular.extend(presets_d[pst], {
						load					: true,
						max_journey_distance	: get_dist(v, conf.MAX_JOURNEY_TIME, presets_d[pst].units),
						min_journey_distance	: get_dist(v, conf.MIN_JOURNEY_TIME, presets_d[pst].units),
						max_journey_time		: conf.MAX_JOURNEY_TIME,
						min_journey_time		: conf.MIN_JOURNEY_TIME,
						max_points_farm			: conf.MAX_POINTS_FARM,
						min_points_farm			: conf.MIN_POINTS_FARM,
						quadrants				: [1, 2, 3, 4],
						max_commands_farm		: conf.MAX_COMMANDS_FARM
					});
				}
			}
//			data_villages.villages[v].presets[pst] = angular.extend({}, presets_d[pst])
			if(!data_villages.villages[v].presets[pst]){
				data_villages.villages[v].presets[pst] = presets_d[pst]
			} else {
				angular.extend(data_villages.villages[v].presets[pst], presets_d[pst])
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
	db_villages.verifyVillages = function (villagesExtended, callback){

		if(services.modelDataService.getPresetList().isLoadedValue){
			if(!data_villages){data_villages = {}}
			if(!villagesExtended){villagesExtended = {}}
			if(data_villages.villages == undefined){data_villages.villages = {}}
			Object.keys(villagesExtended).map(function(m){
				if(!Object.keys(data_villages.villages).map(function(v){
					return v
				}).find(f=>f==m)){
					angular.extend(villagesExtended[m], {
						executebuildingorder 	: conf.EXECUTEBUILDINGORDER,
						buildingorder 			: conf.BUILDINGORDER,
						buildinglimit 			: conf.BUILDINGLIMIT,
						buildinglevels 			: conf.BUILDINGLEVELS,
						farm_activate 			: true,
						presets					: getPst(m),
						selected				: undefined
					})
					data_villages.villages[m] = angular.extend({}, villagesExtended[m])
					callback(true)
					return m;
				} else {
					if(!data_villages.villages[m].buildingorder){
						angular.extend(villagesExtended[m], {
							executebuildingorder 	: conf.EXECUTEBUILDINGORDER,
							buildingorder 			: conf.BUILDINGORDER,
							buildinglimit 			: conf.BUILDINGLIMIT,
							buildinglevels 			: conf.BUILDINGLEVELS,
							farm_activate 			: true,
							presets					: getPst(m),
							selected				: undefined
						})
						data_villages.villages[m] = angular.extend({}, villagesExtended[m])
					} else {
						angular.merge(villagesExtended[m], {
//							farm_activate 			: true,
							presets					: getPst(m)
						})
						angular.extend(data_villages.villages[m], villagesExtended[m])
					}
					callback(true)
					return m;
				}
			})
			callback(false)
			return;
		} else {
			services.socketService.emit(providers.routeProvider.GET_PRESETS, {}, function(){return db_villages.verifyVillages(villagesExtended, callback)});
//			return services.$timeout(function(){
//			return db_villages.verifyVillages(villagesExtended, callback)
//			}, 5000)
		}
	}

	db_villages.updateVillages = function($event){
		var updated = false;
		var villagesExtended = angular.merge({}, services.modelDataService.getVillages())
		var promise = new Promise(function(res, rej){
			db_villages.verifyVillages(villagesExtended, function(updated){
				updated ? res() : rej()
			})
		})
		.then(function(){
			if(db_villages.verifyDB(villagesExtended)) {
				data_villages.version = conf.VERSION.VILLAGES
			} else {
				if(!data_villages.version || (typeof(data_villages.version) == "number" ? data_villages.version.toString() : data_villages.version) < conf.VERSION.VILLAGES){
					data_villages.version = conf.VERSION.VILLAGES
				}
			} 
			database.set("data_villages", data_villages, true)	
		}, function(){
			database.set("data_villages", data_villages, true)
		})
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
	services.$rootScope.$on(providers.eventTypeProvider.ARMY_PRESET_DELETED, db_villages.updateVillages);
	services.$rootScope.$on(providers.eventTypeProvider.ARMY_PRESET_ASSIGNED, db_villages.updateVillages);
	services.$rootScope.$on(providers.eventTypeProvider.ARMY_PRESET_SAVED, db_villages.updateVillages);

	db_villages.updateVillages()

	Object.setPrototypeOf(data_villages, db_villages);

	services.$rootScope.data_villages = data_villages;

	services.$rootScope.$watch("data_villages", function(){
		data_villages.set()
	}, true)
	return data_villages;
})
