var counter = 0;

function sendMessage(params, callback, multipleResponses) {
	var requestID = ('' + Math.random()).substr(2) + counter++;
	params._requestID = requestID;
	self.postMessage(params);
	if (callback) {
		if (multipleResponses) {
			var _callback;
			_callback = function (params) {
				callback(params);
				if (params._removeCallback)
					self.port.removeListener("message" + requestID, _callback);
			};
			self.port.on("message" + requestID, _callback);
		}
		else {
			self.port.once("message" + requestID, callback);
		}
	}
}

unsafeWindow._sendMessage = sendMessage;

/*sendMessage("ping", function (response) {
	console.log('got response');
	console.log(response);
});*/

function handleMessages(callback) {
	if (callback)
		self.on("message", callback);
}

unsafeWindow._handleMessages = handleMessages;

var handleEvent;

self.on("DOMContentLoaded", function () {
	console.log('DOM');
	handleEvent('onDOMContentLoaded');
});

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