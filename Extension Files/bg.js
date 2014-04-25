var baseUrl = 'http://brumo.fiit.stuba.sk/';

var MP = {
	db: {
		clear:
			function (table, callback) {
				MePersonality.db.clear(table, callback);
			},
		get:
			function (table, key, callback) {
				MePersonality.db.get(table, key, callback);
			},
		set:
			function (table, key, value, callback) {
				MePersonality.db.set(table, key, value, callback);
			},
		remove:
			function (table, key, callback) {
				MePersonality.db.remove(table, key, callback);
			},
		getTransaction:
			function (callback) {
				MePersonality.db.getTransaction(callback);
			}
	},
	me: {
		getDomains:
			function (query, callback) {
				if (!query)
					query = {};
				if (!callback)
					callback = function (domains) {
						console.log(domains);
					};
				MePersonality.indexer.getDomains(query.count, callback);
			},
		getUserTags:
			function (query, callback) {
				if (!query)
					query = {};
				if (!callback)
					callback = function (userTags) {
						console.log(userTags);
					};
				MePersonality.indexer.getUserTags(query.count, callback);
			},
		getUserTagsByDomain:
			function (query, callback) {
				if (!query || !query.domain) {
					console.error('Domain must be defined.');
					return;
				}
				if (!callback)
					callback = function (userTags) {
						console.log(userTags);
					};
				MePersonality.indexer.getUserTagsByDomain(query.domain, query.count, callback);
			},
		getUrlsByTag:
			function (query, callback) {
				if (!query || !query.tag) {
					console.error('Tag must be defined.');
					return;
				}
				if (!callback)
					callback = function (urls) {
						console.log(urls);
					};
				MePersonality.indexer.getUrlsByTag(query.tag, query.count, callback);
			},
		getTagsByUrl:
			function (query, callback) {
				if (!query || !query.url) {
					console.error('Url must be defined.');
					return;
				}
				if (!callback)
					callback = function (tags) {
						console.log(tags);
					};
				MePersonality.indexer.getTagsByUrl(query.url, query.count, callback);
			},
		getTagRelevancy:
			function (query, callback) {
				if (!query || !query.tag) {
					console.error('Tag must be defined.');
					return;
				}
				if (!callback)
					callback = function (relevancy) {
						console.log(relevancy);
					};
				MePersonality.indexer.getTagRelevancy(query.tag, callback);
			},
		getUrlDetails:
			function (query, callback) {
				if (!query || !query.url) {
					console.error('Url must be defined.');
					return;
				}
				if (!callback)
					callback = function (details) {
						console.log(details);
					};
				MePersonality.indexer.getUrlDetails(query.url, callback);
			}
	},/*
			 net: {
			 createUserCharacteristics:
			 function () {
	// TODO:
	console.error('Not implemented yet.');
	},
	connect:
	function (channel, onmessage, onerror, onopen, onclose) {
	var serverURL = 'ws://vm08.ucebne.fiit.stuba.sk/MePersonality/';
	var socket = new WebSocket(serverURL + 'channel/' + channel);
	if (onerror)
	socket.onerror = onerror;
	if (onopen)
	socket.onopen = onopen;
	if (onclose)
	socket.onclose = onclose;
	if (onmessage)
	socket.onmessage = onmessage;
	return socket;
	},
	_connect:
	function (channel, onmessage, onerror, onopen, onclose) {
	var serverURL = 'ws://vm08.ucebne.fiit.stuba.sk/MePersonality/';
	var socket = new WebSocket(serverURL + channel);
	if (onerror)
	socket.onerror = onerror;
	if (onopen)
	socket.onopen = onopen;
	if (onclose)
	socket.onclose = onclose;
	if (onmessage)
	socket.onmessage = onmessage;
	return socket;
	}
	},*/
	notifier: {
		notify:
			function (params) {
				MePersonality.browser.notify(params);
			}
	},
	com: {
		send:
			function (params, callback) {
			}
	}
};

var extensionCode = {};
var extensions = {};

