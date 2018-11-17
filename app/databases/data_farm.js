define("robotTW2/databases/data_farm", [
	"robotTW2",
	"robotTW2/databases/database",
	"robotTW2/conf",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/notify",
	"helper/time"
	], function(
			robotTW2,
			database,
			conf,
			services,
			providers,
			notify,
			helper
	) {

	var data_farm = database.get("data_farm")
	, db_farm = {};

	db_farm.set = function(){
		database.set("data_farm", data_farm, true)
	}
	db_farm.get = function(){
		return database.get("data_farm");
	}
	var getPst = function () {
		var presets_d = {}
		services.socketService.emit(providers.routeProvider.GET_PRESETS, {}, function (data_result) {
			if(!data_result) {return}
			data_result.presets.forEach(function (p) {
				presets_d[p.id] = angular.copy(p);
			});

			if(Object.keys(data_farm.presets).length == 0) {
				data_farm.presets = presets_d
			} else {
				Object.keys(data_farm.presets).map(function (id) {
					if(!Object.keys(presets_d).find(f => f == id)) {
						delete data_farm.presets[id]
					} else {
						data_farm.presets[id] = angular.extend({}, presets_d[id])
					}
				})

				Object.keys(presets_d).map(function (id) {
					if(!Object.keys(data_farm.presets).find(f => f == id)) {
						data_farm.presets[id] = angular.extend({}, presets_d[id])
						
					}
				})

			}
		})

	}
	, dataNew = {
			auto_initialize				: false, 
			initialized				: false, 
			activated				: false,
			hotkey					: conf.HOTKEY.FARM,
			version					: conf.VERSION.FARM,
			farm_time				: conf.FARM_TIME,
			max_journey_time			: conf.MAX_JOURNEY_TIME,
			min_journey_time			: conf.MIN_JOURNEY_TIME,
			farm_time_start				: helper.gameTime(),
			farm_time_stop				: new Date((services.$filter("date")(new Date(helper.gameTime() + 86400000), "yyyy-MM-dd")) + " 06:00:00").getTime(),
			time_delay_farm				: conf.TIME_DELAY_FARM,
			list_exceptions				: [],
			presets					: [],
			commands				: {},
			name					: "data_farm"
	}

	if(!data_farm){
		data_farm = dataNew
		database.set("data_farm", data_farm, true)
	} else {
		if(!data_farm.version || data_farm.version < conf.VERSION.FARM){
			data_farm = dataNew
			database.set("data_farm", data_farm, true)
			notify("data_farm");
		} else {
			if(!data_farm.auto_initialize) data_farm.initialized = !1;
			if(data_farm.auto_initialize) data_farm.initialized = !0;
			database.set("data_farm", data_farm, true)		
		}
	}
	
	getPst()
	
	services.$rootScope.$on(providers.eventTypeProvider.ARMY_PRESET_DELETED, getPst)
	services.$rootScope.$on(providers.eventTypeProvider.ARMY_PRESET_ASSIGNED, getPst)
	services.$rootScope.$on(providers.eventTypeProvider.ARMY_PRESET_SAVED, getPst)

	Object.setPrototypeOf(data_farm, db_farm);

	services.$rootScope.data_farm = data_farm;

	services.$rootScope.$watch("data_farm", function(){
		data_farm.set()
	}, true)

	return data_farm;
})
