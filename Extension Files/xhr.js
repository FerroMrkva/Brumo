// data je pole parametrov typu 'parameter=hodnota'
xhrGet = function (url, _data, handler) {
	if (url.indexOf("://") == -1)
		url = data.url(url);
	var xhr = new XMLHttpRequest();
	if (data)
		xhr.open("GET", url + '?' + _data.join('&'), true);
	else
		xhr.open("GET", url, true);
	// TODO: allow getting (tagging) of non-html pages
	xhr.setRequestHeader('Accept',
			'text/html');
	xhr.onreadystatechange = function () {
		if (xhr.readyState == 4) {
			if (xhr.status == 200)
				handler(xhr.responseText, xhr.getAllResponseHeaders());
			else
				handler('');
		}
	}
	xhr.send();
}

xhrPost = function (url, data, handler) {
	var xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader('Content-Type',
			'application/x-www-form-urlencoded; charset=utf-8');
	xhr.onreadystatechange = function () {
		if (xhr.readyState == 4) {
			if (xhr.status == 200)
				handler(xhr.responseText, xhr.getAllResponseHeaders());
			else
				handler('');
		}
	}
	xhr.send(data);
}
