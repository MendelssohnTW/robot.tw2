var elements_sockets = document.querySelectorAll('[ng-controller=ModalSocketController]');
var elements_app = document.querySelectorAll('[ng-controller=AppController]');

if(elements_sockets && elements_sockets.length){
	window.location.reload()
} else if(!elements_app || !elements_app.length){
	window.location.reload()
}	

