//<![CDATA[
var codeEditor;
var extId;
var extData = {};

function loaded() {
    $(document).keydown(function (event) {
        if (event.ctrlKey || event.metaKey) {
            var c = String.fromCharCode(event.which).toLowerCase();
            if (c == 's') {
                event.preventDefault();
                clearTimeout(t);
                save();
                return false;
            }
        }
        return true;
    });
    $('#extMenuNewContentScript,#addExtFile').click(function () {
        addFileDialog({
            'role': 'content script',
            'fileType': 'javascript'
        });
    });
    $('#extMenuNewBackgroundScript').click(function () {
        addFileDialog({
            'role': 'background script',
            'fileType': 'javascript'
        });
    });
    $('#extMenuNewOptionsPage').click(function () {
        addFileDialog({
            'role': 'options page',
            'fileType': 'html'
        });
    });
    $('#extMenuNewOptionsScript').click(function () {
        addFileDialog({
            'role': 'options script',
            'fileType': 'javascript'
        });
    });
    $('#extMenuSave').click(save);
    $('#extMenuRemove').click(remove);
    $('#extMenuClose').click(close);
    $('#tabList li:not(#extMenu)').click(tabClicked);
    codeEditor = ace.edit("extensionCode");
    codeEditor.setTheme("ace/theme/chrome");
    codeEditor.getSession().setMode("ace/mode/javascript");
    codeEditor.setShowPrintMargin(false);
    extId = dataBag['extId'];
    if (extId) {
        MP.db.get('extensions', extId, function (ext) {
            extData = ext;
            if (!extData.files)
                extData.files = [];
            if (extData.code) {
                if (extData.code.indexOf('this.onDOMContentLoaded') != -1) {
                    extData.files.push({
                        'name': 'content script',
                        'role': 'content script',
                        'language': 'javascript',
                        'content': extData.code
                    });
                }
                function getBgCode() {
                    var code;
                    eval('var x=function(){' + extData.code + '}; var y=new x().bgCode.toString();  code=y.slice(y.indexOf("{") + 1, y.lastIndexOf("}"));');
                    return code.trim();
                }
                if (extData.code.indexOf('this.bgCode') != -1) {
                    extData.files.push({
                        'name': 'background script',
                        'role': 'background script',
                        'language': 'javascript',
                        'content': getBgCode()
                    });
                }
                delete extData.code;
            }
            if (extData.html) {
                extData.files.push({
                    'name': 'options page',
                    'role': 'options page',
                    'language': 'html',
                    'content': extData.html
                });
                delete extData.html;
            }
            $('#extensionName').prop('value', ext.name);
            $('#extensionAuthor').prop('value', ext.author);
            $('#extensionVersion').prop('value', ext.version);
            $('#extensionDescription').prop('value', ext.description);
            var files = extData.files;
            for (var i = 0; i < files.length; ++i) {
                addFileToList(files[i]);
            }
            loadCodeContent();
        });
    }
    else {
        MP.db.get('extensions', 'list', function (extList) {
            if (!extList) extList = [];
            extId = 1;
            if (extList.length) {
                for (var i = extList.length - 1; i >= 0; --i) {
                    if (extList[i] == parseInt(extList[i])) {
                        extId = extList[i] + 1;
                        break;
                    }
                }
            }
            //MP.xhr.getResource('options/extensionTemplate.js', function (code) {
            //    extData = { 'code': code };
            //    loadCodeContent();
            //});
        });
    }
};

