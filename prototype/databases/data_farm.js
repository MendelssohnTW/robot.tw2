define("robotTW2/databases/data_farm", [
	"robotTW2",
	"robotTW2/databases/database",
	"robotTW2/conf",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/notify",
	"helper/time"
], function (
	robotTW2,
	database,
	conf,
	services,
	providers,
	notify,
	helper
) {

		var data_farm = database.get("data_farm")
			, db_farm = {}
			, presets_created = []

		db_farm.set = function () {
			database.set("data_farm", data_farm, true)
		}
		db_farm.get = function () {
			return database.get("data_farm");
		}
		db_farm.setPresets = function (value) {
			let list_presets = [
				"*Farm " + services.$filter("i18n")("spear", services.$rootScope.loc.ale, "units"),
				"*Farm " + services.$filter("i18n")("sword", services.$rootScope.loc.ale, "units"),
				"*Farm " + services.$filter("i18n")("archer", services.$rootScope.loc.ale, "units"),
				"*Farm " + services.$filter("i18n")("axe", services.$rootScope.loc.ale, "units"),
				"*Farm " + services.$filter("i18n")("light_cavalry", services.$rootScope.loc.ale, "units"),
				"*Farm " + services.$filter("i18n")("mounted_archer", services.$rootScope.loc.ale, "units"),
				"*Farm " + services.$filter("i18n")("heavy_cavalry", services.$rootScope.loc.ale, "units")
			]
			let presets_load = angular.copy(services.presetListService.getPresets())
			Object.values(presets_load).map(function (pst) {
				if (list_presets.contains(presets_load.name)) {
					Object.keys(pst.units).map(function (unit) {
						pst.units[unit] > 0 ? pst.units[unit] = value : pst.units[unit]
						return
					})
					services.presetService.savePreset(pst)
				}
				return
			})
		}
		db_farm.selectAllPresets = function () {
			let list_presets = [
				"*Farm " + services.$filter("i18n")("spear", services.$rootScope.loc.ale, "units"),
				"*Farm " + services.$filter("i18n")("sword", services.$rootScope.loc.ale, "units"),
				"*Farm " + services.$filter("i18n")("archer", services.$rootScope.loc.ale, "units"),
				"*Farm " + services.$filter("i18n")("axe", services.$rootScope.loc.ale, "units"),
				"*Farm " + services.$filter("i18n")("light_cavalry", services.$rootScope.loc.ale, "units"),
				"*Farm " + services.$filter("i18n")("mounted_archer", services.$rootScope.loc.ale, "units"),
				"*Farm " + services.$filter("i18n")("heavy_cavalry", services.$rootScope.loc.ale, "units")
			]
			let villages = services.modelDataService.getSelectedCharacter().getVillageList()
			let presets_load = angular.copy(services.presetListService.getPresets())
			let list_loaded = Object.values(presets_load).map(function (value) {
				return list_presets.contains(presets_load.name) ? value.id : undefined;
			}).filter(f => f != undefined)

			for (village in villages) {
				if (villages.hasOwnProperty(village))
					services.socketService.emit(providers.routeProvider.ASSIGN_PRESETS, {
						'village_id': villages[village].getId(),
						'preset_ids': list_loaded
					});
			}
		}

		var dataNew = {
			auto_start: false,
			init_initialized: false,
			activated: false,
			hotkey: conf.HOTKEY.FARM,
			version: conf.VERSION.FARM,
			farm_time: conf.FARM_TIME,
			farm_time_start: helper.gameTime(),
			farm_time_stop: new Date((services.$filter("date")(new Date(helper.gameTime() + 86400000), "yyyy-MM-dd")) + " 06:00:00").getTime(),
			list_exceptions: [],
			commands: {},
			name: "data_farm",
			infinite: true,
			attacked: false,
			attack_prog: false,
			defense_prog: false,
			unit_direction: false,
			speed_direction: false,
			cicle_distinct: false,
			list_pause: []
		}

		if (!data_farm) {
			data_farm = dataNew
		} else {
			if (!data_farm.version || (typeof (data_farm.version) == "number" ? data_farm.version.toString() : data_farm.version) < conf.VERSION.FARM) {
				data_farm = dataNew
				notify("data_farm");
			} else {
				if (!data_farm.auto_start) data_farm.init_initialized = !1;
				if (data_farm.auto_start) data_farm.init_initialized = !0;
				database.set("data_farm", data_farm, true)
			}
		}

		Object.setPrototypeOf(data_farm, db_farm);

		return data_farm;
	})
