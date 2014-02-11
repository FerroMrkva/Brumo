//<![CDATA[
var taggerCount;

function loaded() {
	$('#addTagger').click(addTagger);
	$('#browseOnlineTaggers').click(browseOnlineTaggers);
	loadTaggerList();
};

function unloaded() {
};

function loadTaggerList() {
	$('#taggerList').html('');
	MP.db.get('taggers', 'list', function (taggerList) {
		if (!taggerList) taggerList = [];
		taggerCount = taggerList.length;
		for (var i = 0; i < taggerCount; ++i) {
			addVisualItem(taggerList[i]);
		}
		if (taggerList.length == 0) {
			$('<p/>', {
				text: ':( You have no custom taggers installed.'
			}).appendTo('#taggerList');
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
		MP.db.set('taggers', 'list', extList);
	});
}

function addVisualItem(taggerId) {
	MP.db.get('taggers', taggerId, function (taggerDetails) {
		if (!taggerDetails) {
			console.log('listing ' + taggerId + ' tagger');
		}
		var tagger = $('<p/>', {
			id: taggerId,
			class: 'extensionEntry'
		}).appendTo('#taggerList');
		$('<span/>', {
			id: taggerId + 'name',
			class: 'extensionName',
			text: taggerDetails.name,
			click: function () {
				toggleViewTaggerInfo(taggerId);
			}
		}).appendTo(tagger)
		.css('cursor', 'pointer')
		.css('opacity', taggerDetails.enabled ? 1 : 0.75);
		var right = $('<span/>').appendTo(tagger)
		.css('float', 'right');
		// checkbox enable
		$('<input/>', {
			id: 'enabled' + taggerId,
			type: 'checkbox'
		}).appendTo(right)
		.attr('checked', taggerDetails.enabled)
		.click(function () {
			toggleDisableTagger(taggerId, function () {
				var enabled = $('#enabled' + taggerId).attr('checked') == 'checked';
				$('#' + taggerId + 'status').text(enabled ? 'Enabled' : 'Enable');
				$('#' + taggerId + 'name').css('opacity', enabled ? 1 : 0.75);
			});
		});
		// checkbox enable label
		$('<span/>', {
			id: taggerId + 'status',
			class: 'status',
			text: taggerDetails.enabled ? 'Enabled' : 'Enable'
		}).appendTo(right)
		.css('min-width', '100px');
		if ((taggerId + '').indexOf('research') != 0) {
			// cannot edit research tagger
			$('<span/>', {
				class: 'button',
				text: 'Edit',
				click: function () {
					editTagger(taggerId);
				}
			}).appendTo(right);
		}
		// add remove button
		$('<span/>', {
			class: 'removeButton',
			text: 'Remove',
			click: function () {
				_sendMessage({
					'type': 'tagger',
					'command': 'removeTagger',
					'taggerId': taggerId
				}, function () {
					$('#' + taggerId).remove();
					taggerCount--;
					if (!taggerCount) {
						$('#taggerList').html('<p>:( You have no taggers installed.</p>');
					}
				});
			}
		}).appendTo(right);
		// tagger details (author, version, description)
		var info = $('<div/>', {
			id: taggerId + 'info'
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

function toggleDisableTagger(taggerId, callback) {
	MP.db.get('taggers', taggerId, function (taggerDetails) {
		taggerDetails.enabled = $('#enabled' + taggerId).attr('checked') == 'checked';
		MP.db.set('taggers', taggerId, taggerDetails, function () {
			_sendMessage({
				type: 'tagger',
				command: 'loadTagger',
				'taggerId': taggerId
			}, callback);
		});
	});
}

function toggleViewTaggerInfo(taggerId) {
	var tagger = $('#' + taggerId);
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

function addTagger() {
	dataBag['taggerId'] = null;
	viewContent('addTagger', 'add new tagger');
}

function editTagger(taggerId) {
	dataBag['taggerId'] = taggerId;
	viewContent('addTagger', 'edit tagger');
}

function browseOnlineTaggers() {
	viewContent('browseOnlineTaggers', 'online taggers');
}

//]]>