function addFileDialog(params) {
    if (!extData.files)
        extData.files = [];
    var content = $(document.createElement('tbody'));
    var row1 = $(document.createElement('tr'));
    $(document.createElement('td')).append($('<span/>', {
        text: 'Filename:'
    })).appendTo(row1);
    $(document.createElement('td')).append($('<input/>', {
        id: 'dialogFilename',
        type: 'text',
        placeholder: 'Filename'
    })).appendTo(row1);
    row1.appendTo(content);
    var row2 = $(document.createElement('tr'));
    $(document.createElement('td')).append($('<span/>', {
        text: 'Role:'
    })).appendTo(row2);
    var select = $(document.createElement('select'));
    var roles = ['content script', 'background script', 'options page', 'options script', 'resource'];
    for (var i = 0; i < extData.files.length; ++i) {
        if (extData.files[i].role == 'options page') {
            roles.splice(2, 1);
        }
    }
    for (var i = 0; i < roles.length; ++i) {
        $('<option/>', {
            value: roles[i],
            text: roles[i]
        }).appendTo(select);
    }
    $(document.createElement('td')).append(select).appendTo(row2);
    row2.appendTo(content);
    var row3 = $(document.createElement('tr'));
    $(document.createElement('td')).append($('<span/>', {
        text: 'Choose the file:'
    })).appendTo(row3);
    var file_content = '';
    $(document.createElement('td')).append($('<input/>', {
        id: 'file_uploader',
        type: 'file',
        text: 'Choose the file:',
        on: {
            change: function (evt) {
                file_content = '';
                var file = evt.target.files[0];
                var reader = new FileReader();
                reader.onload = (function (f) {
                    return function (e) {
                        if ($('#dialogFilename').val() == "")
                            $('#dialogFilename').val(f.name);
                        file_content = e.target.result;
                    };
                })(file);
                reader.readAsText(file);
            }
        }
    })).appendTo(row3);
    row3.appendTo(content);
    if (params.role)
        select.prop('value', params.role);
    dialog({
        'content': $('<table/>').append(content),
        'buttons': ['Add', 'Cancel']
    }, function (response) {
        if (response.Add) {
            var fileName = $('#dialogFilename').prop('value');
            var invalidName = !fileName;
            var optionsPage = false;
            if (!invalidName) {
                for (var i = 0; i < extData.files.length; ++i) {
                    if (extData.files[i].name == fileName) {
                        invalidName = true;
                        break;
                    }
                    if (extData.files[i].role == 'options page')
                        optionsPage = true;
                }
            }
            if (invalidName) {
                $('#dialogFilename').addClass('badName');
                clearTimeout(t);
                $('#status').html('Please choose a different filename.');
                t = setTimeout("$('#status').html('');", 5000);
                return true;
            }
            $('#dialogFilename').removeClass('badName');
            var role = select.prop('value');
            var id = extData.files.length;
            extData.files.push({
                'name': fileName,
                'role': role,
                'language': role == 'options page' ? 'html' : 'javascript',
                'content': file_content
            });
            addFileToList(extData.files[id]);
            openFile(extData.files[id]);
        }
    });
}

function getTab(name) {
    var tabs = $('#tabList li');
    for (var i = 0; i < tabs.length; ++i) {
        if (tabs[i].id == name) {
            return $(tabs[i]);
        }
    }
}

function openFile(file) {
    if ($(getTab('tabFile' + file.name)).length == 0) {
        var header = $('<span/>', {
            text: file.name
        });
        $('<span/>', {
            class: 'icon-close',
            click: function () {
                var curTab = getTab('tabFile' + file.name);
                if (curTab.hasClass('selected'))
                    tabClicked.call($(getTab('tabSettings')));
                curTab.remove();
            }
        })
            .css('margin-left', '8px')
            .appendTo(header);
        $('<li/>', {
            id: 'tabFile' + file.name,
            click: tabClicked
        }).append(header).appendTo('#tabList');
    }
    tabClicked.call($(getTab('tabFile' + file.name)));
}

function addFileToList(file) {
    var row = $('<tr/>', {
        id: 'extFile' + file.name,
        class: 'spacing2em'
    });
    $('<td/>').append($('<span/>', {
        text: file.name
    })).appendTo(row);
    $('<td/>').append($('<span/>', {
        text: file.role,
        class: 'italic'
    })).appendTo(row);
    //$('<span/>', {
    //    class: 'button',
    //    text: 'Rename',
    //    click: function () {
    //    }
    //}).appendTo(row);
    $('<td/>').append($('<span/>', {
        class: 'button',
        text: 'Edit',
        click: function () {
            openFile(file);
        }
    })).appendTo(row);
    $('<td/>').append($('<span/>', {
        class: 'removeButton',
        text: 'Remove',
        click: function () {
            dialog({
                'content': 'Do you really want to remove file "' + file.name + '"?',
                'buttons': ['Yes', 'No']
            }, function (response) {
                if (response.Yes) {
                    for (var i = 0; i < extData.files.length; ++i) {
                        if (extData.files[i].name == file.name) {
                            extData.files.splice(i, 1);
                            $(document.getElementById('extFile' + file.name)).remove();
                            break;
                        }
                    }
                }
            });
        }
    })).appendTo(row);
    row.appendTo('#extFileList');
}

function unloaded() {
};

var t;

function saveCodeContent() {
    var id = $('.codeTabs li.selected')[0].id;
    if (id != 'tabSettings') {
        id = id.substr('tabFile'.length);
        // store this code part into temporal data object
        for (var i = 0; i < extData.files.length; ++i) {
            if (extData.files[i].name == id) {
                extData.files[i].content = codeEditor.getValue().trim();
                break;
            }
        }
    }
}

