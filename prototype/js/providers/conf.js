define([
	"app.providers"
	], function (
			providers
	) {

	providers.factory("conf", function (){
		return{
			VILLAGE_SELECTED		: undefined,
			VILLAGE_FOCUSED			: undefined,
			LISTA_LEVEL_VILLAGE		: [],
			LISTA_LEVEL_BARBARIAN	: [],
			CELL_WIDTH				: 136,
			CELL_HEIGHT				: 98,
			USER					: {},
			WORLD					: {},
			TRIBE					: {},
			LIMITE_DATA_EXCLUDE		: 172800000, // 2 dias
			LIMITE_DATA_EXPIRED		: 172800000, // 2 dias
			FORMAT_DATE				: "dd/MM/yyyy",
			FORMAT_DATETIME			: "dd/MM/yyyy HH:mm:ss",
			LIMIT_RESERVAS			: 2

		}

	})
});