define("robotTW2/databases/data_cdr", [
  "robotTW2/databases/database",
  "robotTW2/conf",
  "robotTW2/services",
  "robotTW2/notify",
  "robotTW2/providers",
  "robotTW2/unitTypesRenameRecon"
], function (
  database,
  conf,
  services,
  notify,
  providers,
  unitTypesRenameRecon
) {
    var data_cdr = database.get("data_cdr")
      , db_cdr = {};

    db_cdr.set = function () {
      database.set("data_cdr", data_cdr, true)
    }

    db_cdr.get = function () {
      return database.get("data_cdr")
    }

    var dataNew = {
      auto_start: false,
      init_initialized: false,
      activated: false,
      hotkey: conf.HOTKEY.CDR,
      use_reroll: false,
      auto_reroll: false,
      rename: unitTypesRenameRecon,
      active_rename: false,
      complete: 0,
      version: conf.VERSION.CDR,
      interval_deposit: conf.INTERVAL.CDR,
      interval: conf.INTERVAL.CDR
    }

    if (!data_cdr) {
      data_cdr = dataNew
      database.set("data_cdr", data_cdr, true)
    } else {
      if (!data_cdr.version || (typeof (data_cdr.version) == "number" ? data_cdr.version.toString() : data_cdr.version) < conf.VERSION.CDR) {
        data_cdr = dataNew
        notify("data_cdr");
      } else {
        if (!data_cdr.auto_start) data_cdr.init_initialized = !1;
        if (data_cdr.auto_start) data_cdr.init_initialized = !0;
      }
      database.set("data_cdr", data_cdr, true)
    }

    Object.setPrototypeOf(data_cdr, db_cdr);

    return data_cdr;
  })