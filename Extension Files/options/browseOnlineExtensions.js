//<![CDATA[
var extList = {};
var baseUrl = 'http://brumo.fiit.stuba.sk/';
var t;

function loaded() {
    loadExtList();
}

function unloaded() {
}

function loadExtList() {
    $('#extensionList').html('');
    MP.xhr.getJSON(baseUrl + 'extensions/extensions.json', function (result) {
        var extList = result.researchExtensions || [];
        if (extList.length == 0) {
            $('#extensionList').html('<p>:( No public extensions found.</p>');
        }
        else {
            for (var i = 0; i < extList.length; ++i) {
                getExtension(extList[i]);
            }
        }
    })
    //.error(function (xhr, status, er) {
    //    $('#extensionList').html('<p>:( There was an error while retrieving the list of public extensions (Error: ' + er + ').</p>');
    //});
}

function getExtension(extName) {
    MP.xhr.getJSON(baseUrl + 'extensions/' + extName + '/manifest.json', function (extDetails) {
        var ext = $('<p/>', {
            id: extName,
            class: 'extensionEntry'
        }).appendTo('#extensionList');
        $('<span/>', {
            text: extDetails.name,
            class: 'extensionName',
            click: function () {
                toggleViewExtensionInfo(extName);
            }
        }).appendTo(ext)
		.css('cursor', 'pointer');
        var right = $('<span/>').appendTo(ext)
		.css('float', 'right');
        $('<span/>', {
            id: extName + 'status',
            class: 'status'
        }).appendTo(right);
        $('<span/>', {
            class: 'button',
            text: 'Install',
            click: function () {
                installExtension(extName, extDetails, function () {
                    $('#' + extName + 'status').text('Extension installed successfully');
                    clearTimeout(t);
                    t = setTimeout("$('#" + extName + "status').text('');", 5000);
                }, function (e) {
                    $('#' + extName + 'status').text(e.message);
                    clearTimeout(t);
                    t = setTimeout("$('#" + extName + "status').text('');", 5000);
                });
            }
        }).appendTo(right);
        var info = $('<div/>', {
            id: extName + 'info'
        }).appendTo(ext)
		.css('height', 0)
		.css('display', 'none');
        $('<p/>', {
            text: 'Author: ' + extDetails.author
        }).appendTo(info);
        $('<p/>', {
            text: 'Version: ' + extDetails.version
        }).appendTo(info);
        $('<p/>', {
            text: 'Description: ' + extDetails.description
        }).appendTo(info);
    });
}

function toggleViewExtensionInfo(extName) {
    var ext = $('#' + extName);
    if (ext.attr('expanded') != 'true') {
        ext.children().last().css('height', '100%')
		.css('display', 'inherit');
        ext.attr('expanded', 'true');
    }
    else {
        ext.children().last().css('height', 0)
		.css('display', 'none');
        ext.attr('expanded', 'false');
    }
}

function installExtension(extName, extDetails, callback, onerror) {
    var scripts = extDetails.scripts || [];
    var code = "";
    extDetails.enabled = true;
    (function rec(i) {
        if (i == scripts.length) {
            extDetails.code = code;
            if (extDetails.options) {
                MP.xhr.get(baseUrl + 'extensions/' + extName + '/' + extDetails.options, function (response) {
                    extDetails.html = response.text;
                    addExtension('research' + extName, extDetails, callback, onerror);
                });
            } else {
                addExtension('research' + extName, extDetails, callback, onerror);
            }
            return;
        }
        MP.xhr.get(baseUrl + 'extensions/' + extName + '/' + scripts[i], function (response) {
            code += response.text + '\n';
            rec(i + 1);
        });
    })(0);
};

function addExtension(extId, extDetails, callback, onerror) {
    MP.db.get('extensions', 'list', function (extList) {
        if (!extList) extList = [];
        function loadExt() {
            _sendMessage({
                type: 'ext',
                command: 'loadExtension',
                'extId': extId
            }, function (params) {
                if (params.error && typeof (onerror) == 'function')
                    onerror(params.error);
                else if (params.success && typeof (callback) == 'function')
                    callback(params.success);
            });
        }
        MP.db.set('extensions', extId, extDetails, function () {
            for (var i = 0; i < extList.length; ++i) {
                if (extList[i] == extId) {
                    // Extension already exists
                    loadExt();
                    return;
                }
            }
            extList.push(extId);
            MP.db.set('extensions', 'list', extList, function () {
                loadExt();
            });
        });
    });
}

//]]>