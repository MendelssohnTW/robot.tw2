define([
	"app.providers"
	], function (
			factories
	) {	
	factories.factory("tilesize", ["conf", function (conf){
		var GRAU = Math.atan(Math.tan(23/98)) / Math.PI*180,
		MAP_CHUNK_SIZE = 100,
		MAP_SIZE = 1E3,
		MAP_CHUNK_LEN = MAP_SIZE / MAP_CHUNK_SIZE,
		RATIO = 98/136,
		ANGLE = 23/(136/2),
		CELL_COUNT = Math.pow(MAP_SIZE, 2),
		x = conf.CELL_WIDTH,
		y = x * RATIO,
		tri = ((Math.atan(Math.tan(ANGLE)) / Math.PI*180) * Math.PI / 180) * x / 2,
		ratioY = 1 - (tri / y),
		sizeX = x,
		sizeY = y * ratioY;
		MAP_WIDTH = MAP_SIZE * sizeX,
		MAP_HEIGHT = MAP_SIZE * sizeY,	
		BG_WIDTH = 2720,
		BG_HEIGHT = Math.floor(BG_WIDTH * sizeY / y),
		village_scale = Math.max(x * MAP_SIZE / BG_WIDTH, y  * MAP_SIZE/ BG_HEIGHT),

		shape = [
			[0, tri],
			[0, y - tri],
			[x / 2, y],
			[x, y - tri],
			[x, tri],
			[x / 2, 0]
			],

			maxVertDistance = Math.sqrt(Math.max.apply(Math, shape.map(function (vert, i, arr, x, y) {
				i = ++i % arr.length;
				return (x = vert[0] - arr[i][0]) * x +  (y = vert[1] - arr[i][1]) * y;
			})));

		return {
			GRAU				: GRAU,
			RATIO				: RATIO,
			MAP_SIZE			: MAP_SIZE,
			MAP_CHUNK_SIZE		: MAP_CHUNK_SIZE,
			MAP_WIDTH			: MAP_WIDTH,
			MAP_HEIGHT			: MAP_HEIGHT,
			MAP_CHUNK_LEN		: MAP_CHUNK_LEN,
			CELL_COUNT			: CELL_COUNT,
			sizeX				: sizeX, // width
			sizeY				: sizeY, // height
			x					: x,
			y					: y,
			shape				: shape,
			BG_WIDTH			: BG_WIDTH,
			BG_HEIGHT			: BG_HEIGHT,
			village_scale		: village_scale
		}; 
	}])
});