function removeExtension(extId, callback) {
	MePersonality.db.get('extensions', 'list', function (extList) {
		if (!extList) extList = [];
		for (var i = extList.length - 1; i >= 0; --i) {
			if (extList[i] == extId) {
				extList.splice(i, 1);
				break;
			}
		}
		MePersonality.db.set('extensions', 'list', extList, function () {
			delete extensionCode[extId];
			delete extensions[extId];
			MePersonality.db.remove('extensions', extId, callback);
		});
	});
}

function removeTagger(taggerId, callback) {
	MePersonality.db.get('taggers', 'list', function (taggerList) {
		if (!taggerList) taggerList = [];
		for (var i = taggerList.length - 1; i >= 0; --i) {
			if (taggerList[i] == taggerId) {
				taggerList.splice(i, 1);
				break;
			}
		}
		MePersonality.db.set('taggers', 'list', taggerList, function () {
			MePersonality.tagger.removeTagger(taggerId, function () {
				MePersonality.db.remove('taggers', taggerId, callback);
			});
		});
	});
}

function reloadExtension(extId, callback, onerror) {
	MePersonality.db.get('extensions', extId, function (ext) {
		if (!ext.enabled) {
			delete extensionCode[extId];
			if (callback)
		callback({ message: 'Extension ' + extId + ' (' + ext.name + ') disabled.' });
	return;
		}
		if (ext.code) {
			// old version
			extensionCode[extId] = ext.code;
			try {
				var code = ext.code.replace(/\t+/g, ' ').replace(/\r+/g, '');
				code = '(function(){\
					var MePersonality=MP;\
							 var extCode=function(){\
								 '+ code + '\
							 };\
				var x=extensions["'+ extId + '"]=new extCode();\
							 if (typeof(x.bgCode)=="function") x.bgCode();\
				})();';
				eval(code);
				if (callback)
					callback({ message: 'Extension ' + extId + ' (' + ext.name + ') loaded.' });
			} catch (e) {
				if (onerror)
					onerror({
						message: 'Failed to load extension ' + extId + ' (' + ext.name + ').',
						error: e
					});
			}
		}
		else if (ext.files) {
			// new version
			var code = '', bgcode = '';
			for (var i = 0; i < ext.files.length; ++i) {
				if (ext.files[i].role == 'background script') {
					bgcode += ext.files[i].content;
				}
				else if (ext.files[i].role == 'content script') {
					code += ext.files[i].content;
				}
			}
			extensionCode[extId] = code;
			try {
				// TODO: kill the process if disabled
				bgcode = '(function(){\
					var MePersonality=MP;\
								 function run(){' + bgcode.replace(/\t+/g, ' ').replace(/\r+/g, '') + '};\
								 run();\
				})();';
				eval(bgcode);
				if (callback)
					callback({ message: 'Extension ' + extId + ' (' + ext.name + ') loaded.' });
			} catch (e) {
				if (onerror)
					onerror({
						message: 'Failed to load extension ' + extId + ' (' + ext.name + ').',
						error: e
					});
			}
		}
		else {
			if (onerror)
				onerror({
					message: 'Failed to load extension ' + extId + ' (' + ext.name + ').',
					error: "Invalid format of extension."
				});
		}
	});
}

function reloadTagger(taggerId, callback, onerror) {
	MePersonality.db.get('taggers', taggerId, function (tagger) {
		MePersonality.tagger.reloadTagger(taggerId, function (params) {
			if (params.error)
			onerror(params);
			else
			callback(params);
		});
	});
}

function generateUID(callback) {
	var id;
	MePersonality.net._connect({ 'channel': 'genuid' }, function (params) {
		if (params.subscribed) {
			id = params.id;
			return;
		}
		if (params.message) {
			MP.db.set('info', 'userID', params.message, function () {
				callback({ 'success': 1 });
			});
			MePersonality.net._disconnect({ 'id': id, 'channel': 'genuid' });
		}
		else if (params.error) {
			callback({ 'error': 1 });
			MePersonality.net._disconnect({ 'id': id, 'channel': 'genuid' });
		}
	});
}

