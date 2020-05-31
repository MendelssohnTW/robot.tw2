define("robotTW2/controllers/FarmCompletionController", [
	"robotTW2/services",
	"helper/time",
	"robotTW2/databases/data_farm",
], function (
	services,
	helper,
	data_farm
) {
		return function FarmCompletionController($scope) {
			$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);

			var self = this
				, addExcept = function (id) {
					!data_farm.list_exceptions.find(f => f == id) ? data_farm.list_exceptions.push(id) : null;
					data_farm.set()
				}
				, removeExcept = function (id) {
					data_farm.list_exceptions = data_farm.list_exceptions.filter(f => f != id)
					data_farm.set()
				}

			$scope.checked = false;

			$scope.toggleValue = function (checked) {
				if (checked) {
					addExcept($scope.reportData.defVillageId);
				} else {
					removeExcept($scope.reportData.defVillageId);
				}
			}

			$scope.$watch('reportData', function () {
				if (!$scope.reportData || !$scope.reportData.defVillageId) { return }
				if (data_farm.list_exceptions.find(f => f == $scope.reportData.defVillageId)) {
					$scope.checked = true;
				} else {
					$scope.checked = false;
				}
			});

			return $scope;
		}
	})
