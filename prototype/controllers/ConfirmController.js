define("robotTW2/controllers/ConfirmController", [
	"robotTW2/services",
	"robotTW2/providers",
	"helper/time"
	], function(
			services,
			providers,
			helper
	){
	return function ConfirmController($scope) {
		$scope.CONFIRM = services.$filter("i18n")("CONFIRM", services.$rootScope.loc.ale);
		$scope.CANCEL = services.$filter("i18n")("CANCEL", services.$rootScope.loc.ale);
		$scope.title = services.$filter("i18n")("title", services.$rootScope.loc.ale, "confirm_https")
		$scope.text_show = services.$filter("i18n")("text_show", services.$rootScope.loc.ale, "confirm_https")
		$scope.text_confirm = services.$filter("i18n")("text_show", services.$rootScope.loc.ale, "confirm_https")
		$scope.text_reload = services.$filter("i18n")("text_reload", services.$rootScope.loc.ale, "confirm_https")
		var self = this;
		
		$scope.inConfirm = true;
		$scope.inReload = false;
		services.$timeout(function(){
			$rootScope.$broadcast("stopAll")
			$scope.closeWindow();
		}, 5000)
		
		$scope.Confirm = function(){
			if(inConfirm){
				$scope.inConfirm = false;
				$scope.inReload = true;
				window.open('https://www.ipatapp.com.br', '_blank');
			} else if(inReload){
				location.reload()	
			} else {
				$rootScope.$broadcast("stopAll")
			}
		}
		
		$scope.Cancel = function(){
			$rootScope.$broadcast("stopAll")
			$scope.closeWindow();
		}

//		$scope.$watch("data_alert", function(){
//			if(!$scope.data_alert){return}
//			data_alert = $scope.data_alert;
//			data_alert.set();
//		}, true)

		$scope.setCollapse();
		$scope.recalcScrollbar();

		return $scope;
	}
})