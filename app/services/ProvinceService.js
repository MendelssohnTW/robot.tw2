define("robotTW2/services/ProvinceService", [
	"robotTW2",
	"robotTW2/conf",
	"conf/conf",
	"helper/math",
	"struct/MapData"
	], function(
			robotTW2,
			conf,
			conf_conf,
			math,
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
		, r = undefined
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
			$timeout.cancel(r);
			r = undefined;
			if(typeof(callbk) == "function"){
				callbk(data)
				callbk = undefined;
			}
		}
		, getProvinceData = function(x, y, callback){
			callbk = callback
			r = $timeout(function(){
				callback(!1)
			}, conf_conf.LOADING_TIMEOUT);
			socketService.emit(providers.routeProvider.MAP_GETPROVINCE, {
				'x': x,
				'y': y
			});
		}
		, getProvinceForVillageForEnemy = function(vill, callback){
			let pv = getProvinceCoord(vill.x, vill.y)
			getProvinceData(pv.x, pv.y, function(data){
				if(!data){return}
				let villages = data.villages
				, list_result = villages.map(function(vill_t){
					if(modelDataService.getSelectedCharacter().getTribeRelations() && modelDataService.getSelectedCharacter().getTribeRelations().isEnemy(vill_t.tribe_id)){
						return vill_t
					}
				}).filter(f=>f!=undefined)

				if(typeof(callback)=="function"){
					callback({"villages": list_result, "name": data.name})
				}
			})
		}
		, getProvinceForVillageForBarbarian = function(vill, callback){
			let pv = getProvinceCoord(vill.x, vill.y)
			getProvinceData(pv.x, pv.y, function(data){
				let villages = data.villages
				, list_result = villages.map(function(vill_t){
					if(vill_t.tribe_id == null && vill_t.character_id == null){
						return vill_t
					}
				}).filter(f=>f!=undefined)

				if(typeof(callback)=="function"){
					callback({"villages": list_result, "name": data.name})
				}
			})
		}
		, getProvinceForVillageForNeutral = function(vill, callback){
			let pv = getProvinceCoord(vill.x, vill.y)
			getProvinceData(pv.x, pv.y, function(data){
				let villages = data.villages
				, list_result = villages.map(function(vill_t){
					if((!modelDataService.getSelectedCharacter().getTribeRelations() || (!modelDataService.getSelectedCharacter().getTribeRelations().isEnemy(vill_t.tribe_id)
							&& !modelDataService.getSelectedCharacter().getTribeRelations().isAlly(vill_t.tribe_id)
							&& !modelDataService.getSelectedCharacter().getTribeRelations().isNAP(vill_t.tribe_id)))
							&& vill_t.character_id != null
							&& vill_t.character_id != modelDataService.getSelectedCharacter().getId()
							&& vill_t.tribe_id != modelDataService.getSelectedCharacter().getTribeId()
					){
						return vill_t
					}
				}).filter(f=>f!=undefined)

				if(typeof(callback)=="function"){
					callback({"villages": list_result, "name": data.name})
				}
			})
		}
		, getProvinceForPlayer = function(player, callback){
			callPlayer = callback
			var pvs = []
			, ab = undefined
			let lt_vills = angular.copy(player.villages)
			if(!player || !lt_vills.length){return}

			function d (ps) {
				let df =  Object.keys(ps).map(function(pts){
					ps[pts].villages = ps[pts].villages.filter(f=>f.character_id == player.character_id)
					return ps[pts]
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
				, x = village.village_x
				, y = village.village_y
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
					}).then(function(){
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
			getProvinceForVillageForEnemy 		: getProvinceForVillageForEnemy, 
			getProvinceForVillageForBarbarian 	: getProvinceForVillageForBarbarian,
			getProvinceForVillageForNeutral 	: getProvinceForVillageForNeutral,
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