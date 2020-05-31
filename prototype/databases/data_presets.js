define("robotTW2/databases/data_presets", [
	"robotTW2/databases/database",
	"robotTW2/conf",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/calculateTravelTime",
], function (
	database,
	conf,
	services,
	providers,
	calculateTravelTime
) {
		var data_presets = database.get("data_presets")
			, rallyPointSpeedBonusVsBarbarians = services.modelDataService.getWorldConfig().getRallyPointSpeedBonusVsBarbarians()
			, db = {}
			, update_villages = function () {
				services.$timeout(function () {
					db.updateVillages()
				}, 25000)
			}
			, get_dist = function (v, max_journey_time, units) {
				var village = services.villageService.getInitializedVillage(v)
					, army = {
						'officers': {},
						"units": units
					}
					, travelTime = calculateTravelTime(army, village, "attack", {
						'barbarian': true
					})

				return Math.trunc((max_journey_time / 1000 / travelTime) / 2);
			}
			, getPst = function (v) {
				var presets_d = angular.copy(services.presetListService.getPresetsForVillageId(v))

				if (!Object.keys(presets_d).length) { return {} }
				if (!data_presets.villages[v]) { data_presets.villages[v] = { "presets": {} } }
				Object.keys(presets_d).forEach(function (pst) {
					if (!data_presets.villages[v].presets) { data_presets.villages[v].presets = {} }
					Object.keys(data_presets.villages[v].presets).map(function (id) {
						if (!Object.keys(presets_d).find(f => f == id)) {
							delete data_presets.villages[v].presets[id]
						}
					})
					if (!data_presets.villages[v].presets[pst] || !data_presets.villages[v].presets[pst].load) {
						data_presets.villages[v].presets[pst] = {
							load: true,
							max_journey_distance: get_dist(v, conf.MAX_JOURNEY_TIME, presets_d[pst].units),
							min_journey_distance: get_dist(v, conf.MIN_JOURNEY_TIME, presets_d[pst].units),
							max_journey_time: conf.MAX_JOURNEY_TIME,
							min_journey_time: conf.MIN_JOURNEY_TIME,
							max_points_farm: conf.MAX_POINTS_FARM,
							min_points_farm: conf.MIN_POINTS_FARM,
							quadrants: [1, 2, 3, 4],
							max_commands_farm: conf.MAX_COMMANDS_FARM
						}
					}
				});
				return data_presets.villages[v].presets;
			}

		db.set = function () {
			database.set("data_presets", data_presets, true)
		}

		db.get = function () {
			return database.get("data_presets")
		}

		db.verifyDB = function (villagesExtended) {
			updated = false;
			if (!data_presets) { data_presets = {} }
			if (!villagesExtended) { villagesExtended = {} }
			if (data_presets.villages == undefined) { data_presets.villages = {} }
			Object.keys(data_presets.villages).map(function (m) {
				return m
			}).forEach(function (v) {
				if (!villagesExtended[v]) {
					delete data_presets.villages[v]
					updated = true;
				}
			})
			return updated;
		}

		db.verifyVillages = function (villagesExtended, callback) {
			if (services.modelDataService.getPresetList().isLoadedValue) {
				if (!data_presets) { data_presets = {} }
				if (!villagesExtended) { villagesExtended = {} }
				let update = false;
				if (!data_presets.villages || data_presets.villages == undefined) { data_presets.villages = {} }
				Object.keys(villagesExtended).map(function (m) {
					angular.extend(villagesExtended[m], {
						presets: getPst(m)
					})
					data_presets.villages[m] = angular.extend({}, villagesExtended[m])
					return m;
				})
				callback()
				return;
			} else {
				services.socketService.emit(providers.routeProvider.GET_PRESETS, {}, function () {
					return db.verifyVillages(villagesExtended, callback)
				});
			}
		}

		db.updateVillages = function ($event) {
			var villages = services.modelDataService.getVillages();
			var villagesExtended = {};
			try {
				Object.keys(villages).map(function (village_id) {
					villagesExtended[village_id] = {}
					var vill = services.villageService.getInitializedVillage(village_id)
				})
			} catch (err) {
				return
			}

			var promise = new Promise(function (res, rej) {
				db.verifyVillages(villagesExtended, function () {
					data_presets.getAssignedPresets();

					res()
				})
			})
				.then(function () {
					if (db.verifyDB(villagesExtended)) {
						data_presets.version = conf.VERSION.PRESETS
						db.set();
					}
				}, function () {
					//error
				})
		}

		db.getAssignedPresets = function () {
			var presetsByVillage = services.modelDataService.getPresetList().presetsByVillage;
			Object.keys(data_presets.villages).map(function (a) {
				data_presets.villages[a].assigned_presets = presetsByVillage[a] ? Object.keys(presetsByVillage[a]) : [];
			})
			db.set();
		}

		db.getQuadrants = function (village_id, preset_id) {
			return data_presets.villages[village_id].presets[preset_id].quadrants
		}

		services.$rootScope.$on(providers.eventTypeProvider.VILLAGE_LOST, db.update_villages);
		services.$rootScope.$on(providers.eventTypeProvider.VILLAGE_CONQUERED, db.update_villages);

		services.$rootScope.$on(providers.eventTypeProvider.ARMY_PRESET_DELETED, db.updateVillages);
		services.$rootScope.$on(providers.eventTypeProvider.ARMY_PRESET_ASSIGNED, db.updateVillages);
		services.$rootScope.$on(providers.eventTypeProvider.ARMY_PRESET_SAVED, db.updateVillages);

		if (!data_presets || !data_presets.version || (typeof (data_presets.version) == "number" ? data_presets.version.toString() : data_presets.version) < conf.VERSION.BUILDINGPRESETS) {
			data_presets = {};
			data_presets.version = conf.VERSION.PRESETS
			db.updateVillages();
		} else {
			db.updateVillages()
		}

		Object.setPrototypeOf(data_presets, db);

		return data_presets;
	})