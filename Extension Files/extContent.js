(function () {
    if (window.frameElement != null) return;

    var extensions = {};
    var loaded = 0;
    var eventOccured = {};
    var _publicJS = {};

    sendMessage({ command: 'getExtensions' }, function (response) {
        console.log('Extensions loaded.');
        extensions = response;
        loaded = 1;
    });

    var BrumoConsole = function (extId) {
        if (!extId)
            extId = "Brumo";
        else
            extId = "Brumo " + extId;
        this.log = function (msg) {
            if (typeof (msg) != "string")
                msg = JSON.stringify(msg);
            console.log(extId + " (" + (new Date()).toJSON() + "): " + msg);
        }
        if (console.error)
            this.error = function (msg) {
                if (typeof (msg) != "string")
                    msg = JSON.stringify(msg);
                console.error(extId + " (" + (new Date()).toJSON() + "): " + msg);
            }
        if (console.warn)
            this.warn = function (msg) {
                if (typeof (msg) != "string")
                    msg = JSON.stringify(msg);
                console.warn(extId + " (" + (new Date()).toJSON() + "): " + msg);
            }
    }

    var _console = console;

    var BrumoCom = function (extId) {
        this.send = function (params, callback) {
            var _params = {
                'extId': extId,
                'params': params
            };
            sendMessage({
                type: 'com',
                command: 'send',
                'params': _params
            }, callback);
        }
    }

    function runExtensions(eventType, now) {
        if (!loaded) {
            setTimeout(function () {
                runExtensions(eventType, now);
            }, 1);
            return;
        }
        if (eventOccured[eventType])
            return;
        eventOccured[eventType] = 1;
        _console.log('Running ' + eventType + ' callbacks...');
        for (var ext in extensions) {
            if (!_publicJS[ext])
                _publicJS[ext] = {};
            try {
                var console = new BrumoConsole(ext);
                MePersonality.com = new BrumoCom(ext);
                eval('(function(){var extCode=function(){' + extensions[ext] +
					'}; var x=new extCode(); var publicJS = _publicJS["' + ext + '"]; if (typeof(x.' + eventType
							+ ')=="function") x.' + eventType + '(now); })();');
            } catch (e) {
                _console.error(e.message);
            }
        }
    }

    handleEvent = function (ev) {
        var now = new Date();
        //console.log('handling event ' + ev);
        if (ev == 'onBeforeNavigate') {
            runExtensions('onBeforeNavigate', now);
        }
        else if (ev == 'onDOMContentLoaded') {
            runExtensions('onDOMContentLoaded', now);
            //sendMessage({ type: 'indexer', command: 'updateIndexer' });
            //sendMessage({ type: 'tagger', command: 'getTags', url: location.href }, function (params) {
            //	console.log(JSON.stringify(params));
            //});
        }
        else if (ev == 'onCompleted') {
            runExtensions('onCompleted', now);
        }
        else if (ev == 'onUnload') {
            runExtensions('onUnload', now);
        }
    }

    handleEvent('onDOMContentLoaded'); // manually triggered

    $(window).unload(function () {
        handleEvent('onUnload');
    });
})();