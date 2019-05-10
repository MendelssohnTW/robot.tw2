define("robotTW2/databases/database", [
	"robotTW2/services",
	"robotTW2/conf"
	], function(
			services,
			conf
	) {
	var database = {};
	return database.prefixStandard = "kingdom_storage"
		, database.prefix = services.modelDataService.getSelectedCharacter().getId() + "_" + services.modelDataService.getSelectedCharacter().getWorldId() + "_"
		, database.getKeyPrefix = function(key, options) {
		options = options || {};
		if (options.noPrefix) {
			return key;
		} else {
			return this.prefix + key;
		}
	}
	, database.set = function set(key, value, options) {
		var keyName = this.getKeyPrefix(key, options)
		try {
			var tb = JSON.parse(localStorage.getItem(keyName));
			if(tb != null && typeof(tb) == "object"){
				angular.extend(tb, value);
			} else {
				tb = value
			}
			var keyValue = JSON.stringify(tb);

			localStorage.setItem(keyName, keyValue);
		} catch (e) {
			localStorage.setItem(keyName, null);
			if (console) console.error(JSON.stringify(e) + " ==== database não pode ser gravado '{"+ key +": "+ value +"}' , porque o localStorage está cheio.");
		}
	}
	, database.get = function get(key, missing, options) {
		var keyName = this.getKeyPrefix(key, options),
		value;
		try {
			value = JSON.parse(localStorage.getItem(keyName));
		} catch (e) {
			value = null;
		}
		return null === value ? missing : "object" == typeof value && void 0 !== value ? value : missing
	}
	, database.name = "database"
	, database;
})