function loadCodeContent() {
    var id = $('.codeTabs li.selected')[0].id;
    if (id != 'tabSettings') {
        id = id.substr('tabFile'.length);
        // load new code part from temporal data object
        for (var i = 0; i < extData.files.length; ++i) {
            if (extData.files[i].name == id) {
                codeEditor.setTheme("ace/theme/chrome");
                codeEditor.getSession().setMode("ace/mode/" + extData.files[i].language);
                codeEditor.getSession().setValue(extData.files[i].content);
                break;
            }
        }
    }
}

function tabClicked() {
    saveCodeContent();
    var old = $('.codeTabs li.selected');
    if (old[0].id == 'tabSettings') {
        $('#divSettings').addClass('hidden');
    }
    else {
        $('#extensionCode').addClass('hidden');
    }
    old.removeClass('selected');
    $(this).addClass('selected');
    if ($(this)[0].id == 'tabSettings') {
        $('#divSettings').removeClass('hidden');
    }
    else {
        $('#extensionCode').removeClass('hidden');
    }
    loadCodeContent();
    codeEditor.focus();
}

function save(callback) {
    $('#status').html('Saving...');
    var extName = $('#extensionName').prop('value').trim();
    if (!extName) {
        $('#extensionName').addClass('badName');
    }
    else {
        $('#extensionName').removeClass('badName');
    }
    var extAuthor = $('#extensionAuthor').prop('value').trim();
    if (!extAuthor) {
        extAuthor = 'Anonymous';
        $('#extensionAuthor').prop('value', extAuthor);
    }
    var extVersion = $('#extensionVersion').prop('value').trim();
    if (!extVersion) {
        $('#extensionVersion').addClass('badVersion');
    }
    else {
        $('#extensionVersion').removeClass('badVersion');
    }
    var extDescription = $('#extensionDescription').prop('value').trim();
    if (!extDescription) {
        extDescription = 'No description available.';
    }
    if (!extName) {
        clearTimeout(t);
        $('#status').html('Please choose a different name for your extension.');
        t = setTimeout("$('#status').html('');", 5000);
        if (callback)
            callback({ 'error': 'invalid name' });
        return;
    }
    if (!extVersion) {
        clearTimeout(t);
        $('#status').html('Please provide a valid version.');
        t = setTimeout("$('#status').html('');", 5000);
        if (callback)
            callback({ 'error': 'invalid version' });
        return;
    }
    saveCodeContent();
    extData.id = extId;
    extData.name = extName;
    extData.enabled = true;
    extData.author = extAuthor;
    extData.version = extVersion;
    extData.description = extDescription;
    addExtension(extId, extData, function () {
        if (!dataBag['extId']) {
            $('#status').html('Extension created successfully.');
            setTitle('edit extension');
        }
        else {
            $('#status').html('Extension saved successfully.');
        }
        clearTimeout(t);
        t = setTimeout("$('#status').html('');", 5000);
        if (callback)
            callback({ 'ok': true });
    });
};

function addExtension(extId, extDetails, callback) {
    MP.db.get('extensions', 'list', function (extList) {
        if (!extList) extList = [];
        MP.db.set('extensions', extId, extDetails, function () {
            _sendMessage({
                type: 'ext',
                command: 'loadExtension',
                'extId': extId
            });
            for (var i = 0; i < extList.length; ++i) {
                if (extList[i] == extId) {
                    if (typeof (callback) == 'function') {
                        callback();
                    }
                    return;
                }
            }
            extList.push(extId);
            MP.db.set('extensions', 'list', extList, function () {
                if (typeof (callback) == 'function') {
                    callback();
                }
            });
        });
    });
}

function remove() {
    dialog({
        'content': 'Do you really want to remove this extension?',
        'buttons': ['Yes', 'No']
    }, function (response) {
        if (response.Yes) {
            _sendMessage({
                'type': 'ext',
                'command': 'removeExtension',
                'extId': extId
            }, function () {
                viewContent('extensions', 'extensions');
            });
        }
    });
}

function close() {
    dialog({
        'content': 'Do you want to save changes before closing?',
        'buttons': ['Yes', 'No', 'Cancel']
    }, function (response) {
        if (response.Yes) {
            save(function (response) {
                if (response.ok) {
                    viewContent('extensions', 'extensions');
                }
            });
        }
        else if (response.No) {
            viewContent('extensions', 'extensions');
        }
    });
}

//]]>