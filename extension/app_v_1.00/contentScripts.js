var elements_sockets = document.querySelectorAll('[ng-controller=ModalSocketController]');
var elements_app = document.querySelectorAll('[ng-controller=AppController]');
var element_load = document.getElementsByClassName("first-load visible")

if((elements_sockets && elements_sockets.length) || (element_load && element_load.lenght)){
	window.location.reload()
} else if(!elements_app || !elements_app.length){
	window.location.reload()
}	

