//<![CDATA[
var refreshing;

function loaded() {
    refreshing = setInterval(function () {
        displayUserTags(100);
    }, 1000);
    oldUserTags = {};
    displayUserTags(100);
};

function unloaded() {
    clearInterval(refreshing);
};

var doAction = indexHistory;

$('#action').click(function () {
    doAction();
});

var userTags = {};
var oldUserTags;

function refresh() {
    var body = document.body;
    body.style.display = 'run-in';
    body.offsetHeight;
    body.style.display = 'block';
}

function makeTagCloud(tags) {
    var userTagsElem = $('#userTags');
    userTagsElem.html('');
    var tags2 = {};
    for (var i = 0; i < tags.length; ++i)
        tags2[tags[i].tag] = tags[i].relevancy;
    for (var tag in userTags) {
        if (!tags2[tag]) {
            // Remove tag
            delete userTags[tag];
        }
    }

    var width = userTagsElem.width();
    var height = userTagsElem.height();
    var maxSize = 100;
    var sizeCoef = 1;
    if (tags.length)
        sizeCoef = maxSize / tags[0].relevancy;

    function go(i) {
        if (i == tags.length) {
            refresh();
            return;
        }
        var rel = tags[i].relevancy;
        var size = Math.round(rel * sizeCoef);
        var info = userTags[tags[i].tag];
        function isColliding(info) {
            if (info.x2 > width || info.y2 > height)
                return true;
            for (var j = 0; j < i; ++j) {
                var info2 = userTags[tags[j].tag];
                if (info.x1 < info2.x2 &&
						info2.x1 < info.x2 &&
						info.y1 < info2.y2 &&
						info2.y1 < info.y2)
                    return true;
            }
            return false;
        }
        var elem = $('<a/>', {
            id: 'tag' + tags[i].tag,
            href: 'javascript:void("' + tags[i].tag + '");',
            text: tags[i].tag.toUpperCase(),
            click: function () {
                var tag = this.id.substr(3);
                dataBag['tag'] = tag;
                viewContent('tagURLs.html', tag);
            }
        });
        elem.appendTo(userTagsElem);
        elem.css('fontSize', size + 'px');
        var MAX_TRIES = 1000;
        var tries = MAX_TRIES;
        var collides = false;
        if (!info) info = {};
        do {
            var x = Math.round(Math.random() * width);
            var y = Math.round(Math.random() * height);
            if (tries == MAX_TRIES && info.x1)
                x = info.x1;
            if (tries == MAX_TRIES && info.y1)
                y = info.y1;
            elem.css('left', x + 'px');
            elem.css('top', y + 'px');
            info.x1 = x;
            info.y1 = y;
            var w = elem.width();
            var h = elem.height();
            if (!w)
                w = Math.round(size * tags[i].tag.length * .5) + 2;
            if (!h)
                h = size + 2;
            info.x2 = x + w;
            info.y2 = y + h;
            info.rel = rel;
            tries--;
            collides = isColliding(info);
            if (!tries && collides && !i) {
                tries++;
                sizeCoef *= .7;
            }
        } while (tries >= 0 && collides);
        if (collides) {
            elem.remove();
            return;
        }
        refresh();
        userTags[tags[i].tag] = info;
        go(i + 1);
        //setTimeout(function(){go(i+1);},0);
    }

    go(0);
}

function displayUserTags(count) {
    MP.me.getUserTags({
        'count': count
    }, function (userTags) {
        if (JSON.stringify(userTags) == JSON.stringify(oldUserTags)) return;
        oldUserTags = userTags;
        var elem = document.getElementById('userTags');
        if (!userTags.length) {
            $('#userModelInfo').html("You haven't indexed your history yet.");
            return;
        }
        makeTagCloud(userTags);
    });
}

function indexHistory(countLimit) {
    doAction = cancelIndexing;
    userTags = {};
    $('#action').html('Cancel indexing');
    var elem = $('#userModelInfo');
    if (elem)
        elem.html('Updating index...');
    $('#progress').attr('value', 0);
    var t;
    function getState() {
        _sendMessage({
            type: 'indexer',
            command: 'getState'
        }, function (msg) {
            var elem = $('#userModelInfo');
            if (msg.cancelled) {
                // Cancelled.
                elem.html('Indexing cancelled.');
                clearInterval(t);
                $('#progress').css('visibility', 'collapse');
                setTimeout(function () { elem.html(''); }, 5000);
                return;
            }
            if (msg.current == msg.total) {
                // Finished.
                elem.html('Index updated (' + msg.timer + ' ms).');
                clearInterval(t);
                doAction = indexHistory;
                $('#action').html('Index history');
                $('#progress').css('visibility', 'collapse');
                refresh();
                setTimeout(function () { elem.html(''); }, 5000);
                return;
            }
            if (elem) {
                // In progress...
                elem.html('Updating index   (' + msg.current + '/' + msg.total + ')');
                var progress = $('#progress');
                progress.attr('value', msg.current);
                progress.attr('max', msg.total);
                progress.css('visibility', 'visible');
            }
            doAction = cancelIndexing;
            $('#action').html('Cancel indexing');
        });
    }
    _sendMessage({
        type: 'indexer',
        command: 'clearIndexer'
    });
    _sendMessage({
        type: 'indexer',
        command: 'indexHistory',
        'countLimit': countLimit
    });
    t = setInterval(getState, 1000);
}

function cancelIndexing() {
    doAction = indexHistory;
    $('#action').html('Index history');
    _sendMessage({
        type: 'indexer',
        command: 'cancelIndexing'
    });
}

//]]>