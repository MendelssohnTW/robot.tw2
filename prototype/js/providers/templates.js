define([
	"app.providers",
	"base"
	], function (
			configs,
			base
	) {	
	configs.factory("templates", ["conf", function (conf){
		var lista_level_village = {};
		var lista_level_barbarian = {};
		var village_selected;
		var village_focused;

		var src = base.URL_BASE + '/resources/imgs/day.png';
		img = new Image();   // Create new img element

		img.onload = function() {
			var sw = conf.CELL_WIDTH,
			sh = conf.CELL_HEIGHT,


			level_village = {
					level_0	: {
						x	: 275,
						y	: 1030
					},
					level_1	: {
						x	: 411,
						y	: 1030
					},
					level_2	: {
						x	: 547,
						y	: 1030
					},
					level_3	: {
						x	: 683,
						y	: 1030
					},
					level_4	: {
						x	: 819,
						y	: 1030
					},
					level_5	: {
						x	: 955,
						y	: 1030
					}
			};

			var level_barbarian = {
					level_0	: {
						x	: 544,
						y	: 1236
					},
					level_1	: {
						x	: 680,
						y	: 1236
					},
					level_2	: {
						x	: 816,
						y	: 1236
					},
					level_3	: {
						x	: 952,
						y	: 1236
					}
			};


			Object.keys(level_village).forEach(
					function(key){
						Promise.all([key, createImageBitmap(img, level_village[key].x, level_village[key].y, sw, sh)])
						.then(function(sprites) {
							var name = sprites[0];
							var bitmap = sprites[1];
							conf.LISTA_LEVEL_VILLAGE[sprites[0]] = bitmap;
						});

					});

			Object.keys(level_barbarian).forEach(
					function(key){
						Promise.all([key, createImageBitmap(img, level_barbarian[key].x, level_barbarian[key].y, sw, sh)])
						.then(function(sprites) {
							var name = sprites[0];
							var bitmap = sprites[1];
							conf.LISTA_LEVEL_BARBARIAN[sprites[0]] = bitmap;
						});

					});

			Promise.all([createImageBitmap(img, 136, 1040, sw, sh)])
			.then(function(sprites) {
				conf.VILLAGE_SELECTED = sprites[0];
			});

			Promise.all([createImageBitmap(img, 0, 345, 204, sh)])
			.then(function(sprites) {
				conf.VILLAGE_FOCUSED = sprites[0];
			});
		},
		getStyle = function getStyle (affiliation){
			var style = "#000000";
			if (affiliation == "tribe"){
				style = "#9B30FF";
			} else {
				if (affiliation == "ally"){
					style = "#4876FF";
				} else {
					if (affiliation == "enemy"){
						style = "#FF0000";
					} else {
						if (affiliation == "barbarian"){
							style = "#698B69";
						} else {
							if (affiliation == "own"){
								style = "#FFFF00";	
							} else {
								style = "#996600";
							}
						}
					}
				}
			};
			return style;
		},
		getLevel = function getLevel (village){
			var affiliation = village.affiliation,
			points = village.points,
			village_level_0_points = 2000,
			village_level_1_points = 4000,
			village_level_2_points = 6000,
			village_level_3_points = 8000,
			village_level_4_points = 10000,

			barbara_level_0_points = 700,
			barbara_level_1_points = 1400,
			barbara_level_2_points = 2800;

			var src_level_bitmap = undefined;
			if (affiliation != "barbarian"){
				if (points >= 0 && points < village_level_0_points) {
					src_level_bitmap = conf.LISTA_LEVEL_VILLAGE.level_0;
				} else {
					if (points >= village_level_0_points && points < village_level_1_points) {
						src_level_bitmap = conf.LISTA_LEVEL_VILLAGE.level_1;
					} else {
						if (points >= village_level_1_points && points < village_level_2_points) {
							src_level_bitmap = conf.LISTA_LEVEL_VILLAGE.level_2;
						} else {
							if (points >= village_level_2_points && points < village_level_3_points) {
								src_level_bitmap = conf.LISTA_LEVEL_VILLAGE.level_3; 
							} else {
								if (points >= village_level_3_points && points < village_level_4_points) {
									src_level_bitmap = conf.LISTA_LEVEL_VILLAGE.level_4;
								} else {
									if (points >= village_level_4_points) {
										src_level_bitmap = conf.LISTA_LEVEL_VILLAGE.level_5;
									}
								}
							}
						}
					}
				}
			} else {
				if (points >= 0 && points < barbara_level_0_points) {
					src_level_bitmap = conf.LISTA_LEVEL_BARBARIAN.level_0;
				} else {
					if (points >= barbara_level_0_points && points < barbara_level_1_points) {
						src_level_bitmap = conf.LISTA_LEVEL_BARBARIAN.level_1;
					} else {
						if (points >= barbara_level_1_points && points < barbara_level_2_points) {
							src_level_bitmap = conf.LISTA_LEVEL_BARBARIAN.level_2;
						} else {
							if (points >= barbara_level_2_points) {
								src_level_bitmap = conf.LISTA_LEVEL_BARBARIAN.level_3;
							}
						}
					};
				}
			};
			return src_level_bitmap;
		},
		getStyleSquad = function (village){
			return "#2EFE2E";	
		};



		img.src = src;

		return{
			getStyle				: getStyle,
			getStyleSquad			: getStyleSquad,
			getLevel				: getLevel
		}

	}])
});