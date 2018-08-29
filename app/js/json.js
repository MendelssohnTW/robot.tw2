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
			"title"							: "Configurações principais",
			"introducing"					: "Ativação e desativação dos módulos",
			"settings"						: "Configurações padrões",
			"settings_module"				: "Configurações dos módulos",
			"settings_main"					: "Configurações gerais",
			"state"							: "Ativação",
			"stopped"						: "Parado",
			"running"						: "Rodando",
			"paused"						: "Pausado",
			"module"						: "Módulo",
			"text_hotkey"					: "Atalho",
			"text_status"					: "Estado",
			"init_standard" 				: "Inicializar automático",
			"extension_disabled" 			: "desativado",
			"extension_enabled" 			: "ativado",
			"text_time_correction_command" 	: "Correção atual de tempo para comandos",
			"text_max_time_correction" 		: "Valor máximo para correção de tempo para comandos"
		}, 
		"headquarter": {
			"title"						: "Automatização do Quartel",
			"settings"					: "Configuração global",
			"settings_for_villages"		: "Configurações por aldeia",
			"init_standard" 			: "Inicialização automática",
			"headquarter"				: "Edificio principal",
			"text_interval_headquarter"	: "Tempo do ciclo",
			"text_reserva_food"			: "Reserva de provisões",
			"text_reserva_slots"		: "Quantidade de slots",
			"text_reserva_wood"			: "Reserva de madeira",
			"text_reserva_clay"			: "Reserva de argila",
			"text_reserva_iron"			: "Reserva de ferro",
			"academy"					: "Academia",
			"headquarter_running"		: "Estado atual do quartel",
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
			"time_interval_alert"		: "Intervalo de verificação",
			"select_all"				: "Selecionar todos",
			"remove_all"				: "Remover todos",
			"state"						: "Estado",
			"text_underattack"			: "Sob ataque",
			"init_standard" 			: "Inicialização automática",
			"settings_for_member" 		: "Configurações para os membros",
			"text_member" 				: "Membro",
			"text_points" 				: "Pontos",
			"text_villages" 			: "Aldeias",
			"text_ranking" 				: "Ranking"
		},
		"recon": {
			"archer"					: "Arqueiro",
			"doppelsoldner"				: "Berserker",
			"axe"						: "Viking",
			"sword"						: "Espada",
			"spear" 					: "Lanceiro",
			"knigth"		 			: "Paladino",
			"heavy_cavalry" 			: "Cavalaria pesada",
			"light_cavalry" 			: "Cavalaria leve",
			"mounted_archer" 			: "Arqueiro montado",
			"ram" 						: "Ariete",
			"catapult" 					: "Catapulta",
			"snob" 						: "Nobre",
			"trebuchet" 				: "Trabuco",
			"settings" 					: "Reconhecimento de unidades (Renomear comandos)",
			"introducing" 				: "Renomeação dos comandos",
			"rename_command"			: "Renomear comandos",
			"rename_snob"				: "Renomear somente nobres"

		},
		"farm": {
			"title"						: "Coleta de recursos",
			"wait_init"					: "Aguardando início do ciclo de Farm",
			"farm_init"					: "Ciclo de Farm iniciado",
			"farm_no_init"				: "Ciclo de Farm não iniciado. Término de farm inferior ao tempo mínimo do ciclo",
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
			"text_interval_recruit"		: "Tempo do ciclo",
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
		},
		"deposit": {
			"title"						: "Coleta de depósito",
			"settings"					: "Configurações para coleta do depósito",
			"text_interval_deposit"		: "Intervalo de verificação",
			"use_reroll_deposit"		: "Sortear novamente automático"
		},
		"notify": {
			"data_recon"				: "Robot TW2 - Banco de dados (RECON) atualizado, reative o módulo RECON",
			"data_headquarter"			: "Robot TW2 - Banco de dados (HEADQUARTER) atualizado, reative o módulo HEADQUARTER",
			"data_deposit"				: "Robot TW2 - Banco de dados (DEPOSIT) atualizado, reative o módulo DEPOSIT",
			"data_recruit"				: "Robot TW2 - Banco de dados (RECRUIT) atualizado, reative o módulo RECRUIT",
			"data_spy"					: "Robot TW2 - Banco de dados (SPY) atualizado, reative o módulo SPY",
			"data_farm"					: "Robot TW2 - Banco de dados (FARM) atualizado, reative o módulo FARM",
			"unity_select"				: "Selecione as unidades.",
			"date_error"				: "Data inferior ao tempo necessário de percurso"
		},
		"attack": {
			"text_date"					: "Data",
			"text_hour"					: "Hora",
			"text_ms"					: "Milisegundos",
			"text_full"					: "Enviar todas as unidades",
			"text_prog_full"			: "Programar hora de saída na origem",
			"text_prog"					: "Programar hora de chegada no alvo"
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
