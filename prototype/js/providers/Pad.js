define([
	"app.providers"
	], function (
			factories
	) {	
	factories.factory("Pad", function (){
		var service = {},
		get = function get(s) {
			return (s < 10 && (s.toString()).length < 2) ? '0' + s : s;
		};
		service.get = get;
		return service; 
	})
});