function downloadWordnetFile(name, callback) {
	if (MP.browser.debug)
		console.log('Downloading ' + name + ' Wordnet file...');
	MePersonality.browser.xhr.get(baseUrl + 'wordnet/' + name + '.json', function (response) {
		if (response.error) {
			callback({ 'error': "Failed to download WordNet file '" + name + ".json'", 'cause': response });
			return;
		}
		if (!response.json) {
			callback({ 'error': "Failed to download WordNet file '" + name + ".json'", 'cause': 'The file is not in JSON format.' });
			return;
		}
		response = response.json;
		if (!response.version) {
			callback({ 'error': "Failed to process downloaded WordNet file '" + name + ".json.'", 'cause': "The property 'version' is missing." });
			return;
		}
		MP.db.set('wordnet', name, response.data, function () {
			MP.db.set('wordnet', name + '_version', response.version, function () {
				callback({ 'success': 1 });
			});
		});
	});
}

function checkForWordnetUpdate(callback) {
	callback({ 'ok': 1 });
	return;
	if (MP.browser.debug)
		console.log('Checking for Wordnet update...');
	MePersonality.browser.xhr.get(baseUrl + 'wordnet/versions.json', function (response) {
		if (response.error) {
			callback({ 'error': "'Failed to download WordNet file 'versions.json'", 'cause': response });
			return;
		}
		if (!response.json) {
			callback({ 'error': "'Failed to download WordNet file 'versions.json'", 'cause': 'The file is not in JSON format.' });
			return;
		}
		response = response.json;
		var wordnetFiles = [];
		for (var file in response)
		wordnetFiles.push(file);
	var updated = 0;
	(function rec(i) {
		if (i < 0) {
			if (updated)
		callback({ 'success': 1 });
			else
		callback({ 'ok': 1 });
	return;
		}
		MP.db.get('wordnet', wordnetFiles[i] + '_version', function (version) {
			if (response[wordnetFiles[i]] != version) {
				updated = 1;
				downloadWordnetFile(wordnetFiles[i], function (_response) {
					if (_response.error) {
						callback({ 'error': 'Unable to download wordnet file ' + wordnetFiles[i] + '.', 'cause': _response });
					}
					else rec(i - 1);
				});
			}
			else rec(i - 1);
		});
	})(wordnetFiles.length - 1);
	});
}

function firstUse(callback) {
	MePersonality.browser.openOptions();
	generateUID(function (response) {
		if (response.error) {
			MePersonality.browser.notify({ text: 'Error: Unable to generate userID. Websocket connection to Brumo server failed.' });
		}
		loadExtensions(callback);
	});
	//var indexNow = confirm('To have the best possible experience of using MePersonality, your browsing history is about to be indexed. If you have currently slow internet connection or just do not feel comfortable enough to do so right now, please click cancel.');
	//if (indexNow) {
	//	MePersonality.indexer.indexHistory();
	//}
}

function loadExtensions(callback, onerror) {
	MePersonality.db.get('extensions', 'list', function (extList) {
		if (!extList) {
			// First launch ever!
			if (MP.browser.debug)
		console.log('First launch ever!');
	MePersonality.db.set('extensions', 'list', [], function () {
		firstUse(callback);
	});
	return;
		}
		var completed = 0, failed = 0;
		function callCallback() {
			var message = 'Extensions loaded successfully.';
			if (failed) {
				if (failed < extList.length)
		message = (extList.length - failed) + ' extensions loaded successfully, ' + failed + ' extensions failed to load.';
				else
		message = failed + ' extensions failed to load.';
			}
			callback({ 'message': message, 'failed': failed });
		}
		for (var i = 0; i < extList.length; ++i) {
			reloadExtension(extList[i], function () {
				completed++;
				if (completed == extList.length && callback)
				callCallback();
			}, function (e) {
				if (onerror)
				onerror(e);
			completed++;
			if (completed == extList.length && callback)
				callCallback();
			});
		}
		if (completed == extList.length && callback)
			callCallback();
	});
}

