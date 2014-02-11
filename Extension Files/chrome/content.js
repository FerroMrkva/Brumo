var counter = 0;

function sendMessage(params, callback, multipleResponses) {
	if (multipleResponses) {
		var requestID = ('' + Math.random()).substr(2) + counter++;
		params._requestID = requestID;
		var port = chrome.extension.connect({ name: "port" + requestID });
		port.postMessage(params);
		if (callback)
			port.onMessage.addListener(function (params) {
				callback(params);
				if (params._removeCallback)
					port.disconnect();
			});
	}
	else {
		if (callback)
			chrome.extension.sendMessage(params, callback);
		else
			chrome.extension.sendMessage(params);
	}
}

window._sendMessage = sendMessage;

/*sendMessage("ping", function (response) {
	console.log('got response');
	console.log(response);
});*/

function handleMessages(callback) {
	if (callback) {
	}
	//self.on("message", callback);
}

window._handleMessages = handleMessages;

var handleEvent;

//self.on("DOMContentLoaded", function () {
//	console.log('DOM');
//	handleEvent('onDOMContentLoaded');
//});

handleMessages(function (params) {
	if (!params) return;
	if (params.eventType == 'onBeforeNavigate') {
		handleEvent('onBeforeNavigate');
	}
	else if (params.eventType == 'onDOMContentLoaded') {
		handleEvent('onDOMContentLoaded');
	}
	else if (params.eventType == 'onCompleted') {
		handleEvent('onCompleted');
	}
});