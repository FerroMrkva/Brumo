var selectedEvent;
var unselectedEvent;

function viewContent(newContent, title, back) {
    if (typeof (newContent) == 'string') {
        newContent = { 'uri': newContent };
    }
    if (!newContent.html) {
        if (!(/[^\.]\.[^\.]/).test(newContent.uri))
            newContent.uri += '.html';
        MP.xhr.getResource('options/' + newContent.uri, function (html) {
            newContent.html = html;
            viewContent(newContent, title, back);
        });
        return;
    }
    document.title = 'Brumo - ' + title;
    $('#contentTitle').text(title);
    var content = document.getElementById('content');
    if (content)
        content.dispatchEvent(unselectedEvent);
    else {
        $('<div/>', { id: 'content' }).appendTo('#obsah');
    }
    if (!back)
        history.pushState({
            'page': newContent,
            'title': title
        }, null, '?' + newContent.uri);
    $('#content').fadeOut(200, function () {
        $('#obsah').html(newContent.html);
        $('#content').css({ 'display': 'none', 'left': '+=200px' });
        $('#content').fadeIn(200);
        $('#content').animate({ 'left': '-=200px' });
        var content = document.getElementById('content');
        if (content) {
            content.addEventListener('onload', loaded);
            content.addEventListener('onunload', unloaded);
            content.dispatchEvent(selectedEvent);
        }
    });
}

// Main function
var mainOK;

function main() {
    mainOK = true;
    $('#menuHome').click(function () {
        viewContent('home.html', 'Welcome to Brumo!');
    });
    $('#menuModel').click(function () {
        viewContent('model.html', 'my model');
    });
    $('#menuExtensions').click(function () {
        viewContent('extensions.html', 'extensions');
    });
    $('#menuTaggers').click(function () {
        viewContent('taggers.html', 'taggers');
    });
    $('#menuSettings').click(function () {
        viewContent('settings.html', 'settings');
    });
    selectedEvent = document.createEvent('Event');
    selectedEvent.initEvent('onload', true, true);
    unselectedEvent = document.createEvent('Event');
    unselectedEvent.initEvent('onunload', true, true);
    window.addEventListener("popstate", function (e) {
        if (e.state) {
            viewContent(e.state.page, e.state.title, 1);
            document.title = 'Brumo - ' + e.state.title;
        }
    });
    if (history.state && history.state.page)
        viewContent(history.state.page, history.state.title, 1);
    else
        viewContent('home', 'Welcome to Brumo!');
}

document.addEventListener('DOMContentReady', function () {
    if (!mainOK)
        main();
});

$(window).load(function () {
    if (!mainOK)
        main();
});