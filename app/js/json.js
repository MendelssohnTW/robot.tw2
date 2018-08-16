define("robotTW2/json", function() {
	var get = function(lang){
		return lang ? require("robotTW2/" + lang): require("robotTW2/pt_br") 
	}
	return {get: get}
})
,
define("robotTW2/pt_br", function() {
	return {
		"OK"				: "Ok",
		"CANCEL"			: "Cancelar",
		"CONFIRM"			: "Confirmar",
		"SAVE"				: "Salvar",
		"DELETE"			: "Excluir",
		"LEVEL"				: "Ní­vel",
		"CLOSE"				: "Fechar",
		"RESTORE"			: "Restaurar",
		"CLEAR"				: "Limpar",
		"START"				: "Iniciar",
		"STOP"				: "Parar",
		"PAUSE"				: "Pausar",
		"RESUME"			: "Retomar",
		"YES"				: "Sim",
		"NO"				: "Não",
		"main": {
			"title"						: "Configurações principais",
			"introducing"				: "Ativação e desativação dos módulos",
			"settings"					: "Configurações padrões",
			"state"						: "Ativado/desativado",
			"stopped"					: "Parado",
			"running"					: "Rodando",
			"paused"					: "Pausado",
			"module"					: "Módulo",
			"text_hotkey"				: "Atalho",
			"text_status"				: "Estado",
			"init_standard" 			: "Inicialização automática",
			"extension_disabled" 		: "desativado",
			"extension_enabled" 		: "ativado"
		}, 
		"headquarter": {
			"title"						: "Automatização do Quartel",
			"settings"					: "Configuração global",
			"settings_for_villages"		: "Configurações por aldeia",
			"init_standard" 			: "Inicialização automática",
			"headquarter"				: "Edificio principal",
			"time_interval_headquarter"	: "Intervalo entre ciclos",
			"academy"					: "Academia",
			"headquarter"				: "Edificio principal",
			"farm"						: "Fazenda",
			"warehouse"					: "Armazém",
			"barracks"					: "Quartel",
			"rally_point"				: "Ponto de encontro",
			"timber_camp"				: "Bosque",
			"iron_mine"					: "Mina de Ferro",
			"clay_pit"					: "Poço de Argila",
			"wall"						: "Muralha",
			"hospital"					: "Hospital",
			"preceptory"				: "Salão das ordens",
			"church"					: "Igreja",
			"chapel"					: "Capela",
			"statue"					: "Estátua",
			"market"					: "Mercado",
			"tavern"					: "Taverna",
			"priority"					: "Sequência de prioridades",
			"levels"					: "Limite de níveis",
			"ativate"					: "Estado atual",
			"introducing"				: "Você pode criar customizações por aldeias. Inicialmente serão configuradas com as configurações globais",
			"tooltip_input"				: "Tempo mínimo de 30 minutos",
			"tooltip_button"			: "Selecionar edifício",
		},
		"alert": {
			"title"						: "Alerta de ataques a membros",
			"introducing"				: "Ativar/Desativar alerta de ataques para membros",
			"state"						: "Estado",
			"text_underattack"			: "Sob ataque",
			"init_standard" 			: "Inicialização automática",
			"settings_for_member" 			: "Configurações para os membros",
			"text_member" 				: "Membro",
			"text_points" 				: "Pontos",
			"text_villages" 			: "Aldeias",
			"text_ranking" 				: "Ranking"
		},
		"recon": {
			"archer"					: "arqueiro",
			"doppelsoldner"				: "berserker",
			"axe"						: "viking",
			"sword"						: "espada",
			"spear" 					: "lanceiro",
			"knigth"		 			: "paladino",
			"heavy_cavalry" 			: "cavalaria pesada",
			"light_cavalry" 			: "cavalaria leve",
			"mounted_archer" 			: "arqueiro montado",
			"ram" 						: "ariete",
			"catapult" 					: "catapulta",
			"snob" 						: "nobre",
			"trebuchet" 				: "trabuco",
			"title" 					: "Reconhecimento de unidades",
			"introducing" 				: "Renomeação dos comandos",
			"rename_command"			: "Renomear comandos",
			"rename_snob"				: "Renomear somente nobres"

		},
		"farm": {
			"title"						: "Coleta de recursos",
			"wait_init"					: "Aguardando início do ciclo de Farm",
			"farm_init"					: "Ciclo de Farm iniciado",
			"farm_no_init"				: "Ciclo de Farm não iniciado. Término de farm inferior ao tempo mínimo de ciclo",
			"farm_running"				: "Estado atual do processamento de farm",
			"time_max"					: "Tempo máximo de percurso",
			"init_hour"					: "Hora de início",
			"terminate_hour"			: "Hora de término",
			"time_cicle"				: "Tempo do ciclo de farm",
			"init_date"					: "Data de início",
			"terminate_date"			: "Data de término",
			"text_cmd_max"				: "Limite de comandos",
			"text_min_point"			: "Pontuação mínima",
			"text_max_point"			: "Pontuação máxima",
			"exceptions"				: "Lista de excessão",
			"villages_selections"		: "Ativação / desativação"

		},
		"recruit": {
			"title"						: "Recrutamento de tropas",
			"settings"					: "Configurações para recrutamento de tropas",
			"recruit_running"			: "Estado atual do recrutamento",
			"text_interval_recruit"		: "Tempo de ciclo em horas",
			"text_reserva_food"			: "Reserva de provisões",
			"text_reserva_slots"		: "Quantidade de slots",
			"text_reserva_wood"			: "Reserva de madeira",
			"text_reserva_clay"			: "Reserva de argila",
			"text_reserva_iron"			: "Reserva de ferro",
			"text_spear"				: "Lanceiro",
			"text_archer"				: "Arqueiro",
			"text_axe"					: "Viking",
			"text_sword"				: "Espada",
			"text_catapult"				: "Catapulta",
			"text_heavy_cavalry"		: "Cavalaria pesada",
			"text_light_cavalry"		: "Cavalaria leve",
			"text_mounted_archer"		: "Arqueiro montado",
			"text_ram"					: "Ariete",
			"groups_selection"			: "Seleção de grupo",
			"unit_settings"				: "Unidades do grupo"

		}
	}
})
,
require(["helper/i18n", "robotTW2/json"], function(helper, json) {
	var lang = navigator.language.toLowerCase();

	if (lang.length === 2) {
		lang += "_" + lang;
	} else {
		lang = lang.replace("-", "_");
	}

	var jsont = json.get(lang)
	helper.setJSON(jsont);
})
