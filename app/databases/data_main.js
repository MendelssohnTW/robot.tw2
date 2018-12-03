define("robotTW2/databases/data_main", [
	"robotTW2/databases/database",
	"robotTW2/conf",
	"robotTW2/services",
	"robotTW2/notify"
	], function(
			database,
			conf,
			services,
			notify
	){

	var data_main = database.get("data_main")
	, db_main = {};

	db_main.set = function(){
		database.set("data_main", data_main, true)
	}

	db_main.get = function(){
		return database.get("data_main")
	}
	db_main.setExtensions = function(extensions){
		for (var extension in extensions){
			var string = "data_" + extension.toLowerCase();
			var db = services.$rootScope[string]
			if(db){
				db.initialized = extensions[extension].initialized
				db.auto_initialize = extensions[extension].auto_initialize
				db.activated = extensions[extension].activated
			}
		}
	}
	db_main.getExtensions = function(){
		var dbs = conf.DBS
		, extensions = {};

		dbs.forEach(function(db_name){
			var string = "data_" + db_name.toLowerCase();
			var db = services.$rootScope[string]
			if(db){
				angular.extend(extensions, {
					[db_name.toUpperCase()] : {
						initialized 		: db.initialized,
						auto_initialize 	: db.auto_initialize,
						activated 			: db.activated,
						name 				: db_name.toUpperCase(),
						hotkey				: conf.HOTKEY[db_name.toUpperCase()]

					}		
				});
			}	
		})

		return extensions;
	}

	var dataNew = {
			max_time_correction		: conf.MAX_TIME_CORRECTION,
			time_correction_command	: conf.TIME_CORRECTION_COMMAND,
			version					: conf.VERSION.MAIN,
			name					: "data_main"
	}

	if(!data_main){
		data_main = dataNew
	} else {
		if(!data_main.version || data_main.version < conf.VERSION.MAIN){
			data_main = dataNew
			notify("data_main");
		} else {
			if(!data_main.auto_initialize) data_main.initialized = !1;
			if(data_main.auto_initialize) data_main.initialized = !0;
		}
	}
	database.set("data_main", data_main, true)

	Object.setPrototypeOf(data_main, db_main);

	services.$rootScope.data_main = data_main;

	services.$rootScope.$watch("data_main", function(){
		data_main.set()
	}, true)

	return data_main;

})