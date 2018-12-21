define([
	"app.providers"
	], function (
			providers
	) {	
	providers.factory("eventTypeProvider", function routeProvider(){
		return {
			'SHOW_CONTEXT_MENU'						: 'Internal/ContextMenuShow',
			'MOVE_CONTEXT_MENU'						: 'Internal/ContextMenuMove',
			'DESTROY_CONTEXT_MENU'					: 'Internal/ContextMenuDestroy',
			'MAP_UPDATE_OPERATION'					: 'Internal/Operation/MapUpdateOperation',
			'CTRL_UPDATE_OPERATION'					: 'Internal/Operation/CtrlUpdateOperation',
			'MENU_CTRL_UPDATE_OPERATION'					: 'Internal/Operation/MenuCtrlUpdateOperation',

			'UPDATE_OPT'							: 'Internal/Operation/UpdateOpt',
			'UPDATE_COMMANDS'						: 'Internal/Operation/UpdateCommands',
			'UPDATE_WORLD'							: 'Internal/World/UpdateWorld',
			'MAP_UPDATE_SQUADRON'					: 'Internal/Squadron/MapUpdateSquadron',
			'CTRL_UPDATE_SQUADRON'					: 'Internal/Squadron/CtrlUpdateSquadron',
			'MENU_CTRL_UPDATE_SQUADRON'				: 'Internal/Squadron/MenuCtrkUpdateSquadron',

			'UPDATE_VILLAGES'						: 'Internal/Village/UpdateVillages',
			'NOTIFICATION'							: 'Internal/Notification'
		};
	})

});