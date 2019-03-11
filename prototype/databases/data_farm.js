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

	var presets_load = angular.copy(services.presetListService.getPresets())
	var presets_created = [];

	var create_preset = function create_preset(preset, pri_vill){

		let units = {};
		let officers = {};
		services.modelDataService.getGameData().getOrderedUnitNames().forEach(function(unitName) {
			units[unitName] = 0;
		});

		services.modelDataService.getGameData().getOrderedOfficerNames().forEach(function(officerName) {
			officers[officerName] = false;
		});

		let qtd = Object.values(preset)[0];
		let unit = Object.keys(preset)[0];
		units[unit] = qtd;
		let trad_unit = services.$filter("i18n")(unit, services.$rootScope.loc.ale, "units");

		var ll = Object.values(presets_load).map(function(elem){
			return elem.name == "Farm " + qtd.toString() + " " + trad_unit
		}).filter(f=>f!=false)

		if(!ll || !ll.length){
			let d_preset = {
					"catapult_target": null,
					"icon": parseInt("0c0b0c", 16),
					"name": "Farm " + qtd.toString() + " " + trad_unit,
					"officers": officers,
					"units": units,
					"village_id": pri_vill
			}

			presets_created.push(d_preset.name);

			services.socketService.emit(providers.routeProvider.SAVE_NEW_PRESET, d_preset);
		}
	}

	var dataNew = {
			auto_start				: false, 
			init_initialized		: false, 
			activated				: false,
			hotkey					: conf.HOTKEY.FARM,
			version					: conf.VERSION.FARM,
			farm_time				: conf.FARM_TIME,
			farm_time_start			: helper.gameTime(),
			farm_time_stop			: new Date((services.$filter("date")(new Date(helper.gameTime() + 86400000), "yyyy-MM-dd")) + " 06:00:00").getTime(),
			time_delay_farm			: conf.TIME_DELAY_FARM,
			list_exceptions			: [],
			commands				: {},
			troops_not				: conf.TROOPS_NOT.FARM,
			name					: "data_farm",
			infinite				: true
	}

	if(!data_farm){
		data_farm = dataNew

		let list_presets = [
			{"spear": 5},
			{"sword": 5},
			{"archer": 5},
			{"axe": 5},
			{"light_cavalry": 5},
			{"mounted_archer": 5},
			{"heavy_cavalry": 5}
			]

		let villages = Object.keys(services.modelDataService.getSelectedCharacter().getVillages())
		let pri_vill = villages[0]

		for (var preset in list_presets){
			if(list_presets.hasOwnProperty(preset))
				create_preset(list_presets[preset], pri_vill)
		}

		services.$timeout(function(){
			presets_load = angular.copy(services.presetListService.getPresets())
			
			var list_loaded = Object.values(presets_load).map(function(value){
				if(presets_created.find(f=>f==value.name))
					return value.id
			})
			if(list_loaded.length){
				list_loaded = list_loaded.filter(f=>f!=false);
			}
			
			if(list_loaded.length){
				for (village in villages){
					if(villages.hasOwnProperty(village))
						services.socketService.emit(providers.routeProvider.ASSIGN_PRESETS, {
							'village_id': villages[village],
							'preset_ids': list_loaded
						});
				}
			}
		},10000)

	} else {
		if(!data_farm.version || (typeof(data_farm.version) == "number" ? data_farm.version.toString() : data_farm.version) < conf.VERSION.FARM){
			data_farm = dataNew
			notify("data_farm");
		} else {
			if(!data_farm.auto_start) data_farm.init_initialized = !1;
			if(data_farm.auto_start) data_farm.init_initialized = !0;
			database.set("data_farm", data_farm, true)		
		}
	}


	Object.setPrototypeOf(data_farm, db_farm);

	return data_farm;
})
