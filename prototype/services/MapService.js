define("robotTW2/services/MapService", [
	"robotTW2",
	"cdn",
	"conf/conf",
	"helper/mapconvert",
	"struct/MapData"
	], function(
			robotTW2,
			cdn,
			conf_conf,
			mapconvert,
			MapData
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
		, main = undefined
		, charModel = undefined
		, tribeRelationsModel = undefined
		, cacheVillages = undefined
		, canvas = undefined
		, context = undefined
		, viewport_canvas = undefined
		, viewport_context = undefined
		, cross_canvas = undefined
		, cross_context = undefined
		, highlights = undefined
		, z = 5
		, A = 1
		, B = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
		, C = {
				village: {},
				character: {},
				tribe: {}
		}
		, cacheVillages = {}
		, E = null
		, F = {}
		, G = {}
		, H = !0
		, I = function(a) {
			var b = getVillageBlock()
			, c = getVillageAxisOffset()
			, d = Math.ceil(F.x + a.offsetX)
			, e = Math.ceil(F.y + a.offsetY);
			return Math.floor(e / b % 2) % 2 && (d -= c),
			d -= d % b,
			e -= e % b,
			{
				x: Math.ceil((d - G.x / 2) / b),
				y: Math.ceil((e - G.y / 2) / b)
			}
		}, J = function(a, b) {
			return {
				x: a / conf_conf.TILESIZE.x,
				y: b / conf_conf.TILESIZE.y / conf_conf.TILESIZE.off
			}
		}, K = function(a, b) {
			b = 1 / (b || 1);
			var c = J(a[0] * b, a[1] * b)
			, d = J(a[2] * b, a[3] * b);
			return [c.x - 1, c.y - 1, d.x + 3 || 1, d.y + 3 || 1]
		}, addEvents = function() {
			var a = !1
			, b = {};
			cross_canvas.addEventListener("mousedown", function(event) {
				event.preventDefault(),
				H = !0,
				a = !0,
				b = {
					x: F.x + event.pageX,
					y: F.y + event.pageY
				},
				E && (d.trigger("minimap/villageClick", [E, event]),
						3 === event.which && ba(E))
			}),
			cross_canvas.addEventListener("mouseup", function() {
				a = !1,
				b = {},
				H || d.trigger("minimap/stop-move")
			}),
			cross_canvas.addEventListener("mousemove", function(event) {
				H = !1,
				a && (F.x = b.x - event.pageX,
						F.y = b.y - event.pageY,
						d.trigger("minimap/start-move"));
				var e = I(event);
				if (e.x in C.village && e.y in C.village[e.x])
					return Z(e, event);
				$()
			}),
			cross_canvas.addEventListener("mouseleave", function() {
				E && $(),
				d.trigger("minimap/mouseLeave")
			}),
			cross_canvas.addEventListener("click", function(a) {
				if (!H)
					return !1;
				var b = I(a);
				$rootScope.$broadcast(h.MAP_CENTER_ON_POSITION, b.x, b.y, !0),
				getTownAtAsync(2, b.x, b.y)
			}),
			cross_canvas.addEventListener("contextmenu", function(a) {
				return a.preventDefault(),
				!1
			})
		}, M = function(a, b) {
			for (var c
					, d
					, e
					, f
					, g = modelDataService.getId()
					, h = modelDataService.getTribeId()
					, i = getVillageBlock()
					, j = getVillageSize()
					, k = getVillageAxisOffset()
					, l = 0; l < a.length; l++)
				c = a[l],
				c.id < 0 || (b ? (f = b,
						d = c[0] * i,
						e = c[1] * i,
						c[1] % 2 && (d += k)) : (d = c.x * i,
								e = c.y * i,
								c.y % 2 && (d += k),
								f = null === c.character_id ? c.id in n.village ? n.village[c.id].color : defaultColors.barbarian : c.character_id === g ? c.id === x.getId() ? defaultColors.selected : c.character_id in n.character ? n.character[c.character_id].color : defaultColors.player : c.id in n.village ? n.village[c.id].color : c.character_id in n.character ? n.character[c.character_id].color : c.tribe_id in n.tribe ? n.tribe[c.tribe_id].color : h && h === c.tribe_id ? defaultColors.tribe : w ? w.isAlly(c.tribe_id) ? defaultColors.ally : w.isEnemy(c.tribe_id) ? defaultColors.enemy : w.isNAP(c.tribe_id) ? defaultColors.friendly : defaultColors.ugly : defaultColors.ugly),
								context.fillStyle = f,
								context.fillRect(d, e, j, j))
		}, initializeMap = function(a) {
			var b
			, c = cdn.getPath(conf_conf.getMapPath());
			b = new XMLHttpRequest,
			b.open("GET", c, !0),
			b.responseType = "arraybuffer",
			b.addEventListener("load", function(c) {
				a(b.response)
			}, !1),
			b.send()
		}, loadByteLevel = function() {
			var a, b, c, d = getVillageBlock(), e = Math.round(d / 2);
			initializeMap(function(f) {
				for (y = new DataView(f),
						b = 1; b < 999; b++)
					for (c = 1; c < 999; c++)
						a = l.toTile(y, b, c),
						a.key.b && (a.key.c ? (context.fillStyle = "rgba(255,255,255,0.8)",
								context.fillRect(b * d + e - 1, c * d + e - 1, 3, 1),
								context.fillRect(b * d + e, c * d + e - 2, 1, 3)) : (context.fillStyle = "rgba(255,255,255,1)",
										context.fillRect(b * d + e, c * d + e - 1, 1, 1)))
			})
		}, P = function() {
			M(MapData.getTowns())
		}, Q = function() {
			var a
			, b
			, c
			, d
			, e
			, f = getVillageBlock()
			, g = getVillageSize()
			, h = getVillageAxisOffset();
			for (a in cacheVillages)
				for (c = 0; c < cacheVillages[a].length; c++)
					b = cacheVillages[a][c],
					d = a * f,
					e = b * f,
					b % 2 && (d += h),
					context.fillStyle = defaultColors.ghost,
					context.fillRect(d, e, g, g)
		}, drawViewport = function(a) {
			clearViewport(),
			viewport_context.drawImage(q, -a.x, -a.y)
		}, clearViewport = function() {
			viewport_context.clearRect(0, 0, o.width, o.height)
		}, loadCross = function(a) {
			clearCross();
			var b = getVillageBlock()
			, c = getLineSize()
			, d = getMapPosition()
			, e = (d[0] + d[2] - 2) * b - a.x
			, f = (d[1] + d[3] - 2) * b - a.y;
			cross_context.fillStyle = "rgba(255,255,255,0.25)",
			cross_context.fillRect(0 | e, 0, 1, c),
			cross_context.fillRect(0, 0 | f, c, 1)
		}, clearCross = function() {
			cross_context.clearRect(0, 0, cross_canvas.width, cross_canvas.height)
		}, V = function() {
			var a = {
					id: x.getId(),
					x: x.getX(),
					y: x.getY()
			};
			x = modelDataService.getSelectedVillage(),
			M([{
				character_id: modelDataService.getId(),
				id: a.id,
				x: a.x,
				y: a.y
			}, {
				character_id: modelDataService.getId(),
				id: x.getId(),
				x: x.getX(),
				y: x.getY()
			}])
		}, W = function() {
			if (ca.interface.isVisible("minimap")) {
				var b = {
						x: F.x - G.x / 2,
						y: F.y - G.y / 2
				};
				drawViewport(b),
				loadCross(b)
			}
			a.requestAnimationFrame(W)
		}, getTownAtAsync = function(a, b, c) {
			var d = 25 * a
			, e = (b || x.getX()) - d / 2
			, f = (c || x.getY()) - d / 2;
			MapData.loadTownDataAsync(e, f, d, d, function() {})
		}, Y = function(a) {
			for (var b = 0; b < a.length; b++) {
				var c = a[b];
				c.id < 0 || (c.x in C.village || (C.village[c.x] = {}),
						c.x in cacheVillages || (cacheVillages[c.x] = []),
						C.village[c.x][c.y] = c.character_id || 0,
						cacheVillages[c.x].push(c.y),
						c.character_id && (c.character_id in C.character ? C.character[c.character_id].push([c.x, c.y]) : C.character[c.character_id] = [[c.x, c.y]],
								c.tribe_id && (c.tribe_id in C.tribe ? C.tribe[c.tribe_id].push(c.character_id) : C.tribe[c.tribe_id] = [c.character_id])))
			}
//			g.set("minimap-cacheVillages", D)
			$rootScope.data_map.cacheVillages = cacheVillages
		}, Z = function(a, b) {
			if (E) {
				if (E.x === a.x && E.y === a.y)
					return !1;
				$()
			}
			d.trigger("minimap/villageHover", [MapData.getTownAt(a.x, a.y), b]),
			E = {
				x: a.x,
				y: a.y
			};
			var c = C.village[a.x][a.y];
			_(c ? C.character[c] : [[a.x, a.y]])
		}, $ = function() {
			if (!E)
				return !1;
			var a = C.village[E.x][E.y];
			aa(a ? C.character[a] : [[E.x, E.y]]),
			E = !1,
			d.trigger("minimap/villageBlur")
		}, _ = function(a) {
			M(a, ca.defaultColors.quickHighlight)
		}, aa = function(a) {
			for (var b = [], c = 0; c < a.length; c++)
				b.push(MapData.getTownAt(a[c][0], a[c][1]));
			M(b)
		}, ba = function(a) {
			var b = C.village[a.x][a.y];
			if (!b)
				return !1;
			ca.addHighlight({
				type: "character",
				id: b
			}, ca.colorPalette.random())
		}
		, defaultColors = {
				selected: "#ffffff",
				barbarian: "#969696",
				player: "#f0c800",
				tribe: "#0000DB",
				ally: "#00a0f4",
				enemy: "#ED1212",
				friendly: "#BF4DA4",
				ugly: "#A96534",
				ghost: "#3E551C",
				quickHighlight: "#ffffff"
		}
		, colorPalette = ["#000000", "#010067", "#d5ff00", "#ff0056", "#9e008e", "#0e4ca1", "#ffe502", "#005f39", "#00ff00", "#95003a", "#ff937e", "#a42400", "#001544", "#91d0cb", "#620e00", "#6b6882", "#0000ff", "#007db5", "#6a826c", "#00ae7e", "#c28c9f", "#be9970", "#008f9c", "#5fad4e", "#ff0000", "#ff00f6", "#ff029d", "#683d3b", "#ff74a3", "#968ae8", "#98ff52", "#a75740", "#01fffe", "#ffeee8", "#fe8900", "#bdc6ff", "#01d0ff", "#bb8800", "#7544b1", "#a5ffd2", "#ffa6fe", "#774d00", "#7a4782", "#263400", "#004754", "#43002c", "#b500ff", "#ffb167", "#ffdb66", "#90fb92", "#7e2dd2", "#bdd393", "#e56ffe", "#deff74", "#00ff78", "#009bff", "#006401", "#0076ff", "#85a900", "#00b917", "#788231", "#00ffc6", "#ff6e41", "#e85ebe"]
		, setVillageSize = function(a) {
			z = a
		}
		, getVillageSize = function() {
			return z
		}
		, setVillageMargin = function(a) {
			A = a
		}
		, getVillageMargin = function() {
			return A
		}
		, getVillageBlock = function() {
			return z + A
		}
		, getLineSize = function() {
			return 1e3 * (z + A)
		}
		, getVillageAxisOffset = function() {
			return Math.round(z / 2)
		}
		, addHighlight = function(a, b) {
			var c = !1;
			if (!a.type || !a.id)
				return d.trigger("minimap/highlight/add/error/no-entry"),
				!1;
			if (!B.test(b))
				return d.trigger("minimap/highlight/add/error/invalid-color"),
				!1;
			n[a.type].hasOwnProperty(a.id) && (c = !0);
			var e = {
					color: b
			};
			return "village" === a.type && (e.x = a.x,
					e.y = a.y),
					n[a.type][a.id] = e,
					g.set("minimap-highlights", n),
					c ? d.trigger("minimap/highlight/update", [a, b]) : d.trigger("minimap/highlight/add", [a, b]),
							P(),
							!0
		}
		, removeHighlight = function(a) {
			return !!n[a.type][a.id] && (delete n[a.type][a.id],
					g.set("minimap-highlights", n),
					d.trigger("minimap/highlight/remove", [a]),
					P(),
					!0)
		}
		, getHighlight = function(a, b) {
			return !!n[a].hasOwnProperty(b) && n[a][b]
		}
		, getHighlights = function() {
			return n
		}
		, eachHighlight = function(a) {
			for (var b in n)
				for (var c in n[b])
					a(b, c, n[b][c])
		}
		, setViewport = function(canvas) {
			viewport_canvas = canvas,
			viewport_context = viewport_canvas.getContext("2d")
		}
		, setCross = function(canvas) {
			cross_canvas = canvas,
			cross_context = cross_canvas.getContext("2d")
		}
		, setCurrentPosition = function(a, b) {
			var c = getVillageBlock();
			F.x = a * c + 50,
			F.y = b * c + (1e3 - (document.body.clientHeight - 238) / 2) + 50
		}
		, getMapPosition = function() {
			var b = a.twx.game.map.engine.getView();
			return K([-b.x, -b.y, u.width / 2, u.height / 2], b.z)
		}
		, init = function (){
			isInitialized = !0
			canvas = document.createElement("canvas"),
			context = canvas.getContext("2d"),
			highlights = $rootScope.data_map.highlights;
			start();
		}
		, start = function (){
			if(isRunning){return}
			ready(function(){
				isRunning = !0;
				$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"MAP"})
				, main = document.getElementById("main-canvas")
				, charModel = modelDataService.getSelectedCharacter()
				, tribeRelationsModel = charModel.getTribeRelations()
				, cacheVillages = $rootScope.data_map.cacheVillages;
				var a = getVillageBlock();
				F.x = 500 * a,
				F.y = 500 * a,
				G.x = 686,
				G.y = 2e3,
				viewport_canvas.setAttribute("width", G.x),
				viewport_canvas.setAttribute("height", G.y),
				viewport_context.imageSmoothingEnabled = !1,
				q.setAttribute("width", 1e3 * a),
				q.setAttribute("height", 1e3 * a),
				q.imageSmoothingEnabled = !1,
				cross_canvas.setAttribute("width", G.x),
				cross_canvas.setAttribute("height", G.y),
				cross_context.imageSmoothingEnabled = !1,
				selected_village = modelDataService.getSelectedVillage(),
				F.x = selected_village.getX() * a,
				F.y = selected_village.getY() * a,
				loadByteLevel(),
				addEvents(),
				Q(),
				P(),
				Y(MapData.getTowns()),
				getTownAtAsync(2),
				W(),
				c.$on(h.MAP_VILLAGE_DATA, function(a, b) {
					M(b.villages),
					Y(b.villages)
				}),
				c.$on(h.VILLAGE_SELECTED_CHANGED, function() {
					V()
				}),
				c.$on(h.TRIBE_RELATION_CHANGED, function(a, b) {
					P()
				})
			}, ["initial_village", "tribe_relations"])
		}
		, stop = function (){
			isRunning = !1;
			$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"MAP"})
		}
		return	{
			init					: init,
			start 					: start,
			stop 					: stop,
			isRunning				: function() {
				return isRunning
			},
			isInitialized			: function(){
				return isInitialized
			},
			version					: "1.0.0",
			name					: "map",
			defaultColors			: defaultColors,
			colorPalette			: colorPalette,
			setVillageSize			: setVillageSize,
			getVillageSize			: getVillageSize,
			setVillageMargin		: setVillageMargin,
			getVillageMargin		: getVillageMargin,
			getVillageBlock			: getVillageBlock,
			getLineSize				: getLineSize,
			getVillageAxisOffset	: getVillageAxisOffset,
			addHighlight			: addHighlight,
			removeHighlight			: removeHighlight,
			getHighlight			: getHighlight,
			getHighlights			: getHighlights,
			eachHighlight			: eachHighlight,
			setViewport				: setViewport,
			setCross				: setCross,
			setCurrentPosition		: setCurrentPosition,
			getMapPosition			: getMapPosition
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