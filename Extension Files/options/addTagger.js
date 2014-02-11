//<![CDATA[
var codeEditor;
var taggerId;

function loaded() {
    $(document).keydown(function (event) {
        if (event.ctrlKey || event.metaKey) {
            var c = String.fromCharCode(event.which).toLowerCase();
            if (c == 's') {
                event.preventDefault();
                clearTimeout(t);
                $('#status').html('Saving...');
                save();
                return false;
            }
        }
        return true;
    });
	$('#addTagger').click(save);
	$('#removeTagger').click(remove);
	codeEditor = ace.edit("taggerCode");
	codeEditor.setTheme("ace/theme/chrome");
	codeEditor.getSession().setMode("ace/mode/javascript");
	codeEditor.setShowPrintMargin(false);
	taggerId = dataBag['taggerId'];
	if (taggerId) {
		MP.db.get('taggers', taggerId, function (ext) {
			$('#taggerName').prop('value', ext.name);
			codeEditor.getSession().setValue(ext.code);
		});
	}
	else {
		MP.db.get('taggers', 'list', function (taggerList) {
			if (!taggerList) taggerList = [];
			taggerId = 1;
			if (taggerList.length) {
				for (var i = taggerList.length - 1; i >= 0; --i) {
					if (taggerList[i] == parseInt(taggerList[i])) {
						taggerId = taggerList[i] + 1;
						break;
					}
				}
			}
		});
		MP.xhr.getResource('options/taggerTemplate.js', function (code) {
		    codeEditor.getSession().setValue(code);
		});
	}
};

function unloaded() {
};

var t;

function save() {
    var taggerName = $('#taggerName').prop('value');
    if (!taggerName) {
        clearTimeout(t);
        $('#status').html('Please choose a different name for your tagger.');
        t = setTimeout("$('#status').html('');", 5000);
        return;
    }
	var code = codeEditor.getValue();
	addTagger(taggerId, {
		'name': taggerName,
		'enabled': true,
		'author': 'You',
		'version': '1.0',
		'description': 'No description available.',
		'code': code
	}, function () {
		$('#status').html('Tagger saved successfully.');
		clearTimeout(t);
		t = setTimeout("$('#status').html('');", 5000);
	});
};

function addTagger(taggerId, taggerDetails, callback) {
	MP.db.get('taggers', 'list', function (taggerList) {
		if (!taggerList) taggerList = [];
		MP.db.set('taggers', taggerId, taggerDetails, function () {
			_sendMessage({
				type: 'tagger',
				command: 'loadTagger',
				'taggerId': taggerId
			});
			for (var i = 0; i < taggerList.length; ++i) {
				if (taggerList[i] == taggerId) {
					if (typeof (callback) == 'function') {
						callback();
					}
					return;
				}
			}
			taggerList.push(taggerId);
			MP.db.set('taggers', 'list', taggerList, function () {
				if (typeof (callback) == 'function') {
					callback();
				}
			});
		});
	});
}

function remove() {
	_sendMessage({
		'type': 'tagger',
		'command': 'removeTagger',
		'taggerId': taggerId
	}, function () {
		viewContent('taggers', 'taggers');
	});
}

//]]>