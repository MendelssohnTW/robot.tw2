window.name = 'NG_ENABLE_DEBUG_INFO!'
	
var checkIfLoadedInject = function checkIfLoadedInject(callback) { //define o ponto de injeção
    var count = 0;
    var check = function check() {
        if (document.querySelector('body[ng-controller="AppController"]')) {
            callback();
        } else {
            setTimeout(check, 1000);
        }
    }
    check();
};

function injectScript (url) {
	var r = Math.round(Math.random() * 1e10)
	var s = document.createElement('script')
	s.setAttribute('type', 'text/javascript')
	s.setAttribute('src', url + '?' + r)
	document.body.appendChild(s)
}

setTimeout(function () {
    
	checkIfLoadedInject(function () {
    	injectScript('https://robot.tw2/1.0.0/injectRobot.js')
    });
}, 1000);