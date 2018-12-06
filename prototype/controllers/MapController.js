define("robotTW2/controllers/MapController", [
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/conf",
	"robotTW2/time",
	"helper/time"
	], function(
			services,
			providers,
			conf,
			convertedTime,
			helper
	){
	return function MapController($rootScope, $scope) {
		var data_attack = $rootScope.data_attack;
		$scope.CLOSE = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		$scope.CLEAR = services.$filter("i18n")("CLEAR", $rootScope.loc.ale);
		var self = this;

		var TABS = {
				MINIMAP 	: services.$filter("i18n")("minimap", $rootScope.loc.ale, "map"),
				HIGHLIGHTS	: services.$filter("i18n")("highlights", $rootScope.loc.ale, "map"),
				SETTINGS	: services.$filter("i18n")("settings", $rootScope.loc.ale, "map")
		}
		, TAB_ORDER = [
			TABS.MINIMAP,
			TABS.HIGHLIGHTS,
			TABS.SETTINGS
			]
		
		$scope.colorPalette = ["#000000", "#010067", "#d5ff00", "#ff0056", "#9e008e", "#0e4ca1", "#ffe502", "#005f39", "#00ff00", "#95003a", "#ff937e", "#a42400", "#001544", "#91d0cb", "#620e00", "#6b6882", "#0000ff", "#007db5", "#6a826c", "#00ae7e", "#c28c9f", "#be9970", "#008f9c", "#5fad4e", "#ff0000", "#ff00f6", "#ff029d", "#683d3b", "#ff74a3", "#968ae8", "#98ff52", "#a75740", "#01fffe", "#ffeee8", "#fe8900", "#bdc6ff", "#01d0ff", "#bb8800", "#7544b1", "#a5ffd2", "#ffa6fe", "#774d00", "#7a4782", "#263400", "#004754", "#43002c", "#b500ff", "#ffb167", "#ffdb66", "#90fb92", "#7e2dd2", "#bdd393", "#e56ffe", "#deff74", "#00ff78", "#009bff", "#006401", "#0076ff", "#85a900", "#00b917", "#788231", "#00ffc6", "#ff6e41", "#e85ebe"];
		$scope.types=  ["village", "character", "tribe"];
		
		$scope.requestedTab = TABS.MINIMAP;
		$scope.TABS = TABS;
		$scope.TAB_ORDER = TAB_ORDER;

		var setActiveTab = function setActiveTab(tab) {
			$scope.activeTab								= tab;
			$scope.requestedTab								= null;
		}
		, initTab = function initTab() {
			if (!$scope.activeTab) {
				setActiveTab($scope.requestedTab);
			}
		}

		initTab();

		$scope.userSetActiveTab = function(tab){
			setActiveTab(tab);
		}
		
		
		
		var z = 5
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
		, charModel = services.modelDataService.getSelectedCharacter()
		, tribeRelationsModel = charModel.getTribeRelations()
		, D = $rootScope.data_map.cacheVillages;
		
		O()


		$rootScope.$on(providers.eventTypeProvider.CHANGE_COMMANDS, function() {
			update();
			
		})

		$scope.disableScrollbar();

		return $scope;
	}
})