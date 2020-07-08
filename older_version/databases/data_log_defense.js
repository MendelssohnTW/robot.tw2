define("robotTW2/databases/data_log_defense", [
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
    var data_log_defense = database.get("data_log_defense")
      , db_log = {}
      , day = 86400000

    db_log.set = function () {
      data_log_defense.logs = data_log_defense.logs.map(function (log) {
        return time.convertedTime() - log.date < data_log_defense.days * day ? log : undefined
      }).filter(f => f != undefined)

      database.set("data_log_defense", data_log_defense, true)
    }

    db_log.get = function () {
      return database.get(" data_log_defense")
    }

    var dataNew = {
      days: 1,
      logs: [],
      version: conf.VERSION.DEFENSE,
    }

    if (!data_log_defense) {
      data_log_defense = dataNew
      database.set(" data_log_defense", data_log_defense, true)
    } else {
      if (!data_log_defense.version || (typeof (data_log_defense.version) == "number" ? data_log_defense.version.toString() : data_log_defense.version) < conf.VERSION.DEFENSE) {
        data_log_defense = dataNew
        notify(" data_log_defense");
      } else {
        if (!data_log_defense.auto_start) data_log_defense.init_initialized = !1;
        if (data_log_defense.auto_initialize) data_log_defense.init_initialized = !0;
      }
      database.set(" data_log_defense", data_log_defense, true)
    }

    Object.setPrototypeOf(data_log_defense, db_log);

    return data_log_defense;
  })
