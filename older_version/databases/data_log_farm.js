define("robotTW2/databases/data_log_farm", [
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
    var data_log_farm = database.get("data_log_farm")
      , db_log = {}
      , day = 86400000

    db_log.set = function () {
      data_log_farm.logs = data_log_farm.logs.map(function (log) {
        return time.convertedTime() - log.date < data_log_farm.days * day ? log : undefined
      }).filter(f => f != undefined)

      data_log_farm.logs = data_log_farm.logs ? data_log_farm.logs.splice(data_log_farm.logs.length.bound(0, data_log_farm.logs.length - 1000), data_log_farm.logs.length) : [];

      database.set("data_log_farm", data_log_farm, true)
    }

    db_log.get = function () {
      return database.get(" data_log_farm")
    }

    var dataNew = {
      days: 1,
      logs: [],
      version: conf.VERSION.FARM,
    }

    if (!data_log_farm) {
      data_log_farm = dataNew
      database.set(" data_log_farm", data_log_farm, true)
    } else {
      if (!data_log_farm.version || (typeof (data_log_farm.version) == "number" ? data_log_farm.version.toString() : data_log_farm.version) < conf.VERSION.FARM) {
        data_log_farm = dataNew
        notify(" data_log_farm");
      } else {
        if (!data_log_farm.auto_start) data_log_farm.init_initialized = !1;
        if (data_log_farm.auto_initialize) data_log_farm.init_initialized = !0;
      }
      database.set(" data_log_farm", data_log_farm, true)
    }

    Object.setPrototypeOf(data_log_farm, db_log);

    return data_log_farm;
  })
