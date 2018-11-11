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
	var getT = function () {
		return {
			journey_time			: data_farm.journey_time,
			journey_distance		: data_farm.journey_distance,
			min_journey_distance	: data_farm.min_journey_distance,
			max_points_farm			: data_farm.max_points_farm,
			min_points_farm			: data_farm.min_points_farm,
			max_commands_farm		: data_farm.max_commands_farm,
			farm_time				: data_farm.farm_time,
			quadrants				: [1, 2, 3, 4]
		};
	}
	, getPst = function () {
		var presets_d = {}
		services.socketService.emit(providers.routeProvider.GET_PRESETS, {}, function (data_result) {
			if(!data_result) {return}
			data_result.presets.forEach(function (p) {
				presets_d[p.id] = angular.copy(p);
				angular.extend(presets_d[p.id], getT())
			});

			if(Object.keys(data_farm.presets).length == 0) {
				angular.merge(data_farm.presets, presets_d)
			} else {
				Object.keys(data_farm.presets).map(function (id) {
					if(!Object.keys(presets_d).find(f => f == id)) {
						delete data_farm.presets[i]
					} else {
						data_farm.presets[i] = angular.extend({}, presets_d[i])
					}
				})

				Object.keys(presets_d).map(function (id) {
					if(!Object.keys(data_farm.presets).find(f => f == id)) {
						data_farm.presets[i] = angular.extend({}, presets_d[i])
						data_farm.presets[i] = angular.extend({}, getT())
					}
				})

			}
		})

	}
	, dataNew = {
			auto_initialize			: false, 
			initialized				: false, 
			activated				: false,
			hotkey					: conf.HOTKEY.FARM,
			version					: conf.VERSION.FARM,
			farm_time				: conf.FARM_TIME,
			farm_time_start			: helper.gameTime(),
			farm_time_stop			: new Date((services.$filter("date")(new Date(helper.gameTime() + 86400000), "yyyy-MM-dd")) + " 06:00:00").getTime(),
			journey_distance		: 15,
			min_journey_distance	: 7,
			journey_time			: conf.JOURNEY_TIME,
			max_points_farm			: conf.MAX_POINTS,
			min_points_farm			: conf.MIN_POINTS,
			max_commands_farm		: conf.MAX_COMMANDS,
			list_exceptions			: [],
			presets					: {},
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
