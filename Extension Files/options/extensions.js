//<![CDATA[
var extCount;

function loaded() {
    $('#addExtension').click(addExtension);
    $('#browseOnlineExtensions').click(browseOnlineExtensions);
    loadExtList();
}

function unloaded() {
}

function loadExtList() {
    $('#extensionList').html('');
    $('#extensionList').sortable({ axis: "y", containment: "obsah" });
    $('#extensionList').disableSelection();
    MP.db.get('extensions', 'list', function (extList) {
        if (!extList) extList = [];
        extCount = extList.length;
        for (var i = 0; i < extCount; ++i) {
            addVisualItem(extList[i]);
        }
        if (extList.length == 0) {
            $('#extensionList').html('<p>:( You have no extensions installed.</p>');
        }
    });
}

function saveOrder(item) {
    var group = item.toolManDragGroup;
    var list = group.element.parentNode;
    var id = list.getAttribute("id");
    if (id == null) return;
    group.register('dragend', function () {
        var extList = [];
        for (var i = 0; i < list.children.length; ++i) {
            var id = list.children[i].children[0].children[0].id;
            extList.push(JSON.parse(id));
        }
        MP.db.set('extensions', 'list', extList);
    });
}

function addVisualItem(extId) {
    MP.db.get('extensions', extId, function (extDetails) {
        if (!extDetails) {
            console.log('listing ' + extId + ' extension');
        }
        var ext = $('<p/>', {
            id: extId,
            class: 'extensionEntry'
        }).appendTo('#extensionList');
        $('<span/>', {
            id: extId + 'name',
            class: 'extensionName',
            text: extDetails.name,
            click: function () {
                toggleViewExtensionInfo(extId);
            }
        }).appendTo(ext)
		.css('cursor', 'pointer')
		.css('opacity', extDetails.enabled ? 1 : 0.75);
        var right = $('<span/>').appendTo(ext)
		.css('float', 'right');
        // checkbox enable
        $('<input/>', {
            id: 'enabled' + extId,
            type: 'checkbox'
        }).appendTo(right)
		.prop('checked', extDetails.enabled)
		.click(function () {
		    toggleDisableExtension(extId, function () {
		        var enabled = $('#enabled' + extId).prop('checked');
		        $('#' + extId + 'status').text(enabled ? 'Enabled' : 'Enable');
		        $('#' + extId + 'name').css('opacity', enabled ? 1 : 0.75);
		    });
		});
        // checkbox enable label
        $('<span/>', {
            id: extId + 'status',
            class: 'status',
            text: extDetails.enabled ? 'Enabled' : 'Enable'
        }).appendTo(right)
		.css('min-width', '100px');
        if ((extId + '').indexOf('research') != 0) {
            // cannot edit research extension
            $('<span/>', {
                class: 'button',
                text: 'Edit',
                click: function () {
                    editExtension(extId);
                }
            }).appendTo(right);
        }
        if (extDetails.html) {
            // have the old options page
            $('<span/>', {
                class: 'button',
                text: 'Options',
                click: function () {
                    viewOptions(extId, extDetails);
                }
            }).appendTo(right);
        }
        else if (extDetails.files) {
            for (var i = 0; i < extDetails.files.length; ++i) {
                if (extDetails.files[i].role == 'options page') {
                    // have the new options page
                    $('<span/>', {
                        class: 'button',
                        text: 'Options',
                        click: function () {
                            viewOptions(extId, extDetails);
                        }
                    }).appendTo(right);
                    break;
                }
            }
        }
        // add remove button
        $('<span/>', {
            class: 'removeButton',
            text: 'Remove',
            click: function () {
                dialog({
                    'content': 'Do you really want to remove "' + extDetails.name + '"?',
                    'buttons': ['Yes', 'No']
                }, function (response) {
                    if (response.Yes) {
                        _sendMessage({
                            'type': 'ext',
                            'command': 'removeExtension',
                            'extId': extId
                        }, function () {
                            $('#' + extId).remove();
                            extCount--;
                            if (!extCount) {
                                $('#extensionList').html('<p>:( You have no extensions installed.</p>');
                            }
                        });
                    }
                });
            }
        }).appendTo(right);
        // extension details (author, version, description)
        var info = $('<div/>', {
            id: extId + 'info'
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
        $('#extensionList').sortable('refresh');
    });
}

function toggleDisableExtension(extId, callback) {
    MP.db.get('extensions', extId, function (extDetails) {
        extDetails.enabled = $('#enabled' + extId).prop('checked');
        MP.db.set('extensions', extId, extDetails, function () {
            _sendMessage({
                type: 'ext',
                command: 'loadExtension',
                'extId': extId
            }, callback);
        });
    });
}

function toggleViewExtensionInfo(extId) {
    var ext = $('#' + extId);
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

function viewOptions(extId, extDetails) {
    if (extDetails.html) {
        viewContent({ 'uri': extId + 'options.html', 'html': extDetails.html }, extDetails.name);
        return;
    }
    var scripts = '';
    var html = '';
    for (var i = 0; i < extDetails.files.length; ++i) {
        if (extDetails.files[i].role == 'options page') {
            html = extDetails.files[i].content;
        }
        else if (extDetails.files[i].role == 'options script') {
            scripts += '<scri' + 'pt>' + extDetails.files[i].content + '</scri' + 'pt>';
        }
    }
    viewContent({ 'uri': extId + 'options.html', 'html': scripts + html }, extDetails.name);
}

function addExtension() {
    dataBag['extId'] = null;
    viewContent('addExtension', 'create new extension');
}

function editExtension(extId) {
    dataBag['extId'] = extId;
    viewContent('addExtension', 'edit extension');
}

function browseOnlineExtensions() {
    viewContent('browseOnlineExtensions', 'online extensions');
}

//]]>