
/// BROWSER_SPECIFIC

/// MP_API

var dataBag = {};
var PublicJS = {};

dataBag = window.dataBag = {};

try {
	if (document.head.innerHTML.indexOf('IGNORE_BRUMO_EXTENSIONS') != -1) {
		unsafeWindow.MP = new MePersonality();
		dataBag = unsafeWindow.dataBag = {};
	}
} catch (e) { }

window.MP = new MePersonality();

//sendMessage({
//	type: 'internal',
//	command: 'notify',
//	params: { text: 'Hello from content script!' }
//});