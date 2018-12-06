define("robotTW2/services/MapService", [
	"robotTW2",
	"cdn",
	"conf/conf"
	], function(
			robotTW2,
			cdn,
			conf_conf
	){
	return (function MapService(
			$rootScope,
			socketService,
			providers,
			modelDataService,
			$timeout,
			ready
	) {
		var isInitialized = !1
		, isRunning = !1
		, villageSelected
		, z = 5
		, A = 1
		, F = {}
		, G = {}
		, getVillageBlock = function() {
			return z + A
		}
		, N = function(a) {
			var b
			, c = cdn.getPath(conf_conf.getMapPath());
			b = new XMLHttpRequest,
			b.open("GET", c, !0),
			b.responseType = "arraybuffer",
			b.addEventListener("load", function(c) {
				a(b.response)
			}, !1),
			b.send()
		}
		, O = function() {
			var a
			, b
			, c
			, d = getVillageBlock()
			, e = Math.round(d / 2);
			N(function(f) {
				for (y = new DataView(f),
						b = 1; b < 999; b++)
					for (c = 1; c < 999; c++)
						a = l.toTile(y, b, c),
						a.key.b && (a.key.c ? (r.fillStyle = "rgba(255,255,255,0.8)", r.fillRect(b * d + e - 1, c * d + e - 1, 3, 1), r.fillRect(b * d + e, c * d + e - 2, 1, 3)) 
								: (r.fillStyle = "rgba(255,255,255,1)", r.fillRect(b * d + e, c * d + e - 1, 1, 1)))
			})
		}
		, init = function (){
			isInitialized = !0
			start();
		}
		, start = function (){
			if(isRunning){return}
			ready(function(){
				isRunning = !0;
				$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"MAP"})
				
				var canvas = document.createElement("canvas")
				, context = canvas.getContext("2d")
				, n = $rootScope.data_map.highlights
				
				/*
				 * interface
				 */
				, cross = $(".cross")[0].getContext("2d")
				, minimap = $(".minimap")[0].getContext("2d")
				, minimap_window = $("#minimap")[0]
				
				//u//
				, main = document.getElementById("main-canvas")
				, charModel = modelDataService.getSelectedCharacter()
				, tribeRelationsModel = charModel.getTribeRelations()
				, D = $rootScope.data_map.cacheVillages;
				
				O()


			}, ["all_villages_ready"])
		}
		, stop = function (){
			isRunning = !1;
			$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"MAP"})
		}
		return	{
			init			: init,
			start 			: start,
			stop 			: stop,
			isRunning		: function() {
				return isRunning
			},
			isInitialized	: function(){
				return isInitialized
			},
			version			: "1.0.0",
			name			: "map"
		}
	})(
			robotTW2.services.$rootScope,
			robotTW2.services.socketService,
			robotTW2.providers,
			robotTW2.services.modelDataService,
			robotTW2.services.$timeout,
			robotTW2.ready
	)
})