function loadTaggers(callback, onerror) {
	MePersonality.db.get('taggers', 'list', function (extList) {
		if (!extList) {
			// First launch ever!
			if (MP.browser.debug)
		console.log('First launch ever!');
	MePersonality.db.set('taggers', 'list', [], function () {
		callback();
	});
	return;
		}
		var completed = 0, failed = 0;
		function callCallback() {
			var message = 'Taggers loaded successfully.';
			if (failed) {
				if (failed < extList.length)
		message = (extList.length - failed) + ' taggers loaded successfully, ' + failed + ' taggers failed to load.';
				else
		message = failed + ' taggers failed to load.';
			}
			callback({ 'message': message, 'failed': failed });
		}
		for (var i = 0; i < extList.length; ++i) {
			reloadTagger(extList[i], function () {
				completed++;
				if (completed == extList.length && callback)
				callCallback();
			}, function (e) {
				if (onerror)
				onerror(e);
			completed++;
			if (completed == extList.length && callback)
				callCallback();
			});
		}
		if (completed == extList.length && callback)
			callCallback();
	});
}

function addExtension(extId, extDetails, callback, onerror) {
	MP.db.get('extensions', 'list', function (extList) {
		if (!extList) extList = [];
		MP.db.set('extensions', extId, extDetails, function () {
			for (var i = 0; i < extList.length; ++i) {
				if (extList[i] == extId) {
					// Extension already exists
					reloadExtension(extId, callback, onerror);
					return;
				}
			}
			extList.push(extId);
			MP.db.set('extensions', 'list', extList, function () {
				reloadExtension(extId, callback, onerror);
			});
		});
	});
}

function installResearchExtensions(callback, onerror) {
	function installResearchExtension(extName, callback1, onerror1) {
		MePersonality.browser.xhr.get(baseUrl + 'extensions/' + extName + '/manifest.json', function (response) {
			if (response.error) {
				onerror1({ 'error': "Failed to load extension file '" + extName + ".json'", 'cause': response });
				return;
			}
			var extDetails;
			if (!response.json) {
				onerror1({ 'error': "Failed to load extension file '" + extName + ".json'", 'cause': 'The file is not in JSON format.' });
				return;
			}
			extDetails = response.json;
			var scripts = extDetails.scripts || [];
			var code = "";
			extDetails.enabled = true;
			(function rec(i) {
				if (i == scripts.length) {
					extDetails.code = code;
					if (extDetails.options) {
						MePersonality.browser.xhr.get(baseUrl + 'extensions/' + extName + '/' + extDetails.options, function (response) {
							if (response.error) {
								onerror1({ 'error': "Failed to load extension file '" + extName + ".js'", 'cause': response });
								return;
							}
							extDetails.html = response.text;
							addExtension('research' + extName, extDetails, callback1, onerror1);
						});
					} else {
						addExtension('research' + extName, extDetails, callback1, onerror1);
					}
					return;
				}
				MePersonality.browser.xhr.get(baseUrl + 'extensions/' + extName + '/' + scripts[i], function (response) {
					if (response.error) {
						onerror1({ 'error': "Failed to load extension file '" + extName + ".js'", 'cause': response });
						return;
					}
					code += response.text + '\n';
					rec(i + 1);
				});
			})(0);
		});
	}
	var extList = [
		//"tagger_feedback",
		"tab_logger"
		];
	(function next(i) {
		installResearchExtension(extList[i], function () {
			if (i) next(i - 1);
			else if (callback) {
				callback();
			}
		}, onerror);
	})(extList.length - 1);
}

