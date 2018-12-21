define([
	'app.directives'
	],
	function (
			directives
	) {
	'use strict';
    directives.directive('datepickerTimezone', [
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
    				var date = new Date(Date.parse(value));
    				//if (!$rootScope.formatData || !value) return new Date();
    				if (!$rootScope.formatData || !value) return "";
    				//$filter("date")(new Date(), $rootScope.formatData);
    				return date;
    			});

    			ctrl.$parsers.push(function (value) {
    				//var date = new Date(value.getTime() - (60000 * value.getTimezoneOffset()));
    				return new Date(value);
    				return $filter("date")(date, $rootScope.formatData);
    			});
    		}
    	};
    }])
});

