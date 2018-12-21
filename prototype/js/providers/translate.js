define([
	"app.providers"
	], function (
			providers
	) {

	providers.factory("translate",function (){
		var translate = function(tradtable, array){

			if (typeof array == "string") {
				var array_type = tradtable.map(m => {
					return [m[0], m[1] == array];
				});
				var type;
				array_type.forEach(function(e){
					e[1] ? type = e[0] : null;
				});
				return type;
			} else if (Array.isArray(array)){

				var array_translated = [];

				array.forEach(function(word){
					var array_type = tradtable.map(m => {
						return [m[0], m[1] == word];
					});
					var type;
					array_type.forEach(function(e){
						e[1] ? type = e[0] : null;
					});
					array_translated.push(type);
				})
				return array_translated;
			} else {
				return array;
			}
		};
		return translate;
	})
});