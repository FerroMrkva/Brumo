var MePersonalityGoogleChromeBrowser = function () {
	var This = this;
	this.init = function (params, callback) {
		chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
			PublicJS.handleMessage(request, sendResponse);
			return true;
		});
		chrome.extension.onConnect.addListener(function (port) {
			var alive = true;
			var onmessage = function (request) {
				PublicJS.handleMessage(request, function (params) {
					if (alive)
					port.postMessage(params);
				});
			};
			var ondisconnect = function (params) {
				port.onMessage.removeListener(onmessage);
				port.onDisconnect.removeListener(ondisconnect);
				alive = false;
			};
			port.onDisconnect.addListener(ondisconnect);
			port.onMessage.addListener(onmessage);
		});
		if (callback)
			callback();
	}
	this.browserName = 'Google Chrome';
	this.debug = true;
	this.notify = function (params) {
		var icon = 'data/logo-short-128.png';
		var title = 'Brumo';
		var text = '';
		if (params.title)
			title = params.title;
		if (params.text)
			text = params.text;
		var notification = webkitNotifications.createNotification(icon, title, text);
		notification.show();
		setTimeout(function () {
			notification.cancel();
		}, 5000);
	}
	this.openTab = function (params) {
		if (!params.url)
			params = { 'url': params };
		chrome.tabs.create(params);
	}
	this.openOptions = function () {
		chrome.tabs.create({ 'url': 'options/options.html' });
	}
	this.getVersion = function () {
		return chrome.app.getDetails().version;
	}
	this.sendRequest = function (params, callback) {
		chrome.extension.sendRequest(params, callback);
	}
	this.checkForUpdate = function (params, callback) {
		callback({});
	}
	this.searchHistory = function (params, callback) {
		if (!params.text)
			params.text = '';
		if (!params.startTime)
			params.startTime = 0;
		if (!params.maxResults)
			params.maxResults=100;
		var getVisits=params.getVisits;
		if (params.getVisits) delete params.getVisits;
		chrome.history.search(params, function (historyItems) {
			var results = [];
			(function rec(i){
				if (i==historyItems.length){
					if (getVisits){
						results.sort(function(a,b){
							return b.time - a.time;
						});
					}
					callback(results.slice(0,params.maxResults));
					return;
				}
				var node = historyItems[i];
				if (getVisits){
					chrome.history.getVisits({'url':node.url},function(visits){
						visits.forEach(function(visit){
							if (visit.visitTime>=params.startTime){
								if (!params.endTime||visit.visitTime<params.endTime){
									results.push({
										id: visit.visitId,
										title: node.title,
										url: node.url,
										visitCount: node.visitCount,
										time: visit.visitTime
									});
								}
							}
						});
						rec(i+1);
					});
				} else {
					results.push({
						id: node.id,
						title: node.title,
						url: node.url,
						visitCount: node.visitCount,
						lastVisitTime: node.lastVisitTime
					});
					rec(i+1);
				}
			})(0);
		});
	}
	this.xhr = {
		getResource: function (params, callback) {
			if (!params.url)
				params = { url: params };
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function () {
				if (xhr.readyState == 4) {
					if (xhr.status == 200) {
						callback(xhr.responseText);
					}
					else {
						callback('');
					}
				}
			};
			xhr.open("GET", chrome.extension.getURL(params.url), true);
			xhr.send(params.data);
		},
		get: function (params, callback) {
			if (!params.url)
				params = { url: params };
			if (params.url.indexOf("://") == -1)
				params.url = "http://" + params.url;
			debug('making request to ' + params.url);
			var xhr = new XMLHttpRequest();
			xhr.onload = function () {
				var responseHeaders = {};
				var tmp = xhr.getAllResponseHeaders().trim().replace(/\r\n/g, '\n').split('\n');
				for (var i = 0; i < tmp.length; ++i) {
					var header = tmp[i];
					var j = header.indexOf(': ');
					responseHeaders[header.substr(0, j)] = header.substr(j + 2);
				}
				var json;
				try {
					json = JSON.parse(xhr.responseText);
				} catch (e) { }
				callback({
					'status': xhr.status,
					'statusText': xhr.statusText,
					'headers': responseHeaders,
					'type': xhr.responseType,
					'response': xhr.response,
					'text': xhr.responseText,
					'json': json
				});
			}
			xhr.onerror = function () {
				callback({ 'error': xhr.status, 'cause': xhr.statusText });
			};
			xhr.open("GET", params.url, true);
			xhr.send(params.data);
		},
		getJSON: function (params, callback) {
			if (!params.url)
				params = { url: params };
			if (params.url.indexOf("://") == -1)
				params.url = "http://" + params.url;
			debug('making request to JSON ' + params.url);
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function () {
				if (xhr.readyState == 4) {
					if (xhr.status == 200) {
						callback(JSON.parse(xhr.responseText));
					}
					else {
						callback();
					}
				}
			};
			xhr.open("GET", params.url, true);
			xhr.send(params.data);
		},
		post: function (params, callback) {
			if (!params.url)
				params = { url: params };
			if (params.url.indexOf("://") == -1)
				params.url = "http://" + params.url;
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function () {
				if (xhr.readyState == 4) {
					if (xhr.status == 200) {
						callback(xhr.responseText);
					}
					else {
						callback('');
					}
				}
			};
			xhr.open("POST", params.url, true);
			xhr.send(params.data);
		}
	}
	this.tabs = {
		getCurrent: function (callback) {
			chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
				var tab = tabs[0];
				callback({
					id: tab.id,
					url: tab.url,
					title: tab.title,
					index: tab.index,
					pinned: tab.pinned
				});
			});
		},
		create: function (params) {
			if (!params.url)
				params = { 'url': params };
			chrome.tabs.create(params);
		},
		openOptions: function () {
			chrome.tabs.create({ 'url': 'options/options.html' });
		}
	}
	this.browserAction = new function () {
		chrome.browserAction.onClicked.addListener(function () {
			MePersonality.browser.tabs.openOptions();
		});
	}
}