function installLocalExtensions(callback, onerror) {
	function installLocalExtension(extName, callback1, onerror1) {
		MePersonality.browser.xhr.getResource(extName + '/manifest.json', function (response) {
			if (response.error) {
				onerror1({ 'error': "Failed to load extension file 'manifest.json'", 'cause': response });
				return;
			}
			var extDetails;
			extDetails = JSON.parse(response);
			var files = extDetails.files;
			extDetails.files = [];
			var scripts = extDetails.scripts || [];
			var code = "";
			extDetails.enabled = true;
			(function rec(i) {
				if (i == scripts.length) {
					extDetails.code = code;
					if (extDetails.options) {
						MePersonality.browser.xhr.getResource(extName + '/' + extDetails.options, function (response) {
							if (response.error) {
								onerror1({ 'error': "Failed to load extension file '" + extName + ".js'", 'cause': response });
								return;
							}
							extDetails.html = response;
							addExtension('local' + extName, extDetails, callback1, onerror1);
						});
					} else {
						addExtension('local' + extName, extDetails, callback1, onerror1);
					}
					return;
				}
				MePersonality.browser.xhr.getResource(extName + '/' + scripts[i], function (response) {
					if (response.error) {
						onerror1({ 'error': "Failed to load extension file '" + extName + ".js'", 'cause': response });
						return;
					}
					code += response + '\n';
					rec(i + 1);
				});
			})(0);
			(function rec(i) {
				if (i == files.length) {
					addExtension('local' + extName, extDetails, callback1, onerror1);
					return;
				}
				MePersonality.browser.xhr.getResource(extName + '/' + files[i].name, function (response) {
					if (response.error) {
						onerror1({ 'error': "Failed to load extension '" + extName + "', file '"+files[i].name+"'", 'cause': response });
						return;
					}
					extDetails.files.push({
						"name": files[i].name,
						"content": response + '\n',
						"language": "javascript",
						"role": files[i].role
					});
					rec(i + 1);
				});
			})(0);
		});
	}
	var extList = [
		//"tagger_feedback",
		"marius"
		];
	(function next(i) {
		installLocalExtension(extList[i], function () {
			if (i) next(i - 1);
			else if (callback) {
				callback();
			}
		}, onerror);
	})(extList.length - 1);
}

function addTagger(taggerId, taggerDetails, callback, onerror) {
	MP.db.get('taggers', 'list', function (taggerList) {
		if (!taggerList) taggerList = [];
		MP.db.set('taggers', taggerId, taggerDetails, function () {
			for (var i = 0; i < taggerList.length; ++i) {
				if (taggerList[i] == taggerId) {
					// tagger already exists
					reloadTagger(taggerId, callback, onerror);
					return;
				}
			}
			taggerList.push(taggerId);
			MP.db.set('taggers', 'list', taggerList, function () {
				reloadTagger(taggerId, callback, onerror);
			});
		});
	});
}

function installResearchTaggers(callback, onerror) {
	function installResearchTagger(taggerName, callback1, onerror1) {
		MePersonality.browser.xhr.get(baseUrl + 'taggers/' + taggerName + '.json', function (response) {
			if (response.error) {
				onerror1({ 'error': "Failed to load tagger file '" + taggerName + ".json'", 'cause': response });
				return;
			}
			var taggerDetails;
			if (!response.json) {
				onerror1({ 'error': "Failed to load tagger file '" + taggerName + ".json'", 'cause': 'The file is not in JSON format.' });
				return;
			}
			taggerDetails = response.json;
			MePersonality.browser.xhr.get(baseUrl + 'taggers/' + taggerName + '.js', function (response) {
				if (response.error) {
					onerror1({ 'error': "Failed to load tagger file '" + taggerName + ".js'", 'cause': response });
					return;
				}
				taggerDetails.code = response.text;
				taggerDetails.enabled = true;
				addTagger('research' + taggerName, taggerDetails, callback1, onerror1);
			});
		});
	}
	var taggerList = [
		"facebook",
		"gtranslate",
		"youtube",
		"stackoverflow"
			];
	(function next(i) {
		installResearchTagger(taggerList[i], function () {
			if (i) next(i - 1);
			else if (callback) {
				callback();
			}
		}, onerror);
	})(taggerList.length - 1);
}

function checkForUpdate(params, callback) {
	MP.browser.checkForUpdate(params, function (params) {
		if (params.update) {
			This.notify({ title: 'Brumo updater', text: 'Update available. Installing update now.' });
			return;
		}
		if (!MP.browser.debug) {
			if (callback)
		callback({ 'ok': 1 });
	return;
		}
		checkForWordnetUpdate(function (response) {
			if (response.error) {
				MP.browser.notify({ text: 'Error: WordNet update failed.' + (typeof (response.error) == 'string' ? ' ' + response.error : '') });
				if (callback)
			callback({ 'error': 'WordNet update failed.', 'cause': response });
			}
			else if (response.success) {
				MP.browser.notify({ text: 'Wordnet updated successfully.' });
				if (callback)
			callback({ 'success': 1 });
			}
			else if (response.ok && callback)
			callback({ 'ok': 1 });
		});
	});
}
