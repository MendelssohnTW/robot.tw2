define([
	'app.directives'
	],
	function (
			directives
	) {
	'use strict';
	directives.directive('formatoData', [
		'$rootScope', 
		'$filter',
		'conf',
		function(
				$rootScope, 
				$filter,
				conf
		) {
			return {
				restrict: 'A',
				priority: 1,
				link: function (scope, element, attrs, ctrl) {
					function updateFormat(value) {
						var d = new Date(Date.parse(element[0].innerText));
						element[0].innerText = ($filter("date")(d, value)).toString();
					};
					scope.$watch(attrs.formatoData, function(value) {
						if(value){
							updateFormat(value);
						}
					})
				}
			};

			return {
				link: link
			};
		}])
});

