var MePersonality = {};

var MP = MePersonality;

var requestCount = 0;

function debug(e) {
    addon.port.emit("debug", e);
}

var counter = 0;

function sendMessage(params, callback, multipleResponses) {
    var requestID = ('' + Math.random()).substr(2) + counter++;
    params._requestID = requestID;
    addon.port.emit("message", params);
    if (callback) {
        if (multipleResponses) {
            var _callback;
            _callback = function (params) {
                callback(params);
                if (params._removeCallback)
                    addon.port.removeListener("message" + requestID, _callback);
            };
            addon.port.on("message" + requestID, _callback);
        }
        else {
            addon.port.once("message" + requestID, callback);
        }
    }
}

function xhrGet(url, data, callback) {
    debug('get ' + url);
    var requestID = ('' + Math.random()).substr(2) + requestCount++;
    addon.port.emit("getRequest", {
        'url': url,
        'data': data,
        _requestID: requestID
    });
    addon.port.once("getResponse" + requestID, callback);
}

function xhrPost(url, data, callback) {
    var requestID = ('' + Math.random()).substr(2) + requestCount++;
    addon.port.emit("postRequest", {
        'url': url,
        'data': data,
        _requestID: requestID
    });
    addon.port.once("postResponse" + requestID, callback);
}

MePersonality.db = {
    clear:
		function (table, callback) {
		    if (!callback)
		        callback = function () { };
		    sendMessage({
		        type: 'db',
		        command: 'clear',
		        'table': table
		    }, callback);
		},
    get:
		function (table, key, callback) {
		    sendMessage({
		        type: 'db',
		        command: 'get',
		        'table': table,
		        'key': key
		    }, callback);
		},
    set:
		function (table, key, value, callback) {
		    if (!callback)
		        callback = function () { };
		    sendMessage({
		        type: 'db',
		        command: 'set',
		        'table': table,
		        'key': key,
		        'value': value
		    }, callback);
		},
    remove:
		function (table, key, callback) {
		    if (!callback)
		        callback = function () { };
		    sendMessage({
		        type: 'db',
		        command: 'remove',
		        'table': table,
		        'key': key
		    }, callback);
		},
    getTransaction:
		function (table, key, callback) {
		    sendMessage({
		        type: 'db',
		        command: 'getTransaction'
		    }, callback);
		}
};
MePersonality.xhr = {
    getResource:
        function (params, callback) {
            sendMessage({
                type: 'xhr',
                command: 'getResource',
                'params': params
            }, callback);
        },
    get:
        function (params, callback) {
            sendMessage({
                type: 'xhr',
                command: 'get',
                'params': params
            }, callback);
        },
    getJSON:
        function (params, callback) {
            sendMessage({
                type: 'xhr',
                command: 'getJSON',
                'params': params
            }, callback);
        },
    post:
        function (params, callback) {
            sendMessage({
                type: 'xhr',
                command: 'post',
                'params': params
            }, callback);
        }
};

//MePersonality.translator = new MePersonalityTranslator();
MePersonality.ngrams = new MePersonalityNgrams();
MePersonality.tagger = new MePersonalityTagger();
MePersonality.net = new MePersonalityNet();

var handleMessage = function (request, sendResponse) {
    if (request == 'ping') {
        sendResponse('pong');
    }
    else if (request.type == 'db') {
        // TODO: Deprecated
        // Database queries
        if (request.command == 'clear') {
            MePersonality.db.clear(request.table, sendResponse);
        }
        else if (request.command == 'get') {
            MePersonality.db.get(request.table, request.key, sendResponse);
        }
        else if (request.command == 'set') {
            MePersonality.db.set(request.table, request.key, request.value, sendResponse);
        }
        else if (request.command == 'remove') {
            MePersonality.db.remove(request.table, request.key, sendResponse);
        }
        else if (request.command == 'getTransaction') {
            MePersonality.db.getTransaction(sendResponse);
        }
    }
    else if (request.type == 'tagger') {
        // Tagger queries
        if (request.command == 'getTags') {
            MePersonality.tagger.getTags(request.params, sendResponse);
        }
        else if (request.command == 'extractArticle') {
            MePersonality.tagger.extractArticle(request.params, sendResponse);
        }
        else if (request.command == 'getWords') {
            MePersonality.tagger.getWords(request.params, sendResponse);
        }
        else if (request.command == 'getPOStags') {
            MePersonality.tagger.getPOStags(request.params, sendResponse);
        }
        else if (request.command == 'synsetRank') {
            MePersonality.tagger.synsetRank(request.params, sendResponse);
        }
        else if (request.command == 'reloadTagger') {
            MePersonality.tagger.reloadTagger(request.taggerId, sendResponse);
        }
        else if (request.command == 'removeTagger') {
            MePersonality.tagger.removeTagger(request.taggerId, sendResponse);
        }
    }
    else if (request.type == 'translator') {
        // Tagger queries
        if (request.command == 'translate') {
            debug('translating');
            MePersonality.translator.translate(request.text, function (params) {
                debug('translated');
                sendResponse(params);
            }, request.sourceLanguage, request.targetLanguage);
        }
    }
    else if (request.type == 'ngrams') {
        // Tagger queries
        if (request.command == 'getFrequency') {
            MePersonality.ngrams.getFrequency(request.word, sendResponse);
        }
    }
    else if (request.type == 'net') {
        // Net queries
        if (request.command == '_connect') {
            MePersonality.net._connect(request.params, sendResponse);
        }
        else if (request.command == 'connect') {
            MePersonality.net.connect(request.params, sendResponse);
        }
        else if (request.command == '_send') {
            MePersonality.net._send(request.params, sendResponse);
        }
        else if (request.command == 'send') {
            MePersonality.net.send(request.params, sendResponse);
        }
        else if (request.command == '_disconnect') {
            MePersonality.net._disconnect(request.params, sendResponse);
        }
        else if (request.command == 'disconnect') {
            MePersonality.net.disconnect(request.params, sendResponse);
        }
    }
}

addon.port.on("message", function (request) {
    handleMessage(request, function (data) {
        //debug("message" + request._requestID + ': ' + JSON.stringify(data));
        addon.port.emit("message" + request._requestID, data);
    });
});

addon.port.emit("hidden", 'loaded');
