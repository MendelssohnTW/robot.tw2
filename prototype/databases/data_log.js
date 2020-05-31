define("robotTW2/databases/data_log", [
	"robotTW2/databases/database",
	"robotTW2/conf",
	"robotTW2/services",
	"robotTW2/notify",
	"robotTW2/time",
], function (
	database,
	conf,
	services,
	notify,
	time
) {
		var data_log = database.get("data_log")
			, db_log = {};

		db_log.set = function () {
			data_log.headquarter = data_log.headquarter ? data_log.headquarter.splice(data_log.headquarter.length.bound(0, data_log.headquarter.length - 40), data_log.headquarter.length) : [];
			data_log.recruit = data_log.recruit ? data_log.recruit.splice(data_log.recruit.length.bound(0, data_log.recruit.length - 40), data_log.recruit.length) : [];
			data_log.spy = data_log.spy ? data_log.spy.splice(data_log.recruit.length.bound(0, data_log.recruit.length - 40), data_log.recruit.length) : [];
			data_log.fake = data_log.fake ? data_log.fake.splice(data_log.recruit.length.bound(0, data_log.recruit.length - 40), data_log.recruit.length) : [];
			data_log.market = data_log.market ? data_log.market.splice(data_log.market.length.bound(0, data_log.market.length - 40), data_log.market.length) : [];
			data_log.coins = data_log.coins ? data_log.coins.splice(data_log.coins.length.bound(0, data_log.coins.length - 40), data_log.coins.length) : [];

			database.set("data_log", data_log, true)
		}

		db_log.get = function () {
			return database.get("data_log")
		}

		var dataNew = {
			headquarter: [],
			recruit: [],
			spy: [],
			fake: [],
			market: [],
			coins: [],
			version: conf.VERSION.LOG,
		}

		if (!data_log) {
			data_log = dataNew
			database.set("data_log", data_log, true)
		} else {
			if (!data_log.version || (typeof (data_log.version) == "number" ? data_log.version.toString() : data_log.version) < conf.VERSION.ALERT) {
				data_log = dataNew
				notify("data_log");
			} else {
				if (!data_log.auto_start) data_log.init_initialized = !1;
				if (data_log.auto_initialize) data_log.init_initialized = !0;
			}
			database.set("data_log", data_log, true)
		}

		Object.setPrototypeOf(data_log, db_log);

		return data_log;
	})
