define("robotTW2/databases/data_log_cdr", [
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
    var data_log_cdr = database.get("data_log_cdr")
      , db_log = {}
      , day = 86400000

    db_log.set = function () {
      data_log_cdr.logs = data_log_cdr.logs.map(function (log) {
        return time.convertedTime() - log.date < data_log_cdr.days * day ? log : undefined
      }).filter(f => f != undefined)

      database.set("data_log_cdr", data_log_cdr, true)
    }

    db_log.get = function () {
      return database.get(" data_log_cdr")
    }

    var dataNew = {
      days: 1,
      logs: [],
      version: conf.VERSION.CDR,
    }

    if (!data_log_cdr) {
      data_log_cdr = dataNew
      database.set(" data_log_cdr", data_log_cdr, true)
    } else {
      if (!data_log_cdr.version || (typeof (data_log_cdr.version) == "number" ? data_log_cdr.version.toString() : data_log_cdr.version) < conf.VERSION.CDR) {
        data_log_cdr = dataNew
        notify(" data_log_cdr");
      } else {
        if (!data_log_cdr.auto_start) data_log_cdr.init_initialized = !1;
        if (data_log_cdr.auto_initialize) data_log_cdr.init_initialized = !0;
      }
      database.set(" data_log_cdr", data_log_cdr, true)
    }

    Object.setPrototypeOf(data_log_cdr, db_log);

    return data_log_cdr;
  })
