define([
	"app.providers"
	], function (
			factories
	) {	
	factories.factory("map", ["tilesize", function (tilesize){
		var convert = function(ax, ay){
			var x = Math.round(ax * tilesize.sizeX);
			var y = Math.round(ay * tilesize.sizeY);
			return [x, y];
		},
		unconvert = function(ax, ay){
			var y = Math.trunc(ay / tilesize.sizeY);
			var ax = (y & 1 ? ax - (tilesize.sizeX * 0.5) : ax);
			var ay = y;

			var x = Math.trunc(ax / tilesize.sizeX)
			x = Math.round(x);
			return [x, y];
		},
		loadMap = function() {
			var setupGrid = function(len) {
				var i, t = 0,
				arr;

				for (i = 0, arr = []; i < len; i++) {
					arr[i] = null;
				}
				return arr.concat().map(function(elem) {
					return arr.concat();
				});
			};
			var map_chunk_size = tilesize.MAP_CHUNK_SIZE;
			var map_chunk_len = tilesize.MAP_CHUNK_LEN;
			var grid = setupGrid(map_chunk_len);
			for (var i = 0; i < map_chunk_len; i++){
				for (var j = 0; j < map_chunk_len; j++){
					grid[i][j] = {"x":map_chunk_size * i + map_chunk_size / 2, "y":map_chunk_size * j + map_chunk_size / 2}
					grid[i][j].villages = [];
				}
			};
			return {
				grid: grid
			};
		},
		data =  {
				srcX 		: undefined,
				srcY 		: undefined,
				centerX 	: undefined,
				centerY 	: undefined,
				zoom		: 1
		}, 
		setScreen = function (){
			var list = [];

//			var hX1 = Math.trunc(screen.minX / tilesize.sizeX / tilesize.MAP_CHUNK_SIZE);
//			var hX2 = Math.trunc(screen.maxX / tilesize.sizeX / tilesize.MAP_CHUNK_SIZE);
//			var hY1 = Math.trunc(screen.minY / tilesize.sizeY / tilesize.MAP_CHUNK_SIZE);
//			var hY2 = Math.trunc(screen.maxY / tilesize.sizeY / tilesize.MAP_CHUNK_SIZE);

//			hX1 < 0 ? hX1 = 0 : hX1 > 39 ? hX1 = 39 : hX1;
//			hX2 < 0 ? hX2 = 0 : hX2 > 39 ? hX2 = 39 : hX2;
//			hY1 < 0 ? hY1 = 0 : hY1 > 39 ? hY1 = 39 : hY1;
//			hY2 < 0 ? hY2 = 0 : hY2 > 39 ? hY2 = 39 : hY2;

			var hX1 = 0;
			var hX2 = (tilesize.MAP_SIZE / tilesize.MAP_CHUNK_SIZE) - 1;
			var hY1 = 0;
			var hY2 = (tilesize.MAP_SIZE / tilesize.MAP_CHUNK_SIZE) - 1;

			var grid = loadMap().grid;

			var listCoords = [];
			for(tx = hX1; tx <= hX2; tx++){
				for(ty = hY1; ty <= hY2; ty++){
					listCoords.push({
						x: grid[tx][ty].x,
						y: grid[tx][ty].y,
						dist: tilesize.MAP_CHUNK_SIZE
					});
				}
			}

			var maxX = angular.copy(listCoords).sort(function(a, b){return b.x - a.x}).slice(0, 1);
			var minX = angular.copy(listCoords).sort(function(a, b){return a.x - b.x}).slice(0, 1);
			var maxY = angular.copy(listCoords).sort(function(a, b){return b.y - a.y}).slice(0, 1);
			var minY = angular.copy(listCoords).sort(function(a, b){return a.y - b.y}).slice(0, 1);
			screen.boundMaxX = ((maxX[0].x + tilesize.MAP_CHUNK_SIZE / 2) * tilesize.sizeX);
			screen.boundMinX = ((minX[0].x - tilesize.MAP_CHUNK_SIZE / 2) * tilesize.sizeX);
			screen.boundMaxY = ((maxY[0].y + tilesize.MAP_CHUNK_SIZE / 2) * tilesize.sizeY);
			screen.boundMinY = ((minY[0].y - tilesize.MAP_CHUNK_SIZE / 2) * tilesize.sizeY);

			return listCoords;

		},
		screen = {
				width 			: window.outerWidth,
				height 			: window.innerHeight,
				maxX			: undefined,
				minX			: undefined,
				maxY			: undefined,
				minY			: undefined,
				marginOutX		: tilesize.sizeX * 10,
				marginOutY		: tilesize.sizeY * 10,
				boundMaxX		: undefined,
				boundMinX		: undefined,
				boundMaxY		: undefined,
				boundMinY		: undefined
		},
		proc = function(coordX, coordY){
			var ax = (coordY & 1 ? coordX + 0.5 : coordX);
			var ay = coordY;
			var arg = convert(ax, ay);

			data.srcX = arg[0] - (Math.ceil(screen.width / 2) / data.zoom);
			data.srcY = arg[1] - (Math.ceil(screen.height / 2) / data.zoom);

			data.centerX = arg[0];
			data.centerY = arg[1];

			screen.minX = Math.round(data.srcX - (screen.marginOutX));
			screen.maxX = Math.round(data.srcX + ((screen.width / data.zoom) + screen.marginOutX));
			screen.widthMarginX = screen.maxX - screen.minX;

			screen.minY = Math.round(data.srcY - (screen.marginOutY));
			screen.maxY = Math.round(data.srcY + ((screen.height / data.zoom) + screen.marginOutY));
			screen.heightMarginY = screen.maxY - screen.minY;
			return setScreen();
		};

		return{
			convert 		: convert,
			unconvert 		: unconvert,
			loadMap			: loadMap,
			data			: data,
			setScreen		: setScreen,
			screen			: screen,
			proc			: proc
		}


	}])
});