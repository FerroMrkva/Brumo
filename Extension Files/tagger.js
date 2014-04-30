MePersonalityTagger = function () {

	var searchURL = new RegExp(
			'^(http(s?)://ww(w+)\.google\.|' +
				'http(s?)://video\.google\.|' +
				'http(s?)://maps\.google\.|' +
				'http(s?)://ww(w+)\.bing\.)');

	var tagger = new POSTagger();
	var lexer = new Lexer();

	var query = /[\?&]q=[^&#]+/;

	var domains = '(com|uk|org|eu|net)';
	var stopwords = '(a|able|about|across|after|all|almost|also|am|among|an|and|any|are|as|at|be|because|been|but|by|can|cannot|could|dear|did|do|does|either|else|ever|every|for|from|get|got|had|has|have|he|her|hers|him|his|how|however|i|if|in|into|is|it|its|just|least|let|like|likely|may|me|might|most|must|my|neither|no|nor|not|of|off|often|on|only|or|other|our|own|rather|said|say|says|she|should|since|so|some|than|that|the|their|them|then|there|these|they|this|tis|to|too|twas|us|wants|was|we|were|what|when|where|which|while|who|whom|why|will|with|would|yet|you|your' +/*added*/'|a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|y|x|z|page|advertising|com' + ')';
			var stopword = new RegExp('^' + stopwords + '$', 'i');
			var taggers = {};
			var This = this;
			var Wordnet = function () {
				var data_noun;
				var index_noun;
				var noun_exc;
				var filenames = ['data.noun', 'index.noun', 'noun.exc'];
				var This = this;
				this.pointers = {
					'hypernym': '@',
			'instance hypernym': '@i',
			'hyponym': '~',
			'instance hyponym': '~i',
			'member holonym': '#m',
			'substance holonym': '#s',
			'part holonym': '#p',
			'member meronym': '%m',
			'substance meronym': '%s',
			'part meronym': '%p',
			'attribute': '=',
			'derivationally related form': '+',
			'domain of synset - topic': ';c',
			'domain of synset - region': ';r',
			'domain of synset - usage': ';u',
			'member of this domain - topic': '-c',
			'member of this domain - region': '-r',
			'member of this domain - usage': '-u'
				};
				this.init = function (callback) {
					(function rec(i) {
						if (i < 0) {
							callback({});
							return;
						}
						MP.db.get('wordnet', filenames[i], function (response) {
							eval(filenames[i].replace(/\./g, '_') + '=response;');
							rec(i - 1);
						});
					})(filenames.length - 1);
				};
				this.getSynsets = function (word) {
					if (index_noun[word])
						return index_noun[word].synsets;
					return [];
				}
				this.getWords = function (synsetId) {
					if (data_noun[synsetId])
						return data_noun[synsetId].words;
					return [];
				}
				this.getBaseForm = function (word) {
					if (noun_exc[word])
						return noun_exc[word];
					return word;
				}
				this.getPointers = function (synsetId, pointerType) {
					var pointers = [];
					var allPointers = [];
					if (data_noun[synsetId])
						allPointers = data_noun[synsetId].pointers;
					for (var i = 0; i < allPointers.length; ++i)
						if (allPointers[i][0] == pointerType)
							pointers.push(allPointers[i][1]);
					return pointers;
				}
				this.getHypernyms = function (synsetId) {
					return This.getPointers(synsetId, '@');
				}
				this.getHyponyms = function (synsetId) {
					return This.getPointers(synsetId, '~');
				}
				this.getMemberHolonyms = function (synsetId) {
					return This.getPointers(synsetId, '#m');
				}
				this.getSubstanceHolonyms = function (synsetId) {
					return This.getPointers(synsetId, '#s');
				}
				this.getPartHolonyms = function (synsetId) {
					return This.getPointers(synsetId, '#p');
				}
				this.getRootConcepts = function (synsetId) {
					var roots = {};
					var hypernyms = This.getHypernyms(synsetId);
					if (!hypernyms) return;
					for (var i = 0; i < hypernyms.length; ++i) {
						var _roots = This.getRootConcepts(hypernyms[i]);
						for (var root in _roots)
							roots[root] = 1;
					}
					return Object.keys(roots);
				}
				this.getRootDistance = function (synsetId) {
					var hypernyms = This.getHypernyms(synsetId);
					if (!hypernyms) return 0;
					var distance = This.getRootDistance(hypernyms[0]);
					for (var i = 1; i < hypernyms.length; ++i) {
						var d = This.getRootDistance(hypernyms[i]);
						if (d < distance)
							distance = d;
					}
					return distance;
				}
				this.getLCS = function (synsetId1, synsetId2) {
					var D = {};
					var Q = [[synsetId1, 0]];
					while (Q.length) {
						var first = Q.shift();
						if (D[first[0]]) continue;
						D[first[0]] = first[1];
						var hypernyms = This.getHypernyms(first[0]);
						for (var i = 0; i < hypernyms.length; ++i)
							Q.push([hypernyms[i], first[1] + 1]);
					}
					var LCS = {};
					Q.push(synsetId2);
					while (Q.length) {
						var first = Q.shift();
						if (D[first]) {
							LCS[first] = 1;
							continue;
						}
						var hypernyms = This.getHypernyms(first);
						for (var i = 0; i < hypernyms.length; ++i)
							Q.push(hypernyms[i]);
					}
					return Object.keys(LCS);
				}
				this.getWordProbability = function (word) {
					if (index_noun[word])
						return index_noun[word].prob;
				}
				this.getSynsetProbability = function (synsetId) {
					var probability = 0;
					var V = {};
					(function rec(_synsetId) {
						if (V[_synsetId]) return;
						V[_synsetId] = 1;
						var words = This.getWords(_synsetId);
						for (var i = 0; i < words.length; ++i) {
							var p = This.getWordProbability(words[i]);
							if (p) {
								var synsets = This.getSynsets(words[i]);
								probability += p / synsets.length;
							}
						}
						var hyponyms = This.getHyponyms(_synsetId);
						for (var i = 0; i < hyponyms.length; ++i)
						rec(hyponyms[i]);
					})(synsetId);
					return probability;
				}
				this.getInformationContent = function (synsetId) {
					var p = This.getSynsetProbability(synsetId);
					if (!p) return 0;
					return -Math.log(p);
				}
				this.getResnikSimilarity = function (synsetId1, synsetId2) {
					var LCSs = This.getLCS(synsetId1, synsetId2);
					if (!LCSs) return 0;
					var IC = This.getInformationContent(LCSs[0]);
					for (var i = 1; i < LCSs.length; ++i) {
						var ic = This.getInformationContent(LCSs[i]);
						if (ic > IC) IC = ic;
					}
					return IC;
				}
				this.getLinSimilarity = function (synsetId1, synsetId2) {
					var res = This.getResnikSimilarity(synsetId1, synsetId2);
					var ic1 = This.getInformationContent(synsetId1);
					var ic2 = This.getInformationContent(synsetId2);
					if (ic1 + ic2 == 0) {
						if (res)
							console.warn('res is defined, but ic1 and ic2 not');
						return 0;
					}
					return 2 * res / (ic1 + ic2);
				}
				this.getJiangConrathSimilarity = function (synsetId1, synsetId2) {
					var res = This.getResnikSimilarity(synsetId1, synsetId2);
					var ic1 = This.getInformationContent(synsetId1);
					var ic2 = This.getInformationContent(synsetId2);
					if (!(ic1 + ic2 - 2 * res)) {
						return 0;
					}
					return 1 / (ic1 + ic2 - 2 * res);
				}

				this.pageRank = function (params, callback) {
					var V = params.V;
					var E = params.E;
					var iterations = 50;
					if (params.iterations) iterations = params.iterations;
					var d = 0.85;
					if (params.d) d = params.d;
					// normalise
					var sum_w = {};
					for (var v1 in V) {
						sum_w[v1] = 0;
						V[v1] = [0, 1];
						for (var v2 in E[v1])
							sum_w[v1] += E[v1][v2];
					}
					// iterujem
					for (var i = 0; i < iterations; ++i) {
						for (var v1 in V) {
							var value = 0;
							for (var v2 in E[v1]) {
								value += sum_w[v2] == 0 ? 0 : V[v2][i & 1] / sum_w[v2] * E[v1][v2];
							}
							V[v1][(i & 1) ^ 1] = 1 - d + d * value;
						}
					}
					for (var v1 in V) {
						V[v1] = V[v1][0];
					}
					if (callback)
						callback(V);
				}

				this.getSynsetSpecificity = function (params, callback) {
					var edgeList = [];
					var cluster = {};
					var synsets = params.synsets;
					var edges = params.edges;
					var sorted = params.sorted;
					function getCluster(synsetId) {
						if (cluster[synsetId] == synsetId)
							return synsetId;
						return cluster[synsetId] = getCluster(cluster[synsetId]);
					}
					var specificity = 0;
					var weights = [];
					var sim;
					if (params.sim == 'res')
						sim = This.getResnikSimilarity;
					else if (params.sim == 'lin')
						sim = This.getLinSimilarity;
					else if (params.sim == 'con')
						sim = This.getJiangConrathSimilarity;
					else {
						sim = This.getResnikSimilarity;
						console.warn('similarity measure not specified, using resnik by default');
					}
					for (var synsetId in synsets) {
						for (var synsetId2 in edges[synsetId]) {
							var w = sim(synsetId, synsetId2);
							edgeList.push([w, synsetId, synsetId2]);
						}
					}
					var topmost = edgeList.length;
					if (params.topmost || params.method == 1 || params.method == 2 || params.method == 3 || params.method == 4) {
						topmost = Math.min(params.topmost, sorted.length);
						edgeList = [];
						if (params.method == 3) {
							console.log('using method 3');
							var LCS = [0, 0];
							var V = {};
							for (var i = 0; i < topmost; ++i) {
								console.log(This.getWords(sorted[i][1]));
								var Q = [sorted[i][1]];
								while (Q.length) {
									var c = Q.shift();
									if (!V[c]) V[c] = 0;
									console.log('visiting ' + This.getWords(c) + ' ' + V[c]);
									if (V[c] == i) {
										console.log(This.getWords(c) + ' ' + i);
										var ic = This.getInformationContent(c);
										if (LCS[0] == i || LCS[1] < ic) {
											LCS = [i + 1, ic];
											console.log(LCS);
										}
										V[c]++;
									}
									var hypernyms = This.getHypernyms(c);
									console.log(hypernyms);
									for (var j = 0; j < hypernyms.length; ++j)
										Q.push(hypernyms[j]);
								}
							}
							if (LCS[0] != topmost)
								specificity = 0;
							else
								specificity = LCS[1];
						}
						else {
							for (var i = 0; i < topmost; ++i) {
								cluster[sorted[i][1]] = sorted[i][1];
								for (var j = 0; j < i; ++j) {
									var w = sim(sorted[i][1], sorted[j][1]);
									edgeList.push([w, sorted[i][1], sorted[j][1]]);
								}
							}
							if (params.method != 4) {
								if (params.method == 2) {
									console.log('using method 2');
									if (edgeList.length == 0)
										specificity = undefined;
									else
										specificity = edgeList[0][0];
									for (var i = 0; i < edgeList.length; ++i) {
										var w = edgeList[i][0];
										specificity = Math.min(specificity, w);
										weights.push(w);
									}
								}
								else {
									console.log('using method 1');
									for (var i = 0; i < edgeList.length; ++i) {
										var w = edgeList[i][0];
										specificity += w / edgeList.length;
										weights.push(w);
									}
								}
							}
							else {
								console.log('using method 4');
								edgeList.sort(function (a, b) {
									if (a[0] != b[0])
									return b[0] - a[0];
								return a[1] < b[1];
								});
								var clusters = topmost;
								for (var i = 0; i < edgeList.length; ++i) {
									var c1 = getCluster(edgeList[i][1]);
									var c2 = getCluster(edgeList[i][2]);
									if (c1 != c2) {
										// join clusters
										if (Math.random() < .5) cluster[edgeList[i][1]] = c2;
										else cluster[edgeList[i][2]] = c1;
										clusters--;
										if (clusters == 1) {
											console.log('join ' + edgeList[i][1] + ' ' + This.getWords(edgeList[i][1]) + ' + ' + edgeList[i][2] + ' ' + This.getWords(edgeList[i][2]));
											specificity = edgeList[i][0];
											break;
										}
									}
								}
							}
						}
					}
					else {
						console.log('using method 1');
						for (var i = 0; i < edgeList.length; ++i) {
							var w = edgeList[i][0];
							specificity += w / edgeList.length;
							weights.push(w);
						}
					}
					callback({ 'specificity': specificity, 'weights': weights });
				}

				this.synsetRank = function (params, callback) {
					if (!params.words) {
						if (!params.text) {
							if (!params.html) {
								if (!params.url) {
									callback({ 'error': 'URL must be specified' });
									return;
								}
								//if (MePersonality.browser.debug) {
								//    // TODO: if stored ...
								//}
								if (params.maxPageCount > 1) {
									MePersonality.browser.searchHistory({
										'maxResults': 10000
									}, function (results) {
										var wholeText = '';
										params.pages = [];
										var visited = {};
										(function rec(i) {
											if (i < 0 || params.pages.length >= params.maxPageCount) {
												params.text = wholeText;
												console.log(params.pages);
												This.synsetRank(params, callback);
											}
											else {
												var regex = new RegExp(params.url.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"));
												if (!regex.test(results[i].url) || visited[results[i].url]) {
													// skip duplicates
													rec(i - 1);
												}
												else {
													visited[results[i].url] = true;
													params.pages.push(results[i].url);
													MePersonality.browser.xhr.get({ 'url': results[i].url }, function (response) {
														var contentType = response.headers['content-type'] || response.headers['Content-Type'];
														var text = '';
														if (contentType && contentType.indexOf('text') >= 0) {
															params.html = response.text;
															text = MePersonality.tagger.extractArticle(response.text);
															if (!text)
														text = MePersonality.tagger.stripHTML(response.text);
														}
														wholeText += '\n\n' + text;
														rec(i - 1);
													});
												}
											}
										})(results.length - 1);
									});
								}
								else {
									MePersonality.browser.xhr.get({ 'url': params.url }, function (response) {
										var contentType = response.headers['content-type'] || response.headers['Content-Type'];
										if (contentType && contentType.indexOf('text') >= 0) {
											params.html = response.text;
											This.synsetRank(params, callback);
										}
										else {
											callback({ 'error': 'Non-textual content' });
										}
									});
								}
								return;
							}
							var text = MePersonality.tagger.extractArticle(params.html);
							if (!text)
								text = MePersonality.tagger.stripHTML(params.html);
							params.text = text;
						}
						var words = MePersonality.tagger.getWords(params.text);
						params.words = words;
					}
					var words = params.words;
					var maxDistance = 2;
					var taggedWords = new POSTagger().tag(words);
					var last = [];
					var vertexId = {};
					var vertexTag = [];
					var edges = {};
					var basis_synsets = {};
					var TF = {};
					function strengthenRelation(synsetId1, synsetId2, weight) { // collocations, semantic relations
						if (!edges[synsetId1])
							edges[synsetId1] = {};
						if (!edges[synsetId2])
							edges[synsetId2] = {};
						if (edges[synsetId1][synsetId2])
							edges[synsetId1][synsetId2] += weight;
						else
							edges[synsetId1][synsetId2] = weight;
						if (edges[synsetId2][synsetId1])
							edges[synsetId2][synsetId1] += weight;
						else
							edges[synsetId2][synsetId1] = weight;
					}
					for (var i = 0; i < taggedWords.length; ++i) {
						var word = escape(taggedWords[i][0].toLowerCase());
						var tag = taggedWords[i][1];
						//if (/[0-9]/.test(word.substr(0, 1)))
						//    continue;
						if (tag.substr(0, 2) != 'NN' || stopword.test(word))
							continue;
						// term frequency
						if (!TF[word]) TF[word] = 1;
						else TF[word]++;
						var synsets = This.getSynsets(word);
						for (var j = 0; j < synsets.length; ++j) {
							var synsetId = synsets[j];
							if (!basis_synsets[synsetId])
								basis_synsets[synsetId] = 1;
							else
								basis_synsets[synsetId]++;
						}
						for (var j = 0; j < last.length; ++j) {
							if (i - last[j][0] <= maxDistance) {
								var w = (maxDistance - i + last[j][0] + 1) / maxDistance;
								for (var s1 = 0; s1 < last[j][1].length; ++s1) {
									for (var s2 = 0; s2 < synsets.length; ++s2) {
										//strengthenRelation(last[j][1][s1], synsets[s2], w / 2);
									}
								}
							}
						}
						while (last[0] && i + 1 - last[0][0] > maxDistance)
							last.shift();
						last.push([i, synsets, word]);
					}
					var synsets = {};
					var pointerTypes = [
						[This.pointers['hypernym'], 1],
						[This.pointers['member holonym'], .7],
						[This.pointers['substance holonym'], .5],
						[This.pointers['part holonym'], .7]
							];
					function addSynset(synsetId, depth) {
						if (synsets[synsetId])
							return;
						synsets[synsetId] = 1;
						for (var p = 0; p < pointerTypes.length; ++p) {
							var pointers = This.getPointers(synsetId, pointerTypes[p][0]);
							for (var i = 0; i < pointers.length; ++i) {
								strengthenRelation(synsetId, pointers[i], pointerTypes[p][1]);
								addSynset(pointers[i], depth);
							}
						}
					}
					for (var synsetId in basis_synsets) {
						addSynset(synsetId, 1);
					}
					This.pageRank({
						'V': synsets,
						'E': edges,
					});
					// filter out only the most relevant senses
					basis_synsets = {};
					edges = {};
					var last = [];
					for (var i = 0; i < taggedWords.length; ++i) {
						var word = escape(taggedWords[i][0].toLowerCase());
						var tag = taggedWords[i][1];
						//if (/[0-9]/.test(word.substr(0, 1)))
						//    continue;
						if (tag.substr(0, 2) != 'NN' || stopword.test(word))
							continue;
						var senses = This.getSynsets(word);
						if (!senses) continue;
						var best = senses[0];
						var bestVal = synsets[best];
						for (var j = 0; j < senses.length; ++j) {
							var val = synsets[senses[j]];
							if (val > bestVal) {
								bestVal = val;
								best = senses[j];
							}
						}
						for (var j = 0; j < last.length; ++j) {
							strengthenRelation(last[j], best, 1 / (j + 1));
						}
						last.shift();
						last.push(best);
						basis_synsets[best] = true;
					}
					synsets = {};
					for (var synsetId in basis_synsets) {
						addSynset(synsetId, 1);
					}
					This.pageRank({
						'V': synsets,
						'E': edges,
					});
					var sorted = [];
					for (var synsetId in synsets) {
						var wordP = This.getWords(synsetId);
						//for (var i = 0; i < wordP.length; ++i) {
						//    wordP[i] = { 'word': wordP[i], 'prob': This.getWordProbability(wordP[i]) };
						//}
						//wordP.sort(function (a, b) {
						//    if (a.prob != b.prob)
						//        return b.prob - a.prob;
						//    return a.word < b.word;
						//});
						sorted.push([synsets[synsetId], synsetId, wordP]);
					}
					sorted.sort(function (a, b) {
						if (a[0] != b[0])
						return b[0] - a[0];
					return a[1] < b[1];
					});
					for (var i = 0; i < Math.min(20, sorted.length) ; ++i) {
						console.log(sorted[i][2]);
					}
					// get measure
					params.synsets = synsets;
					params.edges = edges;
					params.sorted = sorted;
					var result = { 'graph': sorted };
					if (params.pages)
						result.pages = params.pages;
					function allSim(params, callback) {
						var result = {};
						if (params.sim == 'all') {
							params.sim = 'res';
							This.getSynsetSpecificity(params, function (res) {
								result[params.sim] = res;
								params.sim = 'lin';
								This.getSynsetSpecificity(params, function (res) {
									result[params.sim] = res;
									params.sim = 'con';
									This.getSynsetSpecificity(params, function (res) {
										result[params.sim] = res;
										callback(result);
									});
								});
							});
						}
						else {
							if (!params.sim) params.sim = 'res';
							This.getSynsetSpecificity(params, function (res) {
								result[params.sim] = res;
								callback(result);
							});
						}
					}
					if (params.method == 'all') {
						params.method = 1;
						allSim(params, function (res) {
							result[params.method] = res;
							params.method = 2;
							allSim(params, function (res) {
								result[params.method] = res;
								params.method = 3;
								allSim(params, function (res) {
									result[params.method] = res;
									params.method = 4;
									allSim(params, function (res) {
										result[params.method] = res;
										callback(result);
									});
								});
							});
						});
					}
					else {
						if (!params.method)
							params.method = '1';
						allSim(params, function (res) {
							result[params.method] = res;
							callback(result);
						});
					}
					var topmost = params.topmost || 20;
					for (var i = 0; i < Math.min(topmost, 20) ; ++i) {
						console.log(This.getWords(sorted[i][1]));
					}
				}
			}

			this.wordnet = new Wordnet();
			this.wordnet.init(function () { debug('wordnet loaded'); });

			this.synsetRank = this.wordnet.synsetRank;

			//var readability = new Readability();

			this.reloadTagger = function reloadTagger(taggerId, callback) {
				MePersonality.db.get('taggers', taggerId, function (tagger) {
					if (!tagger.enabled) {
						delete taggers[taggerId];
						if (callback)
					callback({ message: 'Tagger ' + taggerId + ' (' + tagger.name + ') disabled.' });
				return;
					}
					try {
						//debug('Loading tagger ' + taggerId + ' (' + tagger.name + ')');
						eval('(function(){var taggerCode=function(){' + tagger.code +
							'}; var x=taggers["' + taggerId + '"]=new taggerCode();' +
							'x.name="' + tagger.name.replace(/"/g, '\\"') + '";' + // TODO: update template to avoid attribute collision
							'if (typeof(x.init)=="function") x.init();})();');
						//debug('Tagger ' + taggerId + ' (' + tagger.name + ') loaded.');
						callback({ "message": 'Tagger ' + taggerId + ' (' + tagger.name + ') loaded.' });
					} catch (e) {
						//debug(e);
						console.error(e);
						console.error('Failed to load tagger ' + taggerId + ' (' + tagger.name + ').');
						callback({ 'error': 'Failed to load tagger ' + taggerId + ' (' + tagger.name + ').' });
					}
				});
			}

			this.removeTagger = function removeTagger(taggerId, callback) {
				delete taggers[taggerId];
				callback();
			}

			function loadTagger(name, taggerName, taggerId) {
				// TODO: do we need this?
				//debug('Retrieving ' + taggerName + ' tagger file');
				MePersonality.xhr.get({ url: 'taggers/' + name }, function (code) {
					//debug(taggerName + ' tagger file retrieved');
					MePersonality.db.set('taggers', taggerId, {
						'name': taggerName,
					'code': code
					}, function () {
						reloadTagger(taggerId);
					});
				});
			}

			function loadTaggers() {
				console.log('Loading taggers...');
				MePersonality.db.get('taggers', 'list', function (taggerList) {
					if (!taggerList) {
						return;
						// First launch ever!
						//debug('First launch ever!');
						taggerList = [];
						loadTagger('facebook.js', 'Facebook', 1);
						taggerList.push(1);
						loadTagger('youtube.js', 'YouTube', 2);
						taggerList.push(2);
						loadTagger('stackoverflow.js', 'Stackoverflow', 3);
						taggerList.push(3);
						loadTagger('gtranslate.js', 'Google translate', 4);
						taggerList.push(4);
						MePersonality.db.set('taggers', 'list', taggerList);
						return;
					}
					for (var i = 0; i < taggerList.length; ++i) {
						reloadTagger(taggerList[i]);
					}
				});
			}

			this.isStopword = function (word, callback) {
				if (callback)
					callback(stopword.test(word));
				return stopword.test(word);
			}

			function stripHTML(html) {
				var tmp = document.createElement("div");
				//tmp.innerHTML = html;
				try {
					tmp.innerHTML = html_sanitize(html).replace(/</g, ' <');
				} catch (e) {
					console.error('Failed to sanitize HTML. Using default.');
					console.error(e);
					tmp.innerHTML = html;
				}
				return $(tmp).text();
			}

			this.stripHTML = function (params, callback) {
				var html = params.html || params;
				var result = stripHTML(html);
				if (callback)
					callback({ 'text': result });
				return result;
			}

			this.extractArticle = function (params, callback) {
				var html = params.html || params;
				var article;
				try {
					article = readability.extractArticle(html);
				} catch (e) {
					console.error('Readability failed. Ignoring page structure.');
					console.error(e);
					article = html;
				}
				var text = stripHTML(article);
				if (callback)
					callback({ 'article': text });
				return text;
				var text = stripHTML(html);
				var text2 = '', text3 = [];
				for (var i = 0, j = 0; i < text.length; ++i) {
					if (text.substr(i, 3) == '   ') {
						if (j > 10)
							text2 += text3.join('').trim() + ' ';
						j = 0;
						i += 2;
						text3 = [];
					}
					else if (text[i] == ',')
						++j;
					text3.push(text[i]);
				}
				return text2;
				text = text.replace(/   ([^,]+,[^,]+){10,}   /g, ' ');
				text = text.replace(/\s+/g, ' ');
				return text;
			}

			function removeLinks(text) {
				return (' ' + text + ' ').
					replace(new RegExp('[^A-z0-9][a-z]+\..+\.[a-z]+[^A-z0-9]', 'gi'), ' ').
					replace(new RegExp('[^A-z0-9][a-z]+\..+\.' + domains + '[^A-z0-9]', 'gi'), ' ');
				// TODO: remove only bad words
			}

			function getWords(text) {
				return lexer.lex(text);
				var chars = [' '];
				var validChars = 'aáäbcčdďeéěfghiíjklĺľmnňoóôpqrŕřsštťuúvwxyýzž0123456789-';
				var valid = {};
				var text2 = text.toLowerCase();
				for (var i = 0; i < validChars.length; ++i)
					valid[escape(validChars[i])] = 1;
				for (var i = 0; i < text2.length; ++i) {
					if (valid[escape(text2[i])])
						chars.push(text2[i]);
					else
						chars.push(' ');
				}
				chars.push(' ');
				//console.log(unescape(chars.join('')));
				var words = unescape(chars.join('').
						replace(new RegExp(' ' + stopwords + ' '), ' ')).
					trim().replace(/\s\s\s+/g, '   ').split(' ');
				//console.log(words);
				return words;
			}

			this.getWords = function (params, callback) {
				var text = params.text || params;
				//return new Lexer().lex(text);
				var words = getWords(text);
				if (callback)
					callback({ 'words': words });
				return words;
			}

			function getPhrases(taggedWords){
				var phrases=[];
				for(var i=0;i<taggedWords.length;++i){
					for(var j=i,state=0,phrase='';j<taggedWords.length;++j){
						var word=taggedWords[j][0];
						var tag=taggedWords[j][1].substr(0,1);
						if (word.length<2) break;
						if (state==0){
							if (tag=='J') state=1;
							else if (tag=='N') state=3;
							else { state=-1; break; }
						}
						else if (state==1){
							if (tag=='J') ;
							else if (tag=='I') state=2;
							else if (tag=='N') state=3;
							else { state=-1; break; }
						}
						else if (state==2){
							if (tag=='J') state=1;
							else if (tag=='N') state=3;
							else { state=-1; break; }
						}
						else if (state==3){
							if (tag=='J') state=1;
							else if (tag=='I') state=2;
							else if (tag!='N') { state=-1; break; }
						}
						if (phrase) phrase+=' ';
						phrase+=word;
						if (state==3){ // final state
							phrases.push(phrase);
						}
					}
				}
				return phrases;
			}

			this.getPhrases = function (taggedWords,callback){
				var phrases=getPhrases(taggedWords);
				if (callback)
					callback(phrases);
				return phrases;
			}

			this.getMetaTags = function (html, handler) {
				// get title
				var titleDiv = document.createElement('div');
				titleDiv.innerHTML = /<title.+>/.exec(html);
				var title = '';
				if (titleDiv.children[0])
					title = $(titleDiv.children[0]).text().toLowerCase();
				// get description
				var descriptionDiv = document.createElement('div');
				descriptionDiv.innerHTML = /<meta name="description".+>/.exec(html);
				var description = '';
				if (descriptionDiv.children[0])
					description = descriptionDiv.children[0].content.toLowerCase();
				// get keywords
				var keywordsDiv = document.createElement('div');
				keywordsDiv.innerHTML = /<meta name="keywords".+>/.exec(html);
				var keywords = [];
				if (keywordsDiv.children[0])
					keywords = keywordsDiv.children[0].content.toLowerCase().split(',');
				// compute the relevancy of terms
				var counter = {};
				function addWords(words, defaultFrequency) {
					words.forEach(function(word){
						var w = escape(word.trim());
						var f = MePersonality.ngrams.getFrequency(w);
						if (!f && defaultFrequency)
							f = defaultFrequency;
						if (f) {
							if (counter[w])
								counter[w] += f / words.length;
							else
								counter[w] = f / words.length;
						}
					});
				}
				addWords(getPhrases(tagger.tag(getWords(title))));
				addWords(getPhrases(tagger.tag(getWords(description))));
				addWords(keywords, 1);
				var sorted = [];
				for (var word in counter) {
					sorted.push([counter[word], unescape(word)]);
				}
				sorted.sort(function (a, b) {
					if (a[0] != b[0])
					return b[0] - a[0];
				return a[1] < b[1];
				});
				// vrat maximalne prvych 100
				var tags = [], rels = [];
				for (var i = 0; i < 100 && i < sorted.length; ++i) {
					tags.push(sorted[i][1]);
					rels.push(sorted[i][0]);
				}
				handler(tags, rels, title, description, keywords);
			}

			this.getPOStags = function (params, callback) {
				var words = params.words || params;
				var taggedWords = new POSTagger().tag(words);
				if (callback)
					callback({ 'taggedWords': taggedWords });
				return taggedWords;
			}

			this.textRank = function (words, handler) {
				var maxDistance = 2;
				var d = 0.85;
				var taggedWords = tagger.tag(words);
				var last = [];
				var vertexId = {};
				var vertexTag = [];
				var vertexValue = [];
				var sum_w = [];
				var edges = [];
				var id_count = 0;
				for (var i = 0; i < taggedWords.length; ++i) {
					var word = escape(taggedWords[i][0].toLowerCase());
					var tag = taggedWords[i][1];
					if (/[0-9]/.test(word.substr(0, 1)))
						continue;
					if (tag.substr(0, 2) != 'NN' || stopword.test(word) || taggedWords[i][0].length<2)
						continue;
					var id = vertexId[word];
					if (typeof(id)!='number') {
						id = vertexId[word] = ++id_count;
						vertexTag[id] = tag;
						vertexValue[id] = [0, 1];
						sum_w[id] = 0;
						edges[id] = {};
					}
					for (var j = 0; j < last.length; ++j) {
						if (i - last[j][0] <= maxDistance) {
							var w = (maxDistance - i + last[j][0] + 1) / maxDistance;
							if (edges[id][last[j][1]])
								edges[id][last[j][1]] += w;
							else
								edges[id][last[j][1]] = w;
							if (edges[last[j][1]][id])
								edges[last[j][1]][id] += w;
							else
								edges[last[j][1]][id] = w;
						}
					}
					while (last[0] && i + 1 - last[0][0] > maxDistance)
						last.shift();
					last.push([i, id]);
				}
				for (var word in vertexId) {
					var id = vertexId[word];
					for (var id2 in edges[id])
						sum_w[id] += edges[id][id2];
				}
				// iterujem
				for (var i = 0; i < 50; ++i) {
					for (var word in vertexId) {
						var id = vertexId[word];
						var value = 0;
						for (var id2 in edges[id]) {
							var w = edges[id][id2];
							value += w / sum_w[id2] * vertexValue[id2][i & 1];
						}
						var f = Math.sqrt(MePersonality.ngrams.getFrequency(word));
						//if (!f) f=MePersonality.Ngrams.getAverageFrequency();
						vertexValue[id][(i & 1) ^ 1] = 1 - d + d * value;
					}
				}
				var sorted = [];
				for (var word in vertexId) {
					sorted.push([vertexValue[vertexId[word]][0], unescape(word)]);
				}
				sorted.sort(function (a, b) {
					if (a[0] != b[0]) return b[0] - a[0];
					return a[1] < b[1];
				});
				// vrat maximalne prvych 100
				words = [];
				var relevancies = [];
				for (var i = 0; i < 100 && i < sorted.length; ++i) {
					//console.log(sorted[i]);
					words.push(sorted[i][1]);
					relevancies.push(sorted[i][0] / words.length);
				}
				handler(words, relevancies);
			}

			this.getLanguage = function (text, callback) {
				var lng = LanguageIdentifier.identify(text);
				if (callback){
					callback(lng);
				}
				return lng;
			}

			this.isEnglish = function (text, callback) {
				var lng = LanguageIdentifier.identify(text);
				var vys = lng['language'] == 'en';
				if (callback){
					callback(vys);
				}
				return vys;
			}

			this.getTags3 = function (url, html, text, handler) {
				//debug('getting word frequencies');
				var words = getWords(text);
				var taggedWords = tagger.tag(words);
				var phrases = getPhrases(taggedWords);
				//console.log(phrases);
				// zrataj pocet vyskytov slov
				var counter = {};
				phrases.forEach(function(phrase){
					var w=escape(phrase);
					if (phrase.length<2) return;
					var f = MePersonality.ngrams.getFrequency(w);
					if (f) {
						if (counter[w]&&typeof(counter[w])!='function')
							counter[w] += f;
						else
							counter[w] = f;
					}
				});
				//for (var i in words) {
					//var w = escape(words[i]);
					//if (w == '')
						//continue;
					//var f = MePersonality.ngrams.getFrequency(w);
					//if (f) {
						//if (counter[w])
							//counter[w] += f;
						//else
							//counter[w] = f;
					//}
				//}
				var ret = { 'url': url };
				// usporiadaj podla pocetnosti
				var sorted = [];
				for (var word in counter) {
					counter[word] = counter[word] / phrases.length * .5;
				}
				//debug('getting metatags');
				MePersonality.tagger.getMetaTags(html,
						function (tags, rels, title, description, keywords) {
							ret['title'] = title;
							ret['description'] = description;
							ret['keywords'] = keywords;
							for (var i = 0; i < tags.length; ++i) {
								var w=escape(tags[i]);
								if (!w) continue;
								if (counter[w]&&typeof(counter[w])!='function') {
									counter[w] += rels[i] * .6;
								}
								else {
									counter[w] = rels[i] * .6;
								}
							}
							//debug('metatags ok');
						});
				//debug('textrank started');
				MePersonality.tagger.textRank(words, function (tags, rels) {
					for (var i = 0; i < tags.length; ++i) {
						var w=escape(tags[i]);
						if (!w) continue;
						if (counter[escape(tags[i])]&&typeof(counter[w])!='function') {
							counter[w] += rels[i] * .5;
						}
						else {
							counter[w] = rels[i] * .5;
						}
					}
					//debug('textrank ok');
				});
				//debug('merging results');
				delete counter[''];
				for (var word in counter) {
					sorted.push([counter[word], unescape(word)]);
				}
				sorted.sort(function (a, b) {
					if (a[0] != b[0])
					return b[0] - a[0];
				return a[1] < b[1];
				});
				// vrat maximalne prvych 100
				var tags = [], rels = [];
				if (sorted.length >= 5) {
					var maxRel = sorted[0][0];
					if (!maxRel)
						maxRel = 1;
					for (var i = 0; i < 20 && i < sorted.length; ++i) {
						tags.push(sorted[i][1]);
						rels.push(sorted[i][0] / maxRel);
					}
				}
				ret['tags'] = tags;
				ret['rels'] = rels;
				//console.log('got tags for ' + url);
				//console.log(tags);
				//debug('tagger ok');
				handler(ret);
				//console.log(JSON.stringify(ret));
			}

			this.getTags2 = function (url, html, callback) {
				//debug('extracting article');
				// extract article from html
				var text = MePersonality.tagger.extractArticle(html);
				if (text == '')
					text = MePersonality.tagger.stripHTML(html);
				//console.log(text);

				//debug('translating');
				/*var languages = [['sk', 'sk'], ['cz', 'cz'], ['de', 'de'],
					['at', 'de'], ['ru', 'ru'], ['es', 'es'], ['fr', 'fr'],
					['it', 'it'], ['hu', 'hu'], ['pl', 'pl']];
					for (var i = 0; i < languages.length; ++i) {
					if (new RegExp('/[^/]+\\.' + languages[i][0] + '/').test(url)) {
					MePersonality.translator.translate(text, function (translation) {
					MePersonality.tagger.getTags3(url, html, translation, callback);
					}, languages[i][1]);
					return;
					}
					}*/
				if (MePersonality.tagger.isEnglish(text)) {
					MePersonality.tagger.getTags3(url, html, text, callback);
					return;
				}
				/*MePersonality.translator.translate(text, function (translation) {
					MePersonality.tagger.getTags3(url, html, translation, callback);
					});*/
				callback({ 'url': url, 'tags': [] });
			}

			this.getTags = function (params, callback) {
				if (!params.url) {
					callback({ 'error': 'URL must be specified' });
					return;
				}
				var url = params.url;
				var whitelist = [
					/http:\/\/.*/,
					/https:\/\/*\.google\..*/,
					/https:\/\/*\.facebook\..*/,
					/https:\/\/*\.youtube\..*/,
					/https:\/\/*\.mozilla\.org.*/
						];
				var valid = false;
				for (var i = 0; i < whitelist.length; ++i) {
					if (whitelist[i].test(url)) {
						valid = true;
						break;
					}
				}
				var blacklist = [
					];
				for (var i = 0; i < blacklist.length; ++i) {
					if (blacklist[i].test(url)) {
						callback({ 'url': url, 'tags': [], 'rels': [] });
						return;
					}
				}
				if (!valid) {
					// TODO: send report about new URL domain
					callback({ 'error': 'The requested URL is not allowed' });
					return;
				}
				MePersonality.db.get('keyword_cache',url,function(response){
					if (response){
						callback(response);
						return;
					}
					if (!params.text) {
						if (!params.html==undefined) {
							if (MePersonality.browser.debug) {
								// TODO: if stored ...
							}
							MePersonality.browser.xhr.get({ 'url': url }, function (response) {
								var contentType = response.headers['content-type'] || response.headers['Content-Type'];
								if (contentType && contentType.indexOf('text') >= 0) {
									params.html = response.text;
									MePersonality.tagger.getTags(params, callback);
								}
								else {
									callback({ 'error': 'Non-textual content' });
								}
							});
							return;
						}
						if (!params.html){
							callback({ 'error': 'Empty content' });
							return;
						}
						var text = MePersonality.tagger.extractArticle(params.html);
						if (!text)
					text = MePersonality.tagger.stripHTML(params.html);
						params.text = text;
						MePersonality.tagger.getTags(params, callback);
						return;
					}
					var html = params.html;
					var text = params.text;
					var lang = MePersonality.tagger.getLanguage(text);
					params.language = lang.language;
					//debug('tagging ' + url);
					for (var taggerId in taggers) {
						var tagger = taggers[taggerId];
						if (tagger.isValidURL().test(url)) {
							try {
								tagger.tag(params, callback); // TODO: add API functions to params object
							} catch (e) {
								console.error(tagger.name + ' (' + taggerId + ') failed to tag ' + url);
								console.error(e);
								callback({
									'error': tagger.name + ' failed to tag ' + url,
									'cause': e
								});
							}
							return;
						}
					}
					console.log('language: ' + params.language);
					if (params.language != 'en'){
						callback({ 'error': 'Non-english text' });
						return;
					}
					if (searchURL.test(url)) {
						// extrahuj query
						var q = decodeURIComponent(query.exec(url)).
							substr(3).toLowerCase();
						if (q.indexOf(' ') != -1)
							q = q.split(' ');
						else
							q = q.split('+');
						var tags = [], rels = [];
						for (var i = 0; i < q.length; ++i)
							if (!stopword.test(q[i])) {
								tags.push(q[i]);
								rels.push(1);
							}
						callback({
							'url': url, 'title': 'Search for ' + q.join(' '),
							'tags': tags, 'rels': rels
						});
						return;
					}
					if (params.getSynsets) {
						var words = getWords(text);
						params.words = words;
						This.wordnet.synsetRank(params, callback);
						return;
					}
					MePersonality.tagger.getTags3(url, html, text, function(results){
						MePersonality.db.set('keyword_cache',url,results,function(){
							callback(results);
						});
					});
					//xhrGet(url, null, function (body, headers) {
					//	if (headers && headers.indexOf('Content-Type: text/html') != -1)
					//		MePersonality.tagger.getTags2(url, body, callback);
					//	else {
					//		callback({ 'url': url, tags: [] });
					//	}
					//});
				});
			}

			//loadTaggers();
};
