define("robotTW2/databases/data_villages", [
	"robotTW2/databases/database",
	"robotTW2/conf",
	"robotTW2/services",
	"robotTW2/providers"
], function (
	database,
	conf,
	services,
	providers
) {
		var update_villages = function () {
			services.$timeout(function () {
				db.updateVillages()
			}, 5000)
		}
			, data_villages = database.get("data_villages") || {}
			, db = {}
		db.set = function () {
			database.set("data_villages", data_villages, true)
		}
		db.get = function () {
			return database.get("data_villages")
		}
		db.verifyDB = function (villagesExtended) {
			updated = false;
			if (!data_villages) { data_villages = {} }
			if (!villagesExtended) { villagesExtended = {} }
			if (data_villages.villages == undefined) { data_villages.villages = {} }
			Object.keys(data_villages.villages).map(function (m) {
				return m
			}).forEach(function (v) {
				if (!villagesExtended[v]) {
					delete data_villages.villages[v]
					updated = true;
				}
			})
			return updated;
		}

		db.verifyVillages = function (villagesExtended, callback) {

			if (services.modelDataService.getPresetList().isLoadedValue) {
				if (!data_villages) { data_villages = {} }
				if (!villagesExtended) { villagesExtended = {} }
				let update_extend = false;
				let update_db = false;
				if (!data_villages.villages || data_villages.villages == undefined) { data_villages.villages = {} }
				Object.keys(villagesExtended).map(function (m) {
					if (!data_villages.villages[m]) {
						angular.extend(villagesExtended[m], {
							farm_activate: true,
							defense_activate: true,
							headquarter_activate: true,
							recruit_activate: true,
							sniper_defense: true,
							sniper_attack: true,
							sniper_resources: true,
							donate_resources: false,
							coins_activate: false,
							nobles_activate: false,
							seq_type: "seq_flex",
							selected: null//selects.find(f=>f.name=="standard")
						})
						data_villages.villages[m] = angular.extend({}, villagesExtended[m])
						update_extend = true;
						return m;
					} else {
						return m;
					}
				})

				if (db.verifyDB(villagesExtended)) {
					data_villages.version = conf.VERSION.VILLAGES
					update_db = true;
				}

				callback(update_extend || update_db)
				return;
			} else {
				services.socketService.emit(providers.routeProvider.GET_PRESETS, {}, function () {
					return db.verifyVillages(villagesExtended, callback)
				});
			}
		}

		db.updateVillages = function ($event) {
			var updated = false;
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
				db.verifyVillages(villagesExtended, function (updated) {
					updated ? res() : rej()
				})
			})
				.then(function () {
					db.set();
				}, function () {
					if (!data_villages || !data_villages.version || (typeof (data_villages.version) == "number" ? data_villages.version.toString() : data_villages.version) < conf.VERSION.VILLAGES) {
						data_villages = {};
						data_villages.version = conf.VERSION.VILLAGES
						db.set();
						db.updateVillages();
					}
				})
		}

		if (!data_villages || !data_villages.version || (typeof (data_villages.version) == "number" ? data_villages.version.toString() : data_villages.version) < conf.VERSION.VILLAGES) {
			data_villages = {};
			data_villages.version = conf.VERSION.VILLAGES
			db.updateVillages();
		} else {
			db.updateVillages()
		}

		services.$rootScope.$on(providers.eventTypeProvider.VILLAGE_LOST, db.updateVillages);
		services.$rootScope.$on(providers.eventTypeProvider.VILLAGE_CONQUERED, db.updateVillages);

		Object.setPrototypeOf(data_villages, db);

		return data_villages;
	})
