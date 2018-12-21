define([
	"app.providers"
	], function (
			factories
	) {	
	factories.factory("isEmpty", function (){
		return function(obj){obj ? Object.keys(obj).length === 0 : 0}
	})
});