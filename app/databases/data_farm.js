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

	var presets_created = []
	, dataNew = {
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
			infinite				: true,
			attacked				: false
	}

	if(!data_farm){
		data_farm = dataNew

		function create_preset(preset, id){

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
			let trad_unit = services.$filter("i18n")(unit, services.$rootScope.loc.ale, "units")
			, d_preset = {
				"catapult_target": null,
				"icon": parseInt("0c0b0c", 16),
				"name": "*Farm " + trad_unit,
				"officers": officers,
				"units": units,
				"village_id": id
			}


			presets_created.push(d_preset.name);

			services.socketService.emit(providers.routeProvider.SAVE_NEW_PRESET, d_preset);
		}

		function df(opt){

			if(!opt){
				if(!services.modelDataService.getPresetList().isLoadedValue){
					services.socketService.emit(providers.routeProvider.GET_PRESETS, {}, function(){
						return df(true)
					});
				} else {
					return df(true)
				}
				return
			}

			let villages = services.modelDataService.getSelectedCharacter().getVillageList()

			try{
				Object.keys(villages).map(function(village_id){
					let vill = services.villageService.getInitializedVillage(villages[village_id].getId())
				})
			} catch (err){
				return
			}

			let qtd = Math.min.apply(null, [(Math.max.apply(null, [Math.trunc((villages.length / 10) * 5), 5])), 200])

			let list_presets = [
				{"spear": qtd},
				{"sword": qtd},
				{"archer": qtd},
				{"axe": qtd},
				{"light_cavalry": qtd},
				{"mounted_archer": qtd},
				{"heavy_cavalry": qtd}
				]

			let presets_load = angular.copy(services.presetListService.getPresets())

			let pri_vill = villages[0]
			for (var preset in list_presets){
				if(list_presets.hasOwnProperty(preset)){
					if(presets_load == undefined || Object.values(presets_load).length == 0 || !Object.values(presets_load).map(function(elem){
						return elem.name
					}).find(f => f == "*Farm " + services.$filter("i18n")(Object.keys(list_presets[preset])[0], services.$rootScope.loc.ale, "units"))){
						create_preset(list_presets[preset], pri_vill.getId())
					}
				}
			}

			services.$timeout(function(){
				var list_loaded = Object.values(presets_load).map(function(value){
					if(presets_created.find(f=>f==value.name)){
						return value.id
					} else {
						return undefined
					}
				}).filter(f=>f!=undefined)
				if(list_loaded.length){
					for (village in villages){
						if(villages.hasOwnProperty(village))
							services.socketService.emit(providers.routeProvider.ASSIGN_PRESETS, {
								'village_id': villages[village].getId(),
								'preset_ids': list_loaded
							});
					}
				}
			}, 10000)
		}

		df()
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
