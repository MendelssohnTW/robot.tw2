define("two/minimap", [
	"two/locale", 
	"two/eventQueue", 
	"two/ready", 
	"Lockr", 
	"struct/MapData", 
	"conf/conf", 
	"helper/time", 
	"helper/mapconvert", 
	"cdn"
	], function(
			b, 
			d, 
			f, 
			g, 
			i, 
			j, 
			k, 
			l, 
			m) {
	var n
	, o
	, p
	, q
	, r
	, s
	, t
	, u
	, v
	, w
	, x
	, y
	, z = 5
	, A = 1
	, B = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, C = {
			village: {},
			character: {},
			tribe: {}
	}, D = {}
	, E = null
	, F = {}
	, G = {}
	, H = !0
	, I = function(a) {
		var b = ca.getVillageBlock()
		, c = ca.getVillageAxisOffset()
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
			x: a / j.TILESIZE.x,
			y: b / j.TILESIZE.y / j.TILESIZE.off
		}
	}, K = function(a, b) {
		b = 1 / (b || 1);
		var c = J(a[0] * b, a[1] * b)
		, d = J(a[2] * b, a[3] * b);
		return [c.x - 1, c.y - 1, d.x + 3 || 1, d.y + 3 || 1]
	}, L = function() {
		var a = !1
		, b = {};
		s.addEventListener("mousedown", function(c) {
			c.preventDefault(),
			H = !0,
			a = !0,
			b = {
				x: F.x + c.pageX,
				y: F.y + c.pageY
			},
			E && (d.trigger("minimap/villageClick", [E, c]),
					3 === c.which && ba(E))
		}),
		s.addEventListener("mouseup", function() {
			a = !1,
			b = {},
			H || d.trigger("minimap/stop-move")
		}),
		s.addEventListener("mousemove", function(c) {
			H = !1,
			a && (F.x = b.x - c.pageX,
					F.y = b.y - c.pageY,
					d.trigger("minimap/start-move"));
			var e = I(c);
			if (e.x in C.village && e.y in C.village[e.x])
				return Z(e, c);
			$()
		}),
		s.addEventListener("mouseleave", function() {
			E && $(),
			d.trigger("minimap/mouseLeave")
		}),
		s.addEventListener("click", function(a) {
			if (!H)
				return !1;
			var b = I(a);
			c.$broadcast(h.MAP_CENTER_ON_POSITION, b.x, b.y, !0),
			X(2, b.x, b.y)
		}),
		s.addEventListener("contextmenu", function(a) {
			return a.preventDefault(),
			!1
		})
	}, M = function(a, b) {
		for (var c, d, e, f, g = v.getId(), h = v.getTribeId(), i = ca.getVillageBlock(), j = ca.getVillageSize(), k = ca.getVillageAxisOffset(), l = 0; l < a.length; l++)
			c = a[l],
			c.id < 0 || (b ? (f = b,
					d = c[0] * i,
					e = c[1] * i,
					c[1] % 2 && (d += k)) : (d = c.x * i,
							e = c.y * i,
							c.y % 2 && (d += k),
							f = null === c.character_id ? c.id in n.village ? n.village[c.id].color : ca.defaultColors.barbarian : c.character_id === g ? c.id === x.getId() ? ca.defaultColors.selected : c.character_id in n.character ? n.character[c.character_id].color : ca.defaultColors.player : c.id in n.village ? n.village[c.id].color : c.character_id in n.character ? n.character[c.character_id].color : c.tribe_id in n.tribe ? n.tribe[c.tribe_id].color : h && h === c.tribe_id ? ca.defaultColors.tribe : w ? w.isAlly(c.tribe_id) ? ca.defaultColors.ally : w.isEnemy(c.tribe_id) ? ca.defaultColors.enemy : w.isNAP(c.tribe_id) ? ca.defaultColors.friendly : ca.defaultColors.ugly : ca.defaultColors.ugly),
							r.fillStyle = f,
							r.fillRect(d, e, j, j))
	}, N = function(a) {
		var b, c = m.getPath(j.getMapPath());
		b = new XMLHttpRequest,
		b.open("GET", c, !0),
		b.responseType = "arraybuffer",
		b.addEventListener("load", function(c) {
			a(b.response)
		}, !1),
		b.send()
	}, O = function() {
		var a, b, c, d = ca.getVillageBlock(), e = Math.round(d / 2);
		N(function(f) {
			for (y = new DataView(f),
					b = 1; b < 999; b++)
				for (c = 1; c < 999; c++)
					a = l.toTile(y, b, c),
					a.key.b && (a.key.c ? (r.fillStyle = "rgba(255,255,255,0.8)",
							r.fillRect(b * d + e - 1, c * d + e - 1, 3, 1),
							r.fillRect(b * d + e, c * d + e - 2, 1, 3)) : (r.fillStyle = "rgba(255,255,255,1)",
									r.fillRect(b * d + e, c * d + e - 1, 1, 1)))
		})
	}, P = function() {
		M(i.getTowns())
	}, Q = function() {
		var a, b, c, d, e, f = ca.getVillageBlock(), g = ca.getVillageSize(), h = ca.getVillageAxisOffset();
		for (a in D)
			for (c = 0; c < D[a].length; c++)
				b = D[a][c],
				d = a * f,
				e = b * f,
				b % 2 && (d += h),
				r.fillStyle = ca.defaultColors.ghost,
				r.fillRect(d, e, g, g)
	}, R = function(a) {
		S(),
		p.drawImage(q, -a.x, -a.y)
	}, S = function() {
		p.clearRect(0, 0, o.width, o.height)
	}, T = function(a) {
		U();
		var b = ca.getVillageBlock()
		, c = ca.getLineSize()
		, d = ca.getMapPosition()
		, e = (d[0] + d[2] - 2) * b - a.x
		, f = (d[1] + d[3] - 2) * b - a.y;
		t.fillStyle = "rgba(255,255,255,0.25)",
		t.fillRect(0 | e, 0, 1, c),
		t.fillRect(0, 0 | f, c, 1)
	}, U = function() {
		t.clearRect(0, 0, s.width, s.height)
	}, V = function() {
		var a = {
				id: x.getId(),
				x: x.getX(),
				y: x.getY()
		};
		x = v.getSelectedVillage(),
		M([{
			character_id: v.getId(),
			id: a.id,
			x: a.x,
			y: a.y
		}, {
			character_id: v.getId(),
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
			R(b),
			T(b)
		}
		a.requestAnimationFrame(W)
	}, X = function(a, b, c) {
		var d = 25 * a
		, e = (b || x.getX()) - d / 2
		, f = (c || x.getY()) - d / 2;
		i.loadTownDataAsync(e, f, d, d, function() {})
	}, Y = function(a) {
		for (var b = 0; b < a.length; b++) {
			var c = a[b];
			c.id < 0 || (c.x in C.village || (C.village[c.x] = {}),
					c.x in D || (D[c.x] = []),
					C.village[c.x][c.y] = c.character_id || 0,
					D[c.x].push(c.y),
					c.character_id && (c.character_id in C.character ? C.character[c.character_id].push([c.x, c.y]) : C.character[c.character_id] = [[c.x, c.y]],
							c.tribe_id && (c.tribe_id in C.tribe ? C.tribe[c.tribe_id].push(c.character_id) : C.tribe[c.tribe_id] = [c.character_id])))
		}
		g.set("minimap-cacheVillages", D)
	}, Z = function(a, b) {
		if (E) {
			if (E.x === a.x && E.y === a.y)
				return !1;
			$()
		}
		d.trigger("minimap/villageHover", [i.getTownAt(a.x, a.y), b]),
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
			b.push(i.getTownAt(a[c][0], a[c][1]));
		M(b)
	}, ba = function(a) {
		var b = C.village[a.x][a.y];
		if (!b)
			return !1;
		ca.addHighlight({
			type: "character",
			id: b
		}, ca.colorPalette.random())
	}, ca = {};
	return ca.version = "1.2.0",
	ca.defaultColors = {
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
	},
	ca.colorPalette = ["#000000", "#010067", "#d5ff00", "#ff0056", "#9e008e", "#0e4ca1", "#ffe502", "#005f39", "#00ff00", "#95003a", "#ff937e", "#a42400", "#001544", "#91d0cb", "#620e00", "#6b6882", "#0000ff", "#007db5", "#6a826c", "#00ae7e", "#c28c9f", "#be9970", "#008f9c", "#5fad4e", "#ff0000", "#ff00f6", "#ff029d", "#683d3b", "#ff74a3", "#968ae8", "#98ff52", "#a75740", "#01fffe", "#ffeee8", "#fe8900", "#bdc6ff", "#01d0ff", "#bb8800", "#7544b1", "#a5ffd2", "#ffa6fe", "#774d00", "#7a4782", "#263400", "#004754", "#43002c", "#b500ff", "#ffb167", "#ffdb66", "#90fb92", "#7e2dd2", "#bdd393", "#e56ffe", "#deff74", "#00ff78", "#009bff", "#006401", "#0076ff", "#85a900", "#00b917", "#788231", "#00ffc6", "#ff6e41", "#e85ebe"],
	ca.setVillageSize = function(a) {
		z = a
	}
	,
	ca.getVillageSize = function() {
		return z
	}
	,
	ca.setVillageMargin = function(a) {
		A = a
	}
	,
	ca.getVillageMargin = function() {
		return A
	}
	,
	ca.getVillageBlock = function() {
		return z + A
	}
	,
	ca.getLineSize = function() {
		return 1e3 * (z + A)
	}
	,
	ca.getVillageAxisOffset = function() {
		return Math.round(z / 2)
	}
	,
	ca.addHighlight = function(a, b) {
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
	,
	ca.removeHighlight = function(a) {
		return !!n[a.type][a.id] && (delete n[a.type][a.id],
				g.set("minimap-highlights", n),
				d.trigger("minimap/highlight/remove", [a]),
				P(),
				!0)
	}
	,
	ca.getHighlight = function(a, b) {
		return !!n[a].hasOwnProperty(b) && n[a][b]
	}
	,
	ca.getHighlights = function() {
		return n
	}
	,
	ca.eachHighlight = function(a) {
		for (var b in n)
			for (var c in n[b])
				a(b, c, n[b][c])
	}
	,
	ca.setViewport = function(a) {
		o = a,
		p = o.getContext("2d")
	}
	,
	ca.setCross = function(a) {
		s = a,
		t = s.getContext("2d")
	}
	,
	ca.setCurrentPosition = function(a, b) {
		var c = ca.getVillageBlock();
		F.x = a * c + 50,
		F.y = b * c + (1e3 - (document.body.clientHeight - 238) / 2) + 50
	}
	,
	ca.getMapPosition = function() {
		var b = a.twx.game.map.engine.getView();
		return K([-b.x, -b.y, u.width / 2, u.height / 2], b.z)
	}
	,
	ca.init = function() {
		b.create("minimap", {
			en: {
				title: "Minimap",
				minimap: "Minimap",
				highlights: "Highlights",
				add: "Add highlight",
				remove: "Remove highlight",
				"entry/id": "Village/player/tribe",
				"highlight/add/success": "Highlight added",
				"highlight/add/error": "Specify a highlight first",
				"highlight/update/success": "Highlight updated",
				"highlight/remove/success": "Highlight removed",
				"highlight/villages": "Villages",
				"highlight/players": "Players",
				"highlight/tribes": "Tribes",
				"highlight/add/error/exists": "Highlight already exists!",
				"highlight/add/error/no-entry": "Select a village/player/tribe first!",
				"highlight/add/error/invalid-color": "Invalid color!",
				village: "Village",
				player: "Player",
				tribe: "Tribe",
				color: "Color (Hex)"
			},
			pl: {
				title: "Minimapa",
				minimap: "Kartograf",
				highlights: "Podświetlenie",
				add: "Dodaj podświetlenie",
				remove: "Usuń podświetlenie",
				"entry/id": "Wioska/gracz/plemie",
				"highlight/add/success": "Podświetlenie dodane",
				"highlight/add/error": "Najpierw sprecyzuj podświetlenie",
				"highlight/update/success": "Podświetlenie zaktualizowane",
				"highlight/remove/success": "Podświetlenie usunięte",
				"highlight/villages": "Wioski",
				"highlight/players": "Gracze",
				"highlight/tribes": "Plemiona",
				"highlight/add/error/exists": "Podświetlenie już istnieje!",
				"highlight/add/error/no-entry": "Najpierw wybierz wioskę/gracza/plemię!",
				"highlight/add/error/invalid-color": "Nieprawidłowy kolor!",
				village: "Wioska",
				player: "Gracz",
				tribe: "Plemię",
				color: "Kolor (Hex)"
			},
			pt: {
				title: "Minimap",
				minimap: "Minimapa",
				highlights: "Marcações",
				add: "Adicionar marcação",
				remove: "Remover marcação",
				"entry/id": "Aldeia/jogador/tribo",
				"highlight/add/success": "Marcação adicionada",
				"highlight/add/error": "Especifique uma marcação primeiro",
				"highlight/update/success": "Marcação atualizada",
				"highlight/remove/success": "Marcação removida",
				"highlight/villages": "Aldeias",
				"highlight/players": "Jogadores",
				"highlight/tribes": "Tribos",
				"highlight/add/error/exists": "Marcação já existe!",
				"highlight/add/error/no-entry": "Selecione uma aldeia/jogador/tribo primeiro!",
				"highlight/add/error/invalid-color": "Cor inválida!",
				village: "Aldeia",
				player: "Jogador",
				tribe: "Tribo",
				color: "Cor (Hex)"
			}
		}, "en"),
		ca.initialized = !0,
		q = document.createElement("canvas"),
		r = q.getContext("2d"),
		n = g.get("minimap-highlights", {
			village: {},
			character: {},
			tribe: {}
		}, !0)
	}
	,
	ca.run = function() {
		if (!ca.interfaceInitialized)
			throw new Error("Minimap interface not initialized");
		f(function() {
			u = document.getElementById("main-canvas"),
			v = e.getSelectedCharacter(),
			w = v.getTribeRelations(),
			D = g.get("minimap-cacheVillages", {}, !0);
			var a = ca.getVillageBlock();
			F.x = 500 * a,
			F.y = 500 * a,
			G.x = 686,
			G.y = 2e3,
			o.setAttribute("width", G.x),
			o.setAttribute("height", G.y),
			p.imageSmoothingEnabled = !1,
			q.setAttribute("width", 1e3 * a),
			q.setAttribute("height", 1e3 * a),
			q.imageSmoothingEnabled = !1,
			s.setAttribute("width", G.x),
			s.setAttribute("height", G.y),
			t.imageSmoothingEnabled = !1,
			x = v.getSelectedVillage(),
			F.x = x.getX() * a,
			F.y = x.getY() * a,
			O(),
			L(),
			Q(),
			P(),
			Y(i.getTowns()),
			X(2),
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
	,
	ca
}),
define("two/minimap/data", ["two/minimap"], function(a) {
	var b = {};
	a.data = b
}),
require(["two/ready", "two/minimap", "two/minimap/data", "two/minimap/ui"], function(a, b) {
	if (b.initialized)
		return !1;
	a(function() {
		b.init(),
		b.interface(),
		b.run()
	})
}),
define("two/minimap/ui", [
	"two/minimap"
	, "two/locale"
	, "two/ui"
	, "two/ui/autoComplete"
	, "two/FrontButton"
	, "two/utils"
	, "two/eventQueue"
	, "ejs"
	, "struct/MapData"
	, "cdn"
	], function(
			a
			, b
			, d
			, e
			, j
			, k
			, l
			, m
			, n
			, o) {
	var p
	, q
	, r
	, s
	, t
	, u
	, v
	, w
	, x
	, y
	, z
	, A
	, B
	, C
	, D = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
		, E = {}
	, F = function(a, b) {
		f.emit(g.TRIBE_GET_PROFILE, {
			tribe_id: a
		}, b)
	}, G = function(a, b) {
		f.emit(g.CHAR_GET_PROFILE, {
			character_id: a
		}, b)
	}, H = function(a, b, c) {
		n.loadTownDataAsync(a, b, 1, 1, c)
	}, I = function(c, d, e) {
		e && s[c.type].find("[id$=" + c.id + "]").remove();
		var f = document.createElement("tr");
		f.id = c.type + "-" + c.id,
		f.innerHTML = m.render('<td class="entry-icon"><span class="icon-26x26-rte-<#= type #>"></span></td><td class="entry-name"></td><td><input class="entry-color" style="background:<#= color #>" disabled="disabled"></td><td><a href="#" class="entry-remove size-26x26 btn-red icon-20x20-close" tooltip="<#= locale("minimap", "remove") #>"></a></td>', {
			type: c.type,
			id: c.id,
			color: d,
			locale: b
		}),
		s[c.type].append(f);
		var g = f.querySelector(".entry-icon")
		, h = f.querySelector(".entry-name")
		, i = f.querySelector(".entry-remove");
		g.addEventListener("click", function() {
			N(c.type, c.id)
		}),
		h.addEventListener("click", function() {
			N(c.type, c.id)
		}),
		i.addEventListener("click", function() {
			a.removeHighlight(c)
		}),
		"tribe" === c.type ? F(c.id, function(a) {
			h.innerHTML = a.name
		}) : "character" === c.type ? G(c.id, function(a) {
			h.innerHTML = a.character_name
		}) : "village" === c.type && H(c.x, c.y, function(a) {
			h.innerHTML = k.genVillageLabel(a)
		}),
		p.setTooltips()
	}, J = function(a) {
		var b = p.$window.querySelector("#" + a.type + "-" + a.id);
		b && b.remove()
	}, K = function() {
		a.eachHighlight(function(a, b, c) {
			var d = {
					type: a,
					id: b
			};
			"village" === a && (d.x = c.x,
					d.y = c.y),
					I(d, c.color)
		})
	}, L = function(a, b) {
		A.villageName.html(k.genVillageLabel(a)),
		A.villagePoints.html(a.points.toLocaleString()),
		a.character_id ? (A.playerName.html(a.character_name),
				A.playerPoints.html(a.character_points.toLocaleString())) : (A.playerName.html("-"),
						A.playerPoints.html("-")),
						a.tribe_id ? (A.tribeName.html(a.tribe_name + "(" + a.tribe_tag + ")"),
								A.tribePoints.html(a.tribe_points.toLocaleString())) : (A.tribeName.html("-"),
										A.tribePoints.html("-")),
										A.provinceName.html(a.province_name),
										z.css("display", ""),
										z.css("top", b.pageY - 83 + "px"),
										z.css("left", b.pageX + 80 + "px")
	}, M = function() {
		z.css("display", "none")
	}, N = function(a, b) {
		"village" === a ? i.openVillageInfo(b) : "character" === a ? i.openCharacterProfile(b) : "tribe" === a && i.openTribeProfile(b)
	}, O = function() {
		t.on("input", function() {
			var a = t.val();
			if (a.length < 2)
				return e.hide();
			e.search(a, function(a) {
				a.length && e.show(a, t[0], "minimap")
			})
		}),
		x.on("click", function() {
			a.addHighlight(E, w.val())
		}),
		w.on("focus", S),
		w.on("blur", function() {
			setTimeout(T, 150)
		}),
		w.on("keyup", function() {
			R(this.value)
		}),
		y.find("td").on("click", function() {
			R(this.dataset.color),
			T()
		}),
		c.$on(h.SELECT_SELECTED, function(a, b, c) {
			if ("minimap" !== b)
				return !1;
			E.id = c.id,
			E.type = c.type,
			"village" === c.type && (E.x = c.x,
					E.y = c.y),
					u[0].className = "icon-26x26-rte-" + c.type,
					v.html(c.name)
		}),
		l.bind("minimap/highlight/add", function(a, c) {
			I(a, c),
			k.emitNotif("success", b("minimap", "highlight/add/success"))
		}),
		l.bind("minimap/highlight/update", function(a, c) {
			I(a, c, !0),
			k.emitNotif("success", b("minimap", "highlight/update/success"))
		}),
		l.bind("minimap/highlight/remove", function(a) {
			J(a),
			k.emitNotif("success", b("minimap", "highlight/remove/success"))
		}),
		l.bind("minimap/highlight/add/error/exists", function() {
			k.emitNotif("error", b("minimap", "highlight/add/error/exists"))
		}),
		l.bind("minimap/highlight/add/error/no-entry", function() {
			k.emitNotif("error", b("minimap", "highlight/add/error/no-entry"))
		}),
		l.bind("minimap/highlight/add/error/invalid-color", function() {
			k.emitNotif("error", b("minimap", "highlight/add/error/invalid-color"))
		}),
		l.bind("minimap/villageHover", L),
		l.bind("minimap/villageBlur", M),
		l.bind("minimap/mouseLeave", function() {
			M(),
			B.trigger("mouseup")
		}),
		l.bind("minimap/start-move", function() {
			M(),
			B.css("cursor", "url(" + o.getPath("/img/cursor/grab_pushed.png") + "), move")
		}),
		l.bind("minimap/stop-move", function() {
			B.css("cursor", "")
		})
	}, P = function(a) {
		var b = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(a);
		return b ? {
			r: parseInt(b[1], 16),
			g: parseInt(b[2], 16),
			b: parseInt(b[3], 16)
		} : null
	}, Q = function(a) {
		var b = P(a);
		return (299 * b.r + 587 * b.g + 114 * b.b) / 1e3 > 127.5 ? "#000" : "#fff"
	}, R = function(a) {
		if (!D.test(a))
			return !1;
		w.val(a),
		w.css("background", a),
		w.css("color", Q(a))
	}, S = function() {
		y[0].style.display = ""
	}, T = function() {
		y.hide()
	}, U = function() {
		return p = new d("Minimap",{
			activeTab: "minimap",
			template: '<div class="win-content message-list-wrapper searchable-list ng-scope"><header class="win-head"><h2><#= locale("minimap", "title") #> <span class="small">v<#= version #></span></h2><ul class="list-btn"><li><a href="#" class="twOverflow-close size-34x34 btn-red icon-26x26-close"></a></li></ul></header><div class="tabs tabs-bg"><div class="tabs-three-col"><div class="tab" tab="minimap"><div class="tab-inner"><div><a href="#" class="btn-icon btn-orange"><#= locale("minimap", "minimap") #></a></div></div></div><div class="tab" tab="highlights"><div class="tab-inner"><div><a href="#" class="btn-icon btn-orange"><#= locale("minimap", "highlights") #></a></div></div></div><div class="tab" tab="settings"><div class="tab-inner"><div><a href="#" class="btn-icon btn-orange"><#= locale("common", "settings") #></a></div></div></div></div></div><div class="win-main"><div class="box-paper footer has-footer-upper twOverflow-content-minimap"><canvas class="cross"></canvas><canvas class="minimap"></canvas></div><div class="box-paper footer has-footer-upper twOverflow-content-highlights"><h5 class="twx-section"><#= locale("minimap", "add") #></h5><form class="addForm"><table class="tbl-border-light tbl-striped"><colgroup><col width="30%"><col width="6%"><col><col width="12%"><col width="7%"></colgroup><tbody><tr><td class="item-input"><input type="text" class="textfield-border" autocomplete="off" placeholder="<#= locale("minimap", "entry/id") #>"></td><td><span class="item-icon"></span></td><td class="item-name"></td><td class="item-color"><input type="text" class="textfield-border" value="#000000" tooltip="<#= locale("minimap", "color") #>"></td><td class="item-add"><span class="btn-orange icon-26x26-plus" tooltip="<#= locale("minimap", "add") #>"></span></td></tr></tbody></table><table class="tbl-border-light tbl-striped color-picker" style="display: none"><tbody><tr> <# colorPalette.forEach(function (color) { #> <td style="background: <#= color #>" data-color="<#= color #>"></td> <# }) #> </tr></tbody></table></form><div class="highlights"><h5 class="twx-section"><#= locale("minimap", "highlights") #></h5><table class="tbl-border-light tbl-striped"><colgroup><col width="6%"><col><col width="7%"><col width="7%"></colgroup> <# types.forEach(function (type) { #> <tbody class="<#= type #>"></tbody> <# }) #> </table></div></div><div class="box-paper footer has-footer-upper twOverflow-content-settings"><h5 class="twx-section"><#= locale("common", "misc") #></h5><form class="settings"><table class="tbl-border-light tbl-striped"><colgroup><col width="40%"><col></colgroup><tbody><tr><td>Villages right click action</td><td><select data-setting="rightClickAction"><option value="quick-highlight-village" selected="selected">Quick highlight village</option><option value="quick-highlight-player">Quick highlight player</option><option value="quick-highlight-tribe">Quick highlight tribe</option></select></td></tr><tr><td>Show floating minimap</td><td><label class="size-26x26 btn-orange icon-26x26-checkbox" for="settings-floatingMinimap"><input id="settings-floatingMinimap" type="checkbox" data-setting="floatingMinimap"></label></td></tr></tbody></table><h5 class="twx-section"><#= locale("common", "colors") #></h5><table class="tbl-border-light tbl-striped"><colgroup><col width="40%"><col></colgroup><tbody></tbody></table></form></div></div></div><div class="minimap-tooltip box-border-darker box-wrapper" style="display: none"><table class="tbl-border-light tbl-striped"><colgroup><col width="50%"><col width="50%"></colgroup><tbody><tr><td class="cell-space-left"><div class="ff-cell-fix"><span class="size-34x34 icon-bg-black icon-26x26-village"></span><div class="text"><span>Village</span> <span class="overflow-ellipsis village-name"></span></div></div></td><td class="cell-space-left"><div class="ff-cell-fix"><span class="size-34x34 icon-bg-black icon-26x26-points"></span><div class="text"><span>Village points</span> <span class="village-points"></span></div></div></td></tr><tr><td class="cell-space-left"><div class="ff-cell-fix"><span class="size-34x34 icon-bg-black icon-34x34-player"></span><div class="text text-limited"><span>Player name</span> <span class="overflow-ellipsis player-name"></span></div></div></td><td class="cell-space-left"><div class="ff-cell-fix"><span class="size-34x34 icon-bg-black icon-26x26-points"></span><div class="text"><span>Player Points</span> <span class="player-points"></span></div></div></td></tr><tr><td class="cell-space-left"><div class="ff-cell-fix"><span class="size-34x34 icon-bg-black icon-34x34-tribe"></span><div class="text text-limited"><span>Tribe name</span> <span class="overflow-ellipsis tribe-name"></span></div></div></td><td class="cell-space-left"><div class="ff-cell-fix"><span class="size-34x34 icon-bg-black icon-34x34-tribe-points"></span><div class="text"><span>Tribe points</span> <span class="tribe-points"></span></div></div></td></tr><tr><td colspan="2" class="cell-space-left"><div class="ff-cell-fix"><span class="size-34x34 icon-bg-black icon-34x34-province"></span><div class="text"><span>Province name</span> <span class="overflow-ellipsis province-name"></span></div></div></td></tr></tbody></table></div>',
			css: '#Minimap .minimap{background:#436213;position:absolute;left:0;top:0;z-index:0}#Minimap .cross{position:absolute;left:0;top:0;z-index:2}#Minimap .addForm input{width:100%}#Minimap .addForm .item-color input{font-weight:100}#Minimap .addForm td{text-align:center}#Minimap .highlights table{margin-bottom:10px}#Minimap .highlights td{text-align:center}#Minimap .highlights td.entry-name{text-align:left}#Minimap .highlights td.entry-name:hover{color:#fff;text-shadow:0 1px 0 #000}#Minimap .entry-color{background:#000000;height:26px;width:26px;display:inline-block;box-shadow:0 0 0 1px #421f09 inset,0 0 0 2px #976543 inset,0 0 0 3px #421f09 inset,0 0 1px 5px rgba(0,0,0,0.4) inset;text-shadow:1px 1px 0 #000;outline:none;border:none}#Minimap .entry-name{text-align:left;padding:0 10px}#Minimap .color-picker{height:30px;margin-top:11px}#Minimap .minimap-tooltip{position:absolute;width:440px;z-index:4000;padding:3px;background:url("data:image/png; base64,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") #45505c;transition:opacity .5s;top:20px;left:20px}#Minimap .minimap-tooltip.left{left:-410px}#Minimap .minimap-tooltip.top{top:-220px}#Minimap .minimap-tooltip .text span{width:100%;float:left;line-height:17px;font-size:13px;display:inline-block}#Minimap .minimap-tooltip .text-limited span{width:180px}',
			replaces: {
				locale: b,
				version: a.version,
				types: ["village", "character", "tribe"],
				colorPalette: a.colorPalette,
				defaultColors: a.defaultColors
			},
			onTabClick: function(a) {
				"minimap" === a ? p.$scrollbar.disable() : p.$scrollbar.enable()
			}
		}),
		q = new j("Minimap",{
			classHover: !1,
			classBlur: !1,
			onClick: function() {
				var b = a.getMapPosition();
				a.setCurrentPosition(b[0], b[1]),
				p.openWindow()
			}
		}),
		p.$scrollbar.disable(),
		r = $(p.$window),
		t = r.find(".item-input input"),
		u = r.find(".item-icon"),
		v = r.find(".item-name"),
		w = r.find(".item-color input"),
		x = r.find(".item-add span"),
		y = r.find(".color-picker"),
		z = r.find(".minimap-tooltip"),
		A = {
			villageName: z.find(".village-name"),
			villagePoints: z.find(".village-points"),
			playerName: z.find(".player-name"),
			playerPoints: z.find(".player-points"),
			tribeName: z.find(".tribe-name"),
			tribePoints: z.find(".tribe-points"),
			provinceName: z.find(".province-name")
		},
		s = {
			village: r.find(".village"),
			character: r.find(".character"),
			tribe: r.find(".tribe")
		},
		B = r.find(".cross"),
		C = r.find(".minimap"),
		a.setViewport(C[0]),
		a.setCross(B[0]),
		O(),
		K(),
		a.interfaceInitialized = !0,
		p
	};
	a.interface = function() {
		a.interface = U()
	}
})