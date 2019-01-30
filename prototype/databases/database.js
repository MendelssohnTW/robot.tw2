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
		var newValue = {[keyName]: value}
		//var keyValue = JSON.stringify({"data": value});
//		var tb = JSON.parse(localStorage.getItem(this.prefixStandard));
		try {
			var tb = JSON.parse(localStorage.getItem(keyName));
			if(tb != null && typeof(tb) == "object"){
//				angular.extend(tb.data, newValue);
				angular.extend(tb, value);
			} else {
//				tb = {"data":newValue}
				tb = value
			}
			var keyValue = JSON.stringify(tb);

			//localStorage.setItem(keyName, keyValue);
			localStorage.setItem(keyName, keyValue);
//			localStorage.setItem(this.prefixStandard, keyValue);
		} catch (e) {
			if (console) console.error(JSON.stringify(e) + " ==== database não pode ser gravado '{"+ key +": "+ value +"}' , porque o localStorage está cheio.");
		}
	}
	, database.get = function get(key, missing, options) {
		var keyName = this.getKeyPrefix(key, options),
		value;
		try {
			//value = JSON.parse(localStorage.getItem(keyName));
//			var dbt = JSON.parse(localStorage.getItem(this.prefixStandard));
//			var dbt = JSON.parse(localStorage.getItem(keyName));
//			value = dbt.data[keyName];
			value = JSON.parse(localStorage.getItem(keyName));
		} catch (e) {
//			if(localStorage[keyName]) {
//			value = {data: localStorage.getItem(keyName)};
//			} else{
//			value = null;
//			}
//			if(localStorage[keyName]) {
//			value = {[keyName]: localStorage.getItem(keyName)};
//			} else{
			value = null;
//			}
		}
		return null === value ? missing : "object" == typeof value && void 0 !== value ? value : missing
	}
	, database.name = "database"
		, database;
})
