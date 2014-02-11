//<![CDATA[
var taggerList = {};
var baseUrl = 'http://brumo.fiit.stuba.sk/';
var t;

function loaded() {
    loadTaggerList();
}

function unloaded() {
}

function loadTaggerList() {
    $('#taggerList').html('');
    MP.xhr.getJSON(baseUrl + 'taggers.json', function (result) {
        var taggerList = result.researchTaggers || [];
        if (taggerList.length == 0) {
            $('#taggerList').html('<p>:( No public taggers found.</p>');
        }
        else {
            for (var i = 0; i < taggerList.length; ++i) {
                getTagger(taggerList[i]);
            }
        }
    })
	//.error(function (xhr, status, er) {
	//    $('#taggerList').html('<p>:( There was an error while retrieving the list of public taggers (Error: ' + er + ').</p>');
	//});
}

function getTagger(taggerName) {
    MP.xhr.getJSON(baseUrl + 'taggers/' + taggerName + '.json', function (taggerDetails) {
        var tagger = $('<p/>', {
            id: taggerName,
            class: 'extensionEntry'
        }).appendTo('#taggerList');
        $('<span/>', {
            text: taggerDetails.name,
            class: 'extensionName',
            click: function () {
                toggleViewTaggerInfo(taggerName);
            }
        }).appendTo(tagger)
		.css('cursor', 'pointer');
        var right = $('<span/>').appendTo(tagger)
		.css('float', 'right');
        $('<span/>', {
            id: taggerName + 'status',
            class: 'status'
        }).appendTo(right);
        $('<span/>', {
            class: 'button',
            text: 'Install',
            click: function () {
                installTagger(taggerName, taggerDetails, function () {
                    $('#' + taggerName + 'status').text('Tagger installed successfully');
                    clearTimeout(t);
                    t = setTimeout("$('#" + taggerName + "status').text('');", 5000);
                }, function (e) {
                    $('#' + taggerName + 'status').text(e.message);
                    clearTimeout(t);
                    t = setTimeout("$('#" + taggerName + "status').text('');", 5000);
                });
            }
        }).appendTo(right);
        var info = $('<div/>', {
            id: taggerName + 'info'
        }).appendTo(tagger)
		.css('height', 0)
		.css('display', 'none');
        $('<p/>', {
            text: 'Author: ' + taggerDetails.author
        }).appendTo(info);
        $('<p/>', {
            text: 'Version: ' + taggerDetails.version
        }).appendTo(info);
        $('<p/>', {
            text: 'Description: ' + taggerDetails.description
        }).appendTo(info);
    });
}

function toggleViewTaggerInfo(taggerName) {
    var tagger = $('#' + taggerName);
    if (tagger.attr('expanded') != 'true') {
        tagger.children().last().css('height', '100%')
		.css('display', 'inherit');
        tagger.attr('expanded', 'true');
    }
    else {
        tagger.children().last().css('height', 0)
		.css('display', 'none');
        tagger.attr('expanded', 'false');
    }
}

function installTagger(taggerName, taggerDetails, callback, onerror) {
    MP.xhr.get(baseUrl + 'taggers/' + taggerName + '.js', function (response) {
        taggerDetails.code = response.text;
        taggerDetails.enabled = true;
        addTagger('research' + taggerName, taggerDetails, callback, onerror);
    });
};

function addTagger(taggerId, taggerDetails, callback, onerror) {
    MP.db.get('taggers', 'list', function (taggerList) {
        if (!taggerList) taggerList = [];
        function loadTagger() {
            _sendMessage({
                type: 'tagger',
                command: 'loadTagger',
                'taggerId': taggerId
            }, function (params) {
                if (params.error && typeof (onerror) == 'function')
                    onerror(params.error);
                else if (params.success && typeof (callback) == 'function')
                    callback(params.success);
            });
        }
        MP.db.set('taggers', taggerId, taggerDetails, function () {
            for (var i = 0; i < taggerList.length; ++i) {
                if (taggerList[i] == taggerId) {
                    // Tagger already exists
                    loadTagger();
                    return;
                }
            }
            taggerList.push(taggerId);
            MP.db.set('taggers', 'list', taggerList, function () {
                loadTagger();
            });
        });
    });
}

//]]>