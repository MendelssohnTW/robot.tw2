define("robotTW2/services/ProvinceService", [
	"robotTW2",
	"robotTW2/conf",
	"conf/conf",
	"helper/math",
	"robotTW2/databases/data_villages",
	"struct/MapData"
	], function(
			robotTW2,
			conf,
			conf_conf,
			math,
			data_villages,
			mapData
	){
	return (function ProvinceService(
			$rootScope,
			socketService,
			providers,
			modelDataService,
			$timeout,
			$filter,
			ready
	) {

		var isInitialized = !1
		, isRunning = !1
		, isPaused = !1
		, start = function () {
			if(isRunning) {return}
			ready(function () {
				$rootScope.$on(providers.eventTypeProvider.MAP_PROVINCE, onMapProvinceData);
			}, ["all_villages_ready"])
		}
		, getProvinceCoord = function(x, y){
			var province = mapData.getProvince(x, y)
			if(!province){
				return {
					"x" : 0,
					"y" : 0,
				}
			}
			var pv_obj = Object.keys(province).map(function(pv){
				return province[pv].key.l ? province[pv] : undefined 
			}).filter(f=>f!=undefined)

			if(!pv_obj){
				return {
					"x" : 0,
					"y" : 0,
				}
			} else {
				return {
					"x" : pv_obj.x,
					"y" : pv_obj.y,
				}
			}
		}
		, onMapProvinceData = function($event, data){
			console.log(data)
		}
		, getProvinceData = function(x, y){
			socketService.emit(providers.routeProvider.MAP_GETPROVINCE, {
				'x': 425,
				'y': 445
			});
		}
		, init = function (bool) {
			isInitialized = !0
			if(bool){return}
			start();
		}
		, stop = function () {
			isRunning = !1
		}

		return	{
			init				: init,
			start				: start,
			stop 				: stop,
			getProvinceCoord 	: getProvinceCoord,
			getProvinceData 	: getProvinceData,
			isRunning			: function () {
				return isRunning
			},
			isPaused			: function () {
				return isPaused
			},
			isInitialized		: function () {
				return isInitialized
			},
			version				: conf.VERSION.FARM,
			name				: "province"
		}
	})(
			robotTW2.services.$rootScope,
			robotTW2.services.socketService,
			robotTW2.providers,
			robotTW2.services.armyService,
			robotTW2.services.$timeout,
			robotTW2.services.$filter,
			robotTW2.ready
	)
})