var MePersonalityMozillaFirefoxBrowser = function () {
	var This = this;
	var self = require("sdk/self");
	var data = self.data;
	var pageMod = require("sdk/page-mod");
	var pageWorker = require("sdk/page-worker");
	var tabs = require("sdk/tabs");
	var notifications = require("sdk/notifications");
	var timers = require("sdk/timers");
	var requests = require("sdk/request");
	var ss = require("sdk/simple-storage");
	var widgets = require("sdk/widget");
	var panel = require("sdk/panel");
	var browserAction = require('browserAction').BrowserAction({
		default_icon: data.url('Brumo.png'),
			default_title: 'Brumo',
	});
	var __temp = require('chrome');
	var Cc = __temp.Cc;
	var Ci = __temp.Ci;
	var Cu = __temp.Cu;
	var historyService = Cc["@mozilla.org/browser/nav-history-service;1"].getService(Ci.nsINavHistoryService);
	this.init = function (params, callback) {
		Cu.import("resource://gre/modules/AddonManager.jsm");
		Cu.import("resource://gre/modules/Services.jsm");
		Cu.import("resource://gre/modules/FileUtils.jsm");
		PublicJS.Cc = Cc;
		PublicJS.Ci = Ci;
		PublicJS.Cu = Cu;
		setTimeout = timers.setTimeout;
		clearTimeout = timers.clearTimeout;
		setInterval = timers.setInterval;
		clearInterval = timers.clearInterval;
		function bgConnector() {
			var hiddenLoaded = false;
			var hidden = pageWorker.Page({
				contentURL: data.url("hidden.html"),
					onError: function (e) {
						console.error('Error in hidden page!!!');
						console.error(e.message);
					}
			});

			var handleMessage = function (request, sendResponse) {
				if (request.type == 'db') {
					// Database queries
					if (request.command == 'clear') {
						MePersonality.db.clear(request.table, sendResponse);
					}
					else if (request.command == 'get') {
						MePersonality.db.get(request.table, request.key, sendResponse);
					}
					else if (request.command == 'set') {
						MePersonality.db.set(request.table, request.key, request.value, sendResponse);
					}
					else if (request.command == 'remove') {
						MePersonality.db.remove(request.table, request.key, sendResponse);
					}
					else if (request.command == 'getTransaction') {
						MePersonality.db.getTransaction(sendResponse);
					}
				}
			}

			hidden.port.on("hidden", function (e) {
				if (e == 'loaded')
				hiddenLoaded = true;
			});

			hidden.port.on('message', function (request) {
				var requestID = request._requestID;
				handleMessage(request, function (params) {
					hidden.port.emit('message' + requestID, params);
				});
			});

			hidden.port.on("debug", function (e) {
				console.log(e);
			});

			hidden.port.on("error", function (e) {
				console.error(e);
			});
			hidden.on("error", function (e) {
				console.error(e);
			});

			hidden.port.on("getRequest", function (params) {
				requests.Request({
					url: params.url,
					content: params.data,
					onComplete: function (response) {
						hidden.port.emit("getResponse" + params._requestID, response.text);
					}
				}).get();
			});

			hidden.port.on("postRequest", function (params) {
				requests.Request({
					url: params.url,
					content: params.data,
					onComplete: function (response) {
						hidden.port.emit("postResponse" + params._requestID, response.text);
					}
				}).post();
			});

			var counter = 0;

			function sendMessage(params, callback, multipleResponses) {
				if (!hiddenLoaded) {
					setTimeout(function () {
						sendMessage(params, callback, multipleResponses);
					}, 10);
					return;
				}
				var requestID = ('' + Math.random()).substr(2) + counter++;
				params._requestID = requestID;
				hidden.port.emit("message", params);
				if (callback) {
					if (multipleResponses) {
						var _callback;
						_callback = function (params) {
							callback(params);
							if (params._removeCallback)
								hidden.port.removeListener("message" + requestID, _callback);
						};
						hidden.port.on("message" + requestID, _callback);
					}
					else {
						hidden.port.once("message" + requestID, callback);
					}
				}
			}

			MePersonality.tagger = {
				extractArticle:
					function (params, callback) {
						if (!callback)
							callback = function (details) {
								console.log(details);
							};
						sendMessage({
							type: 'tagger',
							command: 'extractArticle',
							'params': params
						}, callback);
					},
				getLanguage:
					function (params, callback) {
						if (!callback)
							callback = function (details) {
								console.log(details);
							};
						sendMessage({
							type: 'tagger',
							command: 'getLanguage',
							'params': params
						}, callback);
					},
				getWords:
					function (params, callback) {
						if (!callback)
							callback = function (details) {
								console.log(details);
							};
						sendMessage({
							type: 'tagger',
							command: 'getWords',
							'params': params
						}, callback);
					},
				getPOStags:
					function (params, callback) {
						if (!callback)
							callback = function (details) {
								console.log(details);
							};
						sendMessage({
							type: 'tagger',
							command: 'getPOStags',
							'params': params
						}, callback);
					},
				synsetRank:
					function (params, callback) {
						if (!callback)
							callback = function (details) {
								console.log(details);
							};
						sendMessage({
							type: 'tagger',
							command: 'synsetRank',
							'params': params
						}, callback);
					},
				getTags:
					function (params, callback) {
						sendMessage({
							type: 'tagger',
						command: 'getTags',
						'params': params
						}, callback);
					},
				reloadTagger:
					function (taggerId, callback) {
						sendMessage({
							type: 'tagger',
						command: 'reloadTagger',
						'taggerId': taggerId
						}, callback);
					},
				removeTagger:
					function (taggerId, callback) {
						sendMessage({
							type: 'tagger',
						command: 'removeTagger',
						'taggerId': taggerId
						}, callback);
					}
			};

			MePersonality.translator = {
				translate: function (text, callback, sl, tl) {
					console.log('translating');
					sendMessage({
						type: 'translator',
						command: 'translate',
						'text': text,
						sourceLanguage: sl,
						sourceLanguage: tl
					}, function (params) {
						console.log('translated');
						console.log(params);
					});

				}
			}

			MePersonality.ngrams = {
				getFrequency: function (word, callback) {
					sendMessage({
						type: 'ngrams',
					command: 'getFrequency',
					'word': word
					}, callback, true);
				}
			}

			MePersonality.net = function () {
				this._connect = function (params, callback) {
					sendMessage({
						type: 'net',
					command: '_connect',
					'params': params
					}, callback, true);
				};
				this.connect = function (params, callback) {
					sendMessage({
						type: 'net',
						command: 'connect',
						'params': params
					}, callback, true);
				};
				this._send = function (params, callback) {
					sendMessage({
						type: 'net',
						command: '_send',
						'params': params
					}, callback);
				};
				this.send = function (params, callback) {
					sendMessage({
						type: 'net',
						command: 'send',
						'params': params
					}, callback);
				};
				this._disconnect = function (params, callback) {
					sendMessage({
						type: 'net',
						command: '_disconnect',
						'params': params
					}, callback);
				};
				this.disconnect = function (params, callback) {
					sendMessage({
						type: 'net',
						command: 'disconnect',
						'params': params
					}, callback);
				};
			};
			MePersonality.net = new MePersonality.net();
		}
		function handleWorker(worker) {
			var alive = true;
			worker.on('message', function (request) {
				var requestID = request._requestID;
				PublicJS.handleMessage(request, function (params) {
					if (alive)
					worker.port.emit('message' + requestID, params);
				});
			});
			worker.on('detach', function () {
				alive = false;
			});
			//worker.tab.on('ready', function (tab) {
			//	console.log('tab ' + tab.url + ' ready');
			//});
			//worker.tab.on('activate', function (tab) {
			//	console.log('tab ' + tab.url + ' activate');
			//});
			//worker.tab.on('deactivate', function (tab) {
			//	console.log('tab ' + tab.url + ' deactivate');
			//});
			//worker.tab.on('close', function (tab) {
			//	console.log('tab ' + tab.url + ' close');
			//});
		}
		pageMod.PageMod({
			include: new RegExp(self.data.url("options/options.html") + '.*'),
		contentScriptFile: [self.data.url('external/jquery-2.0.3.min.js'), self.data.url('external/jquery-ui-1.10.3.custom.min.js'), self.data.url('content.js')],
		onAttach: function (worker) {
			handleWorker(worker);
		}
		});
		pageMod.PageMod({
			include: new RegExp('(?!' + self.data.url("options/options.html") + ').*'),
			contentScriptFile: [self.data.url('external/jquery-2.0.3.min.js'), self.data.url('external/jquery-ui-1.10.3.custom.min.js'), self.data.url('content.js'), self.data.url('extContent.js')],
			onAttach: function (worker) {
				handleWorker(worker);
			}
		});
		var widget = widgets.Widget({
			id: "options-link",
				label: "Brumo options",
				contentURL: data.url("Brumo.png"),
				onClick: function () {
					tabs.open(self.data.url("options/options.html"));
				}
		});
		for (var i = 0; i < tabs.length; ++i) {
			if (tabs[i].url.indexOf(data.url("options/options.html")) == 0) {
				var worker = tabs[i].attach({
					contentScriptFile: [self.data.url('external/jquery-1.7.js'), self.data.url('content.js')]
				});
				handleWorker(worker);
			}
		}
		bgConnector();
		if (callback)
			callback();
	}
	this.browserName = 'Mozilla Firefox';
	this.debug = true;
	var notificating = false;
	this.notify = function (params) {
		if (notificating) {
			setTimeout(This.notify, 200, params);
			return;
		}
		notificating = true;
		var icon = data.url('logo-short-128.png');
		var title = 'Brumo';
		var text = '';
		if (params.title)
			title = params.title;
		if (params.text)
			text = params.text;
		notifications.notify({
			'title': title,
			'text': text,
			'iconURL': icon
		});
		setTimeout(function () {
			notificating = false;
		}, 5000);
	}
	this.openTab = function (params) {
		if (!params.url)
			params = { 'url': params };
		tabs.open(params.url);
	}
	this.openOptions = function () {
		tabs.open(data.url('options/options.html'));
	}
	this.getId = function () {
		return self.id;
	}
	this.getName = function () {
		return self.name;
	}
	this.getVersion = function () {
		return self.version;
	}
	this.getAppVersion = function () {
		var appInfo = Cc["@mozilla.org/xre/app-info;1"]
			.getService(Ci.nsIXULAppInfo);
		return appInfo.version;
	}
	this.getPlatformVersion = function () {
		var info = Cc["@mozilla.org/xre/app-info;1"]
			.getService(Ci.nsIXULAppInfo);
		return info.platformVersion;
	}
	this.sendRequest = function (params, callback) {
		self.postMessage(params);
		self.once("message", callback);
	}
	this.checkForUpdate = function (params, callback) {
		console.log('Checking for updates...');
		AddonManager.getAddonByID(This.getId(), function (addon) {
			addon.findUpdates({
				onUpdateAvailable:
				function (addon, addonInstall) {
					console.log('Update available.');
					callback({ 'update': true });
					if (params.installUpdate) {
						console.log('Installing update.');
						addonInstall.install();
					}
				},
				onNoUpdateAvailable:
				function (addon) {
					callback({});
					//This.notify({ title: 'Brumo updater', text: 'No update available.' });
					console.log('No update available.');
				},
				onCompatibilityUpdateAvailable:
				function (addon) {
					console.log('Compatibility update available.');
				},
				onNoCompatibilityUpdateAvailable:
					function (addon) {
						console.log('No compatibility update available.');
					},
				onUpdateFinished:
					function (addon, err) {
						if (err) {
							console.error(err);
							//This.notify({ title: 'Brumo updater', text: err });
						}
						console.log('Update finished.');
					}
			},
				1,
				This.getAppVersion(),
				This.getPlatformVersion());
		});
	}
	this.searchHistory = function (params, callback) {
		var query = historyService.getNewQuery();
		if (params.text)
			query.searchTerms = params.text;
		if (params.startTime) {
			query.beginTimeReference = query.TIME_RELATIVE_NOW;
			query.beginTime = 0;
			query.endTimeReference = query.TIME_RELATIVE_EPOCH;
			query.endTime = params.startTime;
		}
		if (!params.maxResults)
			params.maxResults=100;
		var queryOptions = historyService.getNewQueryOptions();
		queryOptions.sortingMode = queryOptions.SORT_BY_DATE_DESCENDING;
		queryOptions.maxResults = params.maxResults;
		if (params.getVisits)
			queryOptions.resultType = queryOptions.RESULTS_AS_VISIT;
		var result = historyService.executeQuery(query, queryOptions);
		var cont = result.root;
		cont.containerOpen = true;
		var results = [];
		(function go(i) {
			if (i == cont.childCount) {
				cont.containerOpen = false;
				if (params.getVisits){
					results.sort(function(a,b){
						return b.time - a.time;
					});
				}
				callback(results.slice(0,params.maxResults));
				return;
			}
			var node = cont.getChild(i);
			var resultType='url';
			if (params.getVisits){
				resultType='visit';
				if (node.time<params.startTime||(params.endTime&&node.time>=params.endTime)){
					go(i+1);
					return;
				}
			}
			MePersonality.db.get(resultType, node.uri, function (itemId) {
				if (itemId) {
					var result={
						id: itemId,
						title: node.title,
						url: node.uri,
						visitCount: node.accessCount
					};
					if (params.getVisits){
						result.time = node.time;
					}
					else {
						result.lastVisitTime = node.time;
					}
					results.push(result);
					go(i+1);
				}
				else {
					MePersonality.db.get(resultType, 'count', function (itemCount) {
						if (!itemCount) itemCount = 0;
						itemId = itemCount + 1;
						MePersonality.db.set(resultType, node.uri, itemId, function () {
							MePersonality.db.set(resultType, 'count', itemCount + 1, function () {
								var result={
									id: itemId,
									title: node.title,
									url: node.uri,
									visitCount: node.accessCount
								};
								if (params.getVisits){
									result.time = node.time;
								}
								else {
									result.lastVisitTime = node.time;
								}
								results.push(result);
								go(i+1);
							});
						});
					});
				}
			});
		})(0);
	}
	this.xhr = {
		getResource: function (params, callback) {
			if (!params.url)
				params = { url: params };
			requests.Request({
				url: data.url(params.url),
				content: params.data,
				onComplete: function (response) {
					callback(response.text);
				}
			}).get();
		},
		get: function (params, callback) {
			if (!params.url)
				params = { url: params };
			if (params.url.indexOf("://") == -1)
				params.url = "http://" + params.url;
			var request = requests.Request({
				url: params.url,
					content: params.data,
					onComplete: function (response) { // TODO: onerror
						callback({
							'status': response.status,
						'statusText': response.statusText,
						'headers': response.headers,
						'type': request.contentType, // TODO: check its correctness
						'response': request.content, // TODO: --//--
						'text': response.text,
						'json': response.json
						});
					}
			}).get();
		},
		getJSON: function (params, callback) {
			if (!params.url)
				params = { url: params };
			if (params.url.indexOf("://") == -1)
				params.url = "http://" + params.url;
			requests.Request({
				url: params.url,
				content: params.data,
				onComplete: function (response) { // TODO: checksum
					callback(JSON.parse(response.text));
				}
			}).get();
		},
		post: function (params, callback) {
			if (!params.url)
				params = { url: params };
			if (params.url.indexOf("://") == -1)
				params.url = "http://" + params.url;
			requests.Request({
				url: params.url,
				content: params.data,
				onComplete: function (response) {
					callback(response.text);
				}
			}).post();
		}
	}
	this.tabs = {
		getCurrent: function (callback) {
			var tab = tabs.activeTab;
			callback({
				id: tab.id,
				url: tab.url,
				title: tab.title,
				index: tab.index,
				pinned: tab.isPinned
			});
		},
		create: function (params) {
			if (!params.url)
				params = { 'url': params };
			tabs.open(params.url);
		},
		openOptions: function () {
			tabs.open(data.url('options/options.html'));
		}
	}
	this.browserAction = new function () {
		browserAction.onClicked.addListener(function () {
			MePersonality.browser.tabs.openOptions();
		});
	}
}

