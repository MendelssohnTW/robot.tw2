define("robotTW2/controllers/DepositController", [
	"robotTW2",
	"robotTW2/services",
	"robotTW2/providers",
	"helper/time",
	], function(
			robotTW2,
			services,
			providers,
			helper
	){
	return function DepositController($rootScope, $scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		$scope.SAVE = services.$filter("i18n")("SAVE", $rootScope.loc.ale);
		var self = this;
		
		$scope.blur = function(){
			$rootScope.data_deposit.interval = helper.unreadableSeconds($("#input-ms").val()) * 1000;
		}
		
		document.getElementById("input-ms").value = helper.readableMilliseconds($rootScope.data_deposit.interval);
		
		return $scope;
	}
})