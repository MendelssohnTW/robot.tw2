define("robotTW2/databases/data_log_attack", [
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
    var data_log_attack = database.get("data_log_attack")
      , db_log = {}
      , day = 86400000

    db_log.set = function () {
      data_log_attack.logs = data_log_attack.logs.map(function (log) {
        return time.convertedTime() - log.date < data_log_attack.days * day ? log : undefined
      }).filter(f => f != undefined)

      database.set("data_log_attack", data_log_attack, true)
    }

    db_log.get = function () {
      return database.get(" data_log_attack")
    }

    var dataNew = {
      days: 1,
      logs: [],
      version: conf.VERSION.ATTACK,
    }

    if (!data_log_attack) {
      data_log_attack = dataNew
      database.set(" data_log_attack", data_log_attack, true)
    } else {
      if (!data_log_attack.version || (typeof (data_log_attack.version) == "number" ? data_log_attack.version.toString() : data_log_attack.version) < conf.VERSION.ATTACK) {
        data_log_attack = dataNew
        notify(" data_log_attack");
      } else {
        if (!data_log_attack.auto_start) data_log_attack.init_initialized = !1;
        if (data_log_attack.auto_initialize) data_log_attack.init_initialized = !0;
      }
      database.set(" data_log_attack", data_log_attack, true)
    }

    Object.setPrototypeOf(data_log_attack, db_log);

    return data_log_attack;
  })
