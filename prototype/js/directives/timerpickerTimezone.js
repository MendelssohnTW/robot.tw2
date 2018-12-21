define([
	'app.directives'
	],
	function (
			directives
	) {
	'use strict';
    directives.directive('timepickerTimezone', [
    	'$rootScope', 
    	'$filter', 
    	function (
    			$rootScope, 
    			$filter
    			) {
    	return {
    		restrict: 'A',
    		priority: 1,
    		require: 'ngModel',
    		link: function (scope, element, attrs, ctrl) {
    			ctrl.$formatters.push(function (value) {
    				if (!value) {
    					return "";
    				}
    				return value;
    			});

    			ctrl.$parsers.push(function (value) {
    				return new Date(value);
    			});
    		}
    	};
    }])
});

