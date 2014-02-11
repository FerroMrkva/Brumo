this.isValidURL = function () {
    // Returns a regular expression that matches all URL addresses we want to tag.
    return new RegExp('^http://(www\\.)?example\\.com');
};

this.tag = function (params, callback) {
    var url = params.url;
    var html = params.html;

    // get title
    var titleDiv = document.createElement('div');
    titleDiv.innerHTML = /<title.+>/.exec(html);
    var title = '';
    if (titleDiv.children[0])
        title = titleDiv.children[0].innerText.toLowerCase();

    // get keywords
    var tags = [];
    var rels = [];

    // Here you can write your code.

    callback({ 'url': url, 'title': title, 'tags': tags, 'rels': rels });
};
