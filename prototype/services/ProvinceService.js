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
		, callbk = undefined
		, callPlayer = undefined
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
			}).filter(f=>f!=undefined)[0]

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
			if(typeof(callbk) == "function"){
				callbk(data)
				callbk = undefined;
			}
		}
		, getProvinceData = function(x, y, callback){
			callbk = callback
			socketService.emit(providers.routeProvider.MAP_GETPROVINCE, {
				'x': 425,
				'y': 445
			});
		}
		, getProvinceForPlayer = function(player, callback){
			callPlayer = callback
			var pvs = []
			, ab = undefined
			let lt_vills = angular.copy(player.villages)
			if(!player || !lt_vills.length){return}
			
			function d (ps) {
				let df =  Object.keys(ps).map(function(pts){
					let vf = ps[pts].villages;
					let rts = Object.keys(vf).map(function(vt){
						return vf[vt]
					})
					
					rts = rts.filter(f=>f.character_id != character_id)
					delete ps[pts].villages
					ps[pts].villages = rts
					return ps[pts].villages
				})
				if(typeof(callPlayer) == "function"){
					callPlayer(df)
					callPlayer = undefined;
				} else {
					return df
				}
			}

			function n(village){
				let village_id = village.village_id
				, x = village.x
				, y = village.y
				, r

				if(!ab){
					ab = new Promise(function(resolve){
						r = $timeout(function(){
							resolve()
						}, conf_conf.LOADING_TIMEOUT);
						let pv = getProvinceCoord(x, y)
						getProvinceData(pv.x, pv.y, function(data){
							if(!pvs.find(f=>f.province_id==data.province_id)){
								pvs.push(data)
							}
							resolve()
						})
					}, function(){
						$timeout.cancel(r);
						r = undefined;
						ab = undefined
						if(lt_vills.length){
							n(lt_vills.shift())
						} else {
							d(pvs)
						}
					})
				}
			}
			n(lt_vills.shift())
		}
		, init = function () {
			isInitialized = !0
			start();
		}
		, stop = function () {
			isRunning = !1
		}
		
		init()

		return	{
			init					: init,
			start					: start,
			stop 					: stop,
			getProvinceCoord 		: getProvinceCoord,
			getProvinceForPlayer 	: getProvinceForPlayer,
			getProvinceData 		: getProvinceData,
			isRunning				: function () {
				return isRunning
			},
			isPaused				: function () {
				return isPaused
			},
			isInitialized			: function () {
				return isInitialized
			},
			name					: "province"
		}
	})(
			robotTW2.services.$rootScope,
			robotTW2.services.socketService,
			robotTW2.providers,
			robotTW2.services.modelDataService,
			robotTW2.services.$timeout,
			robotTW2.services.$filter,
			robotTW2.ready
	)
})