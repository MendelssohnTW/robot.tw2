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
		var tb = JSON.parse(localStorage.getItem(this.prefixStandard));
		var data = {};
		if(tb){data = tb.data}else{tb = {"data":{}}}

		angular.extend(data, newValue);
		tb.data = data;
		var keyValue = JSON.stringify(tb);

		try {
			//localStorage.setItem(keyName, keyValue);
			localStorage.setItem(this.prefixStandard, keyValue);
		} catch (e) {
			if (console) console.error("database não pode ser gravado '{"+ key +": "+ value +"}' , porque o localStorage está¡ cheio.");
		}
	}
	, database.get = function get(key, missing, options) {
		var keyName = this.getKeyPrefix(key, options),
		value;
		try {
			//value = JSON.parse(localStorage.getItem(keyName));
			var dbt = JSON.parse(localStorage.getItem(this.prefixStandard));
			value = dbt.data[keyName];
		} catch (e) {
//			if(localStorage[keyName]) {
//			value = {data: localStorage.getItem(keyName)};
//			} else{
//			value = null;
//			}
			if(localStorage[this.prefixStandard]) {
				value = {[this.prefixStandard]: localStorage.getItem(this.prefixStandard)};
			} else{
				value = null;
			}
		}
		//return null === value ? missing : "object" == typeof value && void 0 !== value.data ? value.data : missing
		return null === value ? missing : "object" == typeof value && void 0 !== value ? value : missing
	}
	, database.name = "database"
	, database;
})