var MePersonalityOperaBrowser = function () {
	var This = this;
	this.init = function (params, callback) {
		MePersonality.translator = new MePersonalityTranslator();
		MePersonality.ngrams = new MePersonalityNgrams();
		MePersonality.tagger = new MePersonalityTagger();
		MePersonality.net = new MePersonalityNet();
		var alive = true;
		worker.on('message', function (request) {
			var requestID = request._requestID;
			PublicJS.handleMessage(request, function (params) {
				if (alive)
				worker.port.emit('message' + requestID, params);
			});
		});
		worker.on('detach', function () {
			alive = false;
		});
		opera.extension.addEventListener("message", function (request) {
			var requestID = request.requestID;
			PublicJS.handleMessage(request.params, function (params) {
				if (alive)
				opera.extension.broadcastMessage('message', { 'requestID': requestID, 'params': params });
			});
		});
		opera.extension.onmessage = function () {
		}
		chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
			PublicJS.handleMessage(request, sendResponse);
			return true;
		});
		chrome.extension.onConnect.addListener(function (port) {
			var alive = true;
			port.onDisconnect = function () {
				alive = false;
			}
			port.onMessage.addListener(function (request) {
				PublicJS.handleMessage(request, function (params) {
					if (alive)
					port.postMessage(params);
				});
			});
		});
		if (callback)
			callback();
	}
	this.browserName = 'Opera';
	this.notify = function (params) {
		var icon = 'data/logo-short-128.png';
		var title = 'Brumo';
		var text = '';
		if (params.title)
			title = params.title;
		if (params.text)
			text = params.text;
		var notification = webkitNotifications.createNotification(icon, title, text);
		notification.show();
		setTimeout(function () {
			notification.cancel();
		}, 5000);
	}
	this.openTab = function (url) {
		opera.extension.tabs.create({ 'url': url });
	}
	this.openOptions = function () {
		opera.extension.tabs.create({ 'url': 'options/options.html' });
	}
	this.getVersion = function () {
		return chrome.app.getDetails().version;
	}
	this.sendRequest = function (params, callback) {
		chrome.extension.sendRequest(params, callback);
	}
	this.checkForUpdate = function (params, callback) {
		callback({});
	}
	this.searchHistory = function (params, callback) {
		if (!params.text)
			params.text = '';
		if (!params.startTime)
			params.startTime = 0;
		chrome.history.search(params, function (historyItems) {
			var results = [];
			for (var i = 0; i < historyItems.length; ++i) {
				var node = historyItems[i];
				results.push({
					id: node.id,
					title: node.title,
					url: node.url,
					visitCount: node.visitCount,
					lastVisitTime: node.lastVisitTime
				});
			}
			callback(results);
		});
	}
	this.xhr = {
		getResource: function (params, callback) {
			if (!params.url)
				params = { url: params };
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function () {
				if (xhr.readyState == 4) {
					if (xhr.status == 200) {
						callback(xhr.responseText);
					}
					else {
						callback('');
					}
				}
			};
			xhr.open("GET", chrome.extension.getURL(params.url), true);
			xhr.send(params.data);
		},
		get: function (params, callback) {
			if (!params.url)
				params = { url: params };
			if (params.url.indexOf("://") == -1)
				params.url = "http://" + params.url;
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function () {
				if (xhr.readyState == 4) {
					if (xhr.status == 200) {
						callback(xhr.responseText);
					}
					else {
						callback('');
					}
				}
			};
			xhr.open("GET", params.url, true);
			xhr.send(params.data);
		},
		getJSON: function (params, callback) {
			if (!params.url)
				params = { url: params };
			if (params.url.indexOf("://") == -1)
				params.url = "http://" + params.url;
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function () {
				if (xhr.readyState == 4) {
					if (xhr.status == 200) {
						callback(JSON.parse(xhr.responseText));
					}
					else {
						callback();
					}
				}
			};
			xhr.open("GET", params.url, true);
			xhr.send(params.data);
		},
		post: function (params, callback) {
			if (!params.url)
				params = { url: params };
			if (params.url.indexOf("://") == -1)
				params.url = "http://" + params.url;
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function () {
				if (xhr.readyState == 4) {
					if (xhr.status == 200) {
						callback(xhr.responseText);
					}
					else {
						callback('');
					}
				}
			};
			xhr.open("POST", params.url, true);
			xhr.send(params.data);
		}
	}
}

