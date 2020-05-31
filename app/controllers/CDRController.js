define("robotTW2/controllers/CDRController", [
  "helper/time",
  "robotTW2/time",
  "robotTW2/services",
  "robotTW2/providers",
  "robotTW2/conf",
  "conf/unitTypes",
  "robotTW2/databases/data_cdr",
  "robotTW2/databases/data_villages",
  "helper/format"
], function (
  helper,
  time,
  services,
  providers,
  conf,
  unitTypes,
  data_cdr,
  data_villages,
  formatHelper
) {
    return function CDRController($scope) {
      $scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
      $scope.MENU = services.$filter("i18n")("MENU", services.$rootScope.loc.ale);
      $scope.START = services.$filter("i18n")("START", services.$rootScope.loc.ale);
      $scope.STOP = services.$filter("i18n")("STOP", services.$rootScope.loc.ale);
      $scope.version = services.$filter("i18n")("version", services.$rootScope.loc.ale);

      $scope.data_cdr = data_cdr
      $scope.text_version = $scope.version + " " + data_cdr.version;

      $scope.data_villages = data_villages;
      $scope.local_data_villages = []

      $scope.isRunning = services.CDRService.isRunning();

      var getCoinsTime = function getCoinsTime() {
        let tm = helper.readableMilliseconds($scope.data_cdr.interval);
        if (tm.length == 7) {
          tm = "0" + tm;
        }
        return tm;
      }
        , time_rest;

      $scope.getTimeRest = function () {
        time_rest = $scope.data_cdr.complete > time.convertedTime() ? helper.readableMilliseconds($scope.data_cdr.complete - time.convertedTime()) : 0;
        return time_rest;
      }

      $scope.getKey = function (unit_name) {
        return services.$filter("i18n")(unit_name, services.$rootScope.loc.ale, "units");
      }

      $scope.getClass = function (unit_name) {
        return "icon-34x34-unit-" + unit_name;
      }

      $scope.selectAllVillages = function () {
        let coins_activate = $scope.data_villages.villages[$scope.data_select.selectedOption.id].coins_activate
          , nobles_activate = $scope.data_villages.villages[$scope.data_select.selectedOption.id].nobles_activate
        Object.keys($scope.data_villages.villages).map(function (key) {
          $scope.data_villages.villages[key].coins_activate = coins_activate;
          $scope.data_villages.villages[key].nobles_activate = nobles_activate;
        })
      }

      $scope.set_coins_time = function () {
        let r_coins_time = document.querySelector("#farm_time").value
        if (r_coins_time.length <= 5) {
          r_coins_time = r_coins_time + ":00"
        }
        $scope.data_cdr.interval = unreadableSeconds(r_coins_time) * 1000;
        $scope.coins_time = getCoinsTime();
      }

      $scope.getTimeRest = function () {
        return $scope.data_cdr.complete > time.convertedTime() ? helper.readableMilliseconds($scope.data_cdr.complete - time.convertedTime()) : 0;
      }

      $scope.menu = function () {
        services.$rootScope.$broadcast(providers.eventTypeProvider.OPEN_MAIN);
      }

      $scope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function ($event, data) {
        if (!data || !["COINS", "RECON", "DEPOSIT"].includes(data.name)) { return }
        $scope.recalcScrollbar();
        if (!$scope.$$phase) { $scope.$apply() }
      })

      $scope.coins_time = getCoinsTime();

      $scope.local_data_villages = services.VillService.getLocalVillages("coins", "label");
      $scope.data_select = services.MainService.getSelects($scope.local_data_villages, $scope.local_data_villages.find(f => f.id == services.modelDataService.getSelectedCharacter().getSelectedVillage().getId()), "id")

      $scope.village_selected = $scope.local_data_villages.find(f => f.id == services.modelDataService.getSelectedCharacter().getSelectedVillage().getId())

      $scope.$on("$destroy", function () {
        $scope.data_cdr.set();
        $scope.data_villages.set();
      });

      $scope.$on(providers.eventTypeProvider.VILLAGE_SELECTED_CHANGED, function () {
        $scope.data_select.selectedOption = $scope.local_data_villages.find(f => f.id == services.modelDataService.getSelectedCharacter().getSelectedVillage().getId())
      });

      $scope.$on(providers.eventTypeProvider.INTERVAL_CHANGE, function ($event, data) {
        if (!data || data.name != "CDR") { return }
        if (!$scope.$$phase) { $scope.$apply(); }
      })
      $scope.$watch("data_select.selectedOption", function () {
        if (!$scope.data_select) { return }
        services.villageService.setSelectedVillage($scope.data_select.selectedOption.id)
      }, true)

      $scope.setCollapse();


      return $scope;
    }
  })
