// vyzaduje MePersonalityRadixTrie (radixTrie.js)

MePersonalityIndexer = function () {
	var userDomains = {};
	var userDomainsCount = 0;
	var userTimedTags = [];
	var userTags = new MePersonalityRadixTrie(); // user interests
	// userTags.value = {maxRel, rel, urls}
	var domainTags = new MePersonalityRadixTrie(); // user interests indexed by domain
	// domainTags.value = {maxFreq, bestTags, urlId}
	// pri ukladani do databazy (MePersonalityRadixTrie.store) mozno pouzit wrapper
	// pre povodny objekt MePersonalityDatabase
	var state = {};
	this.getState = function () {
		return state;
	}
	this.clear = function () {
		state = {};
		userDomains = {};
		userDomainsCount = 0;
		userTimedTags = [];
		userTags = new MePersonalityRadixTrie();
		domainTags = new MePersonalityRadixTrie();
	}
	this.load = function () {
		userDomains = {};
		MePersonality.db.get('ud', 'pocet', function (pocet) {
			if (!pocet) {
				userTags = new MePersonalityRadixTrie();
				domainTags = new MePersonalityRadixTrie();
				return;
			}
			userDomainsCount = pocet;
			while (pocet-- > 0) {
				MePersonality.db.get('ud', pocet, function (domainInfo) {
					userDomains[domainInfo.domain] = [domainInfo.visits, 0];
				});
			}
		});
		userTags.load(MePersonality.db, 'ut');
		domainTags.load(MePersonality.db, 'dt');
		MePersonality.db.get('info', 'indexerState', function (_state) {
			state = _state;
		});
	}
	this.save = function () {
		var pocet = userDomainsCount;
		MePersonality.db.set('ud', 'pocet', pocet);
		function setDomain(domain) {
			if (userDomains[domain][1]) {
				MePersonality.db.set('ud', --pocet,
						{ 'domain': domain, 'visits': userDomains[domain][0] },
						function () {
							userDomains[domain][1] = 0;
						});
			}
		}
		for (var domain in userDomains) {
			setDomain(domain);
		}
		userTags.store(MePersonality.db, 'ut');
		domainTags.store(MePersonality.db, 'dt');
		MePersonality.db.set('info', 'indexerState', state);
	}
	this.getDomain = function (url) {
		return /https?:\/\/.+\.[a-z]+\//.exec(url)[0];
	}

	function addUrl(params) {
		var tag = params.tag;
		var relevancy = params.relevancy;
		if (!relevancy) {
			console.error('bad relevancy ' + relevancy);
			return;
		}
		var v = domainTags.addWord(params.url, function (parentNode, childNode, splitNode) {
			if (childNode.value.maxRel)
			splitNode.value.maxRel = childNode.value.maxRel;
		if (childNode.value.minRel)
			splitNode.value.minRel = childNode.value.minRel;
		});
		if (v.value.tags) {
			if (v.value.tags[tag])
				v.value.tags[tag] += relevancy;
			else
				v.value.tags[tag] = relevancy;
			v.value.rel += relevancy;
		}
		else {
			v.value.tags = {};
			v.value.tags[tag] = relevancy;
			v.value.rel = relevancy;
		}
		v.value.title = params.title;
		domainTags.updatePath(params.url, function (node) {
			if (!node.value.maxRel || node.value.maxRel < v.value.rel)
			node.value.maxRel = v.value.rel;
		if (!node.value.minRel || node.value.minRel > v.value.rel)
			node.value.minRel = v.value.rel;
		});
	}

	this.addTimedTag = function(params,callback){
		userTimedTags.push(params);
		if (callback) callback();
	}

	this.addTag = function (params) {
		var tag = params.tag;
		var urlId = params.urlId;
		var url = params.url;
		var title = params.title;
		var relevancy = params.relevancy;
		var actuality = params.actuality;
		// update userTags
		if (relevancy != 0 && !relevancy) {
			console.log(params);
			console.error('bad relevancy ' + urlId);
			return;
		}
		var v = userTags.addWord(tag, function (parentNode, childNode, splitNode) {
			if (childNode.value.maxRel)
			splitNode.value.maxRel = childNode.value.maxRel;
		if (childNode.value.minRel)
			splitNode.value.minRel = childNode.value.minRel;
		});
		if (v.value.urls) {
			if (v.value.urls[urlId])
				v.value.urls[urlId] += relevancy;
			else
				v.value.urls[urlId] = relevancy;
			v.value.rel += relevancy;
		}
		else {
			v.value.urls = {};
			v.value.urls[urlId] = relevancy;
			v.value.rel = relevancy;
		}
		v.value.rel = Math.round(v.value.rel * 1000) / 1000;
		if (actuality)
			if (v.value.actuality || actuality > v.value.actuality)
				v.value.actuality = actuality;
		userTags.updatePath(tag, function (node) {
			if (!node.value.maxRel || node.value.maxRel < v.value.rel)
			node.value.maxRel = v.value.rel;
		if (!node.value.minRel || node.value.minRel > v.value.rel)
			node.value.minRel = v.value.rel;
		});
		// update domainTags
		addUrl(params);
		url = url.substr(url.indexOf('//') + 2);
		var b = url.indexOf('/');
		var domain = url.substr(0, b);
		do {
			params['url'] = domain;
			addUrl(params);
			domain = domain.substr(domain.indexOf('.') + 1);
		} while (domain.indexOf('.') != -1);
		for (; b != -1; b = url.indexOf('/', b + 1)) {
			params['url'] = url.substr(0, b);
			addUrl(params);
		}
		params['url'] = url;
		addUrl(params);
	}

	this.removeUrl = function (url) {
		var innerNode = domainTags.removeWord(url);
		if (innerNode && innerNode.value) {
			delete innerNode.value;
			innerNode.value = {};
			for (var i in innerNode.children) {
				var v = innerNode.children[i];
				if (v.value.maxRel)
					if (!innerNode.value.maxRel || v.value.maxRel > innerNode.value.maxRel)
						innerNode.value.maxRel = v.value.maxRel;
				if (v.value.minRel)
					if (!innerNode.value.minRel || v.value.minRel < innerNode.value.minRel)
						innerNode.value.minRel = v.value.minRel;
			}
		}
	}

	this.removeTag = function (tag) {
		var innerNode = userTags.removeWord(tag);
		if (innerNode && innerNode.value) {
			delete innerNode.value;
			innerNode.value = {};
			for (var i in innerNode.children) {
				var v = innerNode.children[i];
				if (v.value.maxRel)
					if (!innerNode.value.maxRel || v.value.maxRel > innerNode.value.maxRel)
						innerNode.value.maxRel = v.value.maxRel;
				if (v.value.minRel)
					if (!innerNode.value.minRel || v.value.minRel < innerNode.value.minRel)
						innerNode.value.minRel = v.value.minRel;
			}
		}
	}

	this.addVisit = function (url) {
		// TODO: visits within domainTags
		var domain = url;
		if (userDomains[domain]) {
			userDomains[domain][0]++; // count
			userDomains[domain][1] = 1; // changed
		}
		else {
			userDomains[domain] = [1, 1]; // [count,changed]
			userDomainsCount++;
		}
	}

	this.getTagRelevancy = function (tag, callback) {
		var v = userTags.search(tag);
		var relevancy = v && v.value.rel;
		if (!relevancy)
			callback(0);
		else
			callback(relevancy);
	}

	this.getTagDetails = function (tag, callback) {
		var v = userTags.search(tag);
		if (!v || !v.value) {
			callback(undefined);
			return;
		}
		callback({
			'tag': tag,
			'relevancy': v.value.rel,
			'actuality': v.value.actuality
		});
	}

	this.getUrlDetails = function (url, callback) {
		MePersonality.browser.searchHistory({
			'maxResults': 1000
		}, function (res) {
			if (res) {
				for (var i = 0; i < res.length; ++i) {
					if (res[i].url == url) {
						callback(res[i]);
						return;
					}
				}
			}
			callback(undefined);
		});
	}

	this.getUrlsByTag = function (tag, count, callback) {
		if (!count)
			count = 10;
		var v = userTags.search(tag);
		var urls = v && v.value.urls;
		if (!urls)
			return [];
		var sorted = [];
		MePersonality.browser.searchHistory({
			'maxResults': 1000
		}, function (res) {
			if (res) {
				for (var i = 0; i < res.length; ++i) {
					if (res[i].url && urls[res[i].id]) {
						// [urlId,relevancy]
						sorted.push({
							'url': res[i].url,
							'relevancy': urls[res[i].id]
						});
					}
				}
				sorted.sort(function (a, b) {
					if (a.relevancy != b.relevancy) {
						return b.relevancy - a.relevancy;
					}
					return a.url < b.url;
				});
			}
			//console.log('get urls by tag ' + tag);
			//console.log(JSON.stringify(sorted.slice(0, count)));
			callback(sorted.slice(0, count));
		});
	}

	this.getTagsByUrl = function (url, count, callback) {
		if (!count)
			count = 10;
		var v = domainTags.search(url);
		var tags = v && v.value.tags;
		var sorted = [];
		for (var tag in tags) {
			sorted.push({
				'tag': tag,
				'relevancy': tags[tag]
			});
		}
		sorted.sort(function (a, b) {
			if (a.relevancy != b.relevancy)
			return b.relevancy - a.relevancy;
		return a.tag < b.tag;
		});
		callback(sorted.slice(0, count));
	}

	this.getDomains = function (count, callback) {
		if (!count)
			count = 10;
		var sorted = [];
		for (var domain in userDomains) {
			sorted.push({
				'url': domain,
				'relevancy': userDomains[domain][0]
			});
		}
		sorted.sort(function (a, b) {
			if (a.relevancy != b.relevancy)
			return b.relevancy - a.relevancy;
		return a.url < b.url;
		});
		callback(sorted.slice(0, count));
	}

	this.getVisitCount = function (url) {
		var v = domainTags.search(url);
		if (!v || !v.value.visits)
			return 0;
		return v.value.visits;
	}

	this.getUserTimedTags = function (params, callback) {
		if (!params.count){
			params.count=20;
		}
		if (!params.unitSize){
			params.unitSize=24*60*60*1000; // one day in milliseconds
		}
		if (!params.unitCount){
			params.unitCount=5;
		}
		if (!params.startTime){
			if (!params.endTime){
				var x=new Date();
				params.endTime=x.valueOf()-(x.valueOf()-x.getTimezoneOffset()*60000)%params.unitSize+params.unitSize;
			}
			params.startTime=params.endTime-params.unitSize*params.unitCount;
		}
		var results=[];
		for(var i=0;i<params.unitCount;++i){
			results.push({});
		}
		userTimedTags.forEach(function(item){
			var k=Math.floor((item.time-params.startTime)/params.unitSize);
			if (k>=0&&k<params.unitCount){
				if (typeof(results[k][item.tag])!='number'){
					results[k][item.tag]=item.relevancy;
				} else {
					results[k][item.tag]+=item.relevancy;
				}
			}
		});
		for(var i=0;i<params.unitCount;++i){
			var sorted=[];
			for(var key in results[i]){
				sorted.push([key,results[i][key]]);
			}
			sorted.sort(function(a,b){
				return b[1]-a[1];
			});
			results[i]=sorted.slice(0,params.count);
		}
		callback(results);
	}

	this.getUserTags = function (count, callback) {
		if (!count)
			count = 10;
		var results = [];
		var h = new MePersonalityHeap(function (a, b) {
			return a[0].value.maxRel > b[0].value.maxRel;
		});
		var h2 = new MePersonalityHeap(function (a, b) {
			return a[0] > b[0];
		});
		h.push([userTags.root(), '']);
		while (h.count() > 0) {
			var v = h.pop();
			if (v[0].value.rel)
				h2.push([v[0].value.rel, v[1]]);
			while (h2.count() > 0) {
				var v2 = h2.top();
				if (v2[0] < v[0].value.maxRel)
					break;
				h2.pop();
				results.push({ 'tag': v2[1], 'relevancy': v2[0] });
				if (results.length == count) {
					callback(results);
					return;
				}
			}
			var len = v[0].children.length;
			for (var i = 0; i < len; ++i) {
				if (v[0].children[i])
					h.push([v[0].children[i], v[1] + v[0].next[i]]);
			}
		}
		callback(results);
	}

	this.getUserTagsByDomain = function (domain, count, callback) {
		if (!count)
			count = 10;
		var v = domainTags.prefixSearch(domain);
		var tags = v && v.value.tags;
		if (!tags)
			return [];
		var sorted = [];
		for (var tag in tags) {
			sorted.push({
				'tag': tag,
				'relevancy': tags[tag]
			});
		}
		sorted.sort(function (a, b) {
			if (a.relevancy != b.relevancy)
			return b.relevancy - a.relevancy;
		return a.tag < b.tag;
		});
		callback(sorted.slice(0, count));
	}

	this.addIndex = function (params, callback) {
		var urlId = params.urlId;
		var url = params.url;
		var count = params.count;
		var actuality = params.actuality;
		if (!count)
			return;
		MePersonality.browser.xhr.get({ 'url': url }, function (response) {
			MePersonality.tagger.getTags({
				'url': url,
				'html': response.text
			}, function (params) {
				if (state.cancelled||params.error) {
					if (callback)
						callback(params);
					return;
				}
				var tags = params.tags;
				var rels = params.rels;
				function addVisits(url) {
					var q = url.indexOf('?');
					if (q != -1) {
						url = url.substr(0, q);
					}
					MePersonality.indexer.addVisit(url);
					url = url.substr(url.indexOf('//') + 2);
					var b = url.indexOf('/');
					var domain = url.substr(0, b);
					do {
						MePersonality.indexer.addVisit(domain);
						domain = domain.substr(domain.indexOf('.') + 1);
					} while (domain.indexOf('.') != -1);
					for (; b != -1; b = url.indexOf('/', b + 1)) {
						MePersonality.indexer.addVisit(url.substr(0, b));
					}
					MePersonality.indexer.addVisit(url);
				}
				addVisits(params.url);
				for (var j = 0; j < tags.length; ++j) {
					if (tags[j] == '')
						continue;
					if (!count || !rels[j]) {
						console.log('zly tag ' + tags[j] + ' ' + count + ' ' + rels[j]);
						continue;
					}
					MePersonality.indexer.addTag({
						'tag': tags[j],
						'urlId': urlId,
						'url': params.url,
						'title': params.title,
						'relevancy': count * rels[j],
						'actuality': actuality
					});
				}
				if (callback)
					callback();
			});
		});
	}

	this.indexHistory = function (countLimit) {
		if (!countLimit)
			countLimit = 1000;
		state.cancelled = false;
		// TODO: clear the database, check for last update, etc.
		MePersonality.browser.searchHistory({
			'maxResults': countLimit,
			'getVisits': 1
		},
		function (historyItems) {
			state.total = historyItems.length;
			state.current = 0;
			state.timer = 0;
			state.lastId = historyItems[0].id;
			var startTime = new Date();
			var t, i = 0;
			var MAXCONCURRENT = 5;
			(function nextItem() {
				if (state.cancelled || i == historyItems.length) {
					return;
				}
				if (i - state.current < MAXCONCURRENT) {
					console.log('i='+i);
					console.log(historyItems[i]);
					var count = 1; //historyItems[i].visitCount;
					if (!count) count = 1;
					var urlId = historyItems[i].id;
					//MePersonality.db.set('url',urlId,historyItems[i].url);
					MePersonality.indexer.addIndex({
						'urlId': urlId,
						'url': historyItems[i].url,
						'count': count,
						'actuality': historyItems[i].lastVisitTime
					}, function () {
						state.current++;
						state.timer = new Date() - startTime;
						if (state.current==historyItems.length) {
							console.log("indexer.save");
							MePersonality.indexer.save();
						}
					});
					++i;
				}
				if (i - state.current == MAXCONCURRENT)
					t = setTimeout(nextItem, 10);
				else
					t = setTimeout(nextItem, 0);
			})();
		});
	}

	this.indexHistoryByTime = function(params,callback){
		if (!params.maxResults)
			params.maxResults = 1000;
		if (params.clearHistoryCache){
			MePersonality.db.clear('keyword_cache',function(){
				delete params.clearHistoryCache;
				MePersonality.indexer.indexHistoryByTime(params,callback);
			});
			return;
		}
		userTimedTags = [];
		state.cancelled = false;
		MePersonality.browser.searchHistory({
			'maxResults': params.maxResults,
			'getVisits': 1
		},function(historyItems){
			state.total = historyItems.length;
			state.current = 0;
			state.timer = 0;
			state.lastId = historyItems[0].id;
			var startTime = new Date();
			var t, i = 0;
			var MAXCONCURRENT = 5;
			(function nextItem() {
				if (state.cancelled || i == historyItems.length) {
					if (callback) callback();
					return;
				}
				if (i - state.current < MAXCONCURRENT) {
					if (i%10==0)
					console.log('i='+i);
					//console.log(historyItems[i]);
					var visitId = historyItems[i].id;
					var url = historyItems[i].url;
					var time = historyItems[i].time;
					MePersonality.tagger.getTags({
						'url': url
					}, function (results) {
						//console.log(results);
						var tags=results.tags;
						var rels=results.rels;
						if (tags){
							for(var j=0;j<tags.length;++j){
								MePersonality.indexer.addTimedTag({
									'tag': tags[j],
									//'urlId': urlId,
									'url': results.url,
									'title': results.title,
									'relevancy': rels[j],
									'time': time
								});
							}
						}
						state.current++;
						state.timer = new Date() - startTime;
						if (state.current==historyItems.length) {
							console.log("indexer.save");
							MePersonality.indexer.save();
						}
					});
					++i;
				}
				if (i - state.current == MAXCONCURRENT)
					t = setTimeout(nextItem, 10);
				else
					t = setTimeout(nextItem, 0);
			})();
		});
	}

	this.updateIndex = function (callback) {
		if (state.updated && new Date() - state.updated < 1000) {
			return;
		}
		state.cancelled = false;
		MePersonality.browser.searchHistory({
			'maxResults': 50
		},
		function (historyItems) {
			console.log(JSON.stringify(historyItems));
			state.current = 0;
			var t, i = 0, running = 0;
			var MAXCONCURRENT = 5;
			function nextItem() {
				if (historyItems[i].id == state.lastId) {
					if (!running) {
						MePersonality.indexer.save();
						if (callback) {
							callback();
						}
					}
					state.lastId = historyItems[0].id;
					return;
				}
				if (i - state.current < MAXCONCURRENT) {
					++running;
					var count = historyItems[i].visitCount;
					//if (!count) count=1;
					count = 1; // TODO: check all visits
					var urlId = historyItems[i].id;
					//MePersonality.db.set('url',urlId,historyItems[i].url);
					MePersonality.indexer.addIndex({
						'urlId': urlId,
						'url': historyItems[i].url,
						'count': count,
						'actuality': historyItems[i].lastVisitTime
					}, function () {
						--running;
						if (!running) {
							MePersonality.indexer.save();
							if (callback) {
								callback();
							}
						}
					});
					++i;
				}
				if (i - state.current == MAXCONCURRENT)
					t = setTimeout(nextItem, 10);
				else
					t = setTimeout(nextItem, 0);
			}
			nextItem();
		});
	}

	this.removeIndex = function (url, urlId, count, ageLimit) {
		MePersonality.indexer.getTagsByUrl(url, 1000000, function (urlTags) {
			for (var i = 0; i < urlTags.length; ++i) {
				MePersonality.indexer.addTag({
					'tag': urlTags[i].tag,
					'urlId': urlId,
					'url': url,
					'title': '',
					'relevancy': -count * urlTags[i].relevancy
				});
				MePersonality.indexer.getTagDetails(urlTags[i].tag, function (params) {
					if (params.actuality < ageLimit) {
						MePersonality.indexer.removeTag(params.tag);
					}
				});
			}
		});
	}

	this.removeOld = function (countLimit) {
		/*if (state.cleaned&&new Date()-state.cleaned<10000){
			setTimeout(function(){
			(function(countLimit){
			MePersonality.indexer.removeOld(countLimit);
			})(countLimit);
			},10000);
			}*/
		state.cleaned = new Date();
		if (!countLimit)
			countLimit = 500;
		MePersonality.browser.searchHistory({
			'maxResults': 100000000
		},
		function (historyItems) {
			var urls = {};
			for (var i = historyItems.length - 1; i >= 0; --i) {
				var url = historyItems[i].url;
				urls[url] = i;
			}
			for (var i = countLimit; i < historyItems.length; ++i) {
				var url = historyItems[i].url;
				var count = historyItems[i].visitCount;
				if (!count) count = 1;
				if (urls[url] >= countLimit) {
					MePersonality.indexer.removeIndex(url, historyItems[i].id,
						count, historyItems[countLimit - 1].lastVisitTime);
				}
			}
			MePersonality.indexer.save();
		});
	}
}
