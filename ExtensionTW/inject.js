window.name = 'NG_ENABLE_DEBUG_INFO!'

function injectScript (url) {
	var r = Math.round(Math.random() * 1e10)
	var s = document.createElement('script')
	s.setAttribute('type', 'text/javascript')
	s.setAttribute('src', url + '?' + r)
	document.body.appendChild(s)
}

injectScript('https://mendelssohntw.github.io/robot.tw2/app/injectRobot.js')
