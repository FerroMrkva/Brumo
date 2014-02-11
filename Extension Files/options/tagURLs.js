//<![CDATA[
var tag;

function loaded() {
	tag = dataBag['tag'];
	getURLs(tag, 100);
}

function unloaded() {
}

function addURL(url) {
	MP.me.getUrlDetails({ 'url': url.url }, function (details) {
		var elem = $('#results');
		var div = $('<div/>', {
			'class': 'tagResult'
		});
		var shortUrl = url.url;
		if (shortUrl.length > 100)
			shortUrl = shortUrl.substr(0, 97) + '...';
		var divURL = $('<div/>', {
			'class': 'tagResultUrl',
			text: shortUrl
		});
		if (!details.title)
			details.title = shortUrl;
		var divTitle = $('<a/>', {
			'class': 'tagResultTitle',
			href: url.url,
			text: details.title
		});
		var divDetails = $('<div/>', {
			'class': 'tagResultDetails'
		});
		var kedy = new Date(details.lastVisitTime);
		divDetails.html('Relevancy: <b>' + url.relevancy +
			'</b>  Visit count: <b>' + details.visitCount +
			'</b><br/>  Last visit: ' + kedy.toLocaleDateString() +
			' ' + kedy.toLocaleTimeString());
		div.append(divTitle, divURL, divDetails);
		elem.append(div);
	});
}

function getURLs(tag, count) {
	_sendMessage({
		type: 'indexer',
		command: 'getUrlsByTag',
		'tag': tag,
		'count': count
	}, function (urls) {
		var elem = $('#results');
		if (!urls.length) {
			elem.html("Hmm, that's weird. No URLs found for this tag.");
			return;
		}
		elem.html('');
		for (var i = 0; i < urls.length; ++i) {
			addURL(urls[i]);
		}
	});
}

//]]>