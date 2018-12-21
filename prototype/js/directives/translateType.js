define([
	'app.directives'
	],
	function (
			directives
	) {
	'use strict';
    directives.directive('translateType', [
    	'$rootScope', 
    	'$filter',
    	'translate',
    	function (
    			$rootScope, 
    			$filter,
    			translate
    			) {
    	return {
    		restrict: 'A',
    		priority: 1,
    		link: function (scope, element, attrs, ctrl) {
				scope.$watch(attrs.translateType, function(tradtable) {
					if(tradtable){
						element[0].innerText = translate(tradtable, element[0].innerText);
					}
				})
    		}
    	};
    }])
});