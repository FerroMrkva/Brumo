var MePersonality = function () {
    this.db = {
        clear:
			function (table, callback) {
			    if (!callback)
			        callback = function () { };
			    sendMessage({
			        type: 'db',
			        command: 'clear',
			        'table': table
			    }, callback);
			},
        get:
			function (table, key, callback) {
			    sendMessage({
			        type: 'db',
			        command: 'get',
			        'table': table,
			        'key': key
			    }, callback);
			},
        set:
			function (table, key, value, callback) {
			    if (!callback)
			        callback = function () { };
			    sendMessage({
			        type: 'db',
			        command: 'set',
			        'table': table,
			        'key': key,
			        'value': value
			    }, callback);
			},
        remove:
			function (table, key, callback) {
			    if (!callback)
			        callback = function () { };
			    sendMessage({
			        type: 'db',
			        command: 'remove',
			        'table': table,
			        'key': key
			    }, callback);
			},
        getTransaction:
			function (table, key, callback) {
			    sendMessage({
			        type: 'db',
			        command: 'getTransaction'
			    }, callback);
			}
    };
    this.me = {
        getDomains:
			function (query, callback) {
			    if (!query)
			        query = {};
			    if (!callback)
			        callback = function (domains) {
			            console.log(domains);
			        };
			    sendMessage({
			        type: 'indexer',
			        command: 'getDomains',
			        count: query.maxResults
			    }, callback);
			},
        getUserTags:
			function (query, callback) {
			    if (!query)
			        query = {};
			    if (!callback)
			        callback = function (userTags) {
			            console.log(userTags);
			        };
			    sendMessage({
			        type: 'indexer',
			        command: 'getUserTags',
			        count: query.maxResults
			    }, callback);
			},
        getUserTagsByDomain:
			function (query, callback) {
			    if (!query || !query.domain) {
			        console.error('Error: getUserTagsByDomain: Domain must be defined.');
			        callback(undefined);
			    }
			    if (!callback)
			        callback = function (userTags) {
			            console.log(userTags);
			        };
			    sendMessage({
			        type: 'indexer',
			        command: 'getUserTagsByDomain',
			        domain: query.domain,
			        count: query.maxResults
			    }, callback);
			},
        getUrlsByTag:
			function (query, callback) {
			    if (!query || !query.tag) {
			        console.error('Error: getUrlsByTag: Tag must be defined.');
			        callback(undefined);
			    }
			    if (!callback)
			        callback = function (urls) {
			            console.log(urls);
			        };
			    sendMessage({
			        type: 'indexer',
			        command: 'getUrlsByTag',
			        tag: query.tag,
			        count: query.maxResults
			    }, callback);
			},
        getTagsByUrl:
			function (query, callback) {
			    if (!query || !query.url) {
			        console.error('Error: getTagsByUrl: Url must be defined.');
			        callback(undefined);
			    }
			    if (!callback)
			        callback = function (tags) {
			            console.log(tags);
			        };
			    sendMessage({
			        type: 'indexer',
			        command: 'getTagsByUrl',
			        tag: query.url,
			        count: query.maxResults
			    }, callback);
			},
        getTagRelevancy:
			function (query, callback) {
			    if (!query || !query.tag) {
			        console.error('Error: getTagRelevancy: Tag must be defined.');
			        callback(undefined);
			    }
			    if (!callback)
			        callback = function (relevancy) {
			            console.log(relevancy);
			        };
			    sendMessage({
			        type: 'indexer',
			        command: 'getTagRelevancy',
			        tag: query.tag
			    }, callback);
			},
        getUrlDetails:
			function (query, callback) {
			    if (!callback)
			        callback = function (details) {
			            console.log(details);
			        };
			    if (!query || !query.url) {
			        console.error('Error: getUrlDetails: Url must be defined.');
			        callback(undefined);
			    }
			    sendMessage({
			        type: 'indexer',
			        command: 'getUrlDetails',
			        url: query.url
			    }, callback);
			}
    }
    this.tagger = {
        getWords:
			function (params, callback) {
			    /*
                 * params = {
                 *              text: ['string','Text to be tokenised.']
                 *          }
                 *
                 * callback = {
                 *                words:['array','Words of tokenised text.']
                 *            }
                 */
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
			    /*
                 * params = {
                 *              words:['array','Words of tokenised text.']
                 *          }
                 *
                 * callback = {
                 *                taggedWords:'words of tokenised text'
                 *            }
                 */
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
        extractArticle:
			function (params, callback) {
			    /*
                 * params = {
                 *              html:'source code of a web page'
                 *          }
                 */
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
        synsetRank:
			function (params, callback) {
			    /*
                 * params = {
                 *              html:'source code of a web page'
                 *          }
                 */
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
                /*
                 * params = {
                 *              html:'source code of a web page'
                 *          }
                 */
                if (!callback)
                    callback = function (details) {
                        console.log(details);
                    };
                sendMessage({
                    type: 'tagger',
                    command: 'getTags',
                    'params': params
                }, callback);
            }
    };
    this.net = new function () {
        var callbacks = {}, _callbacks = {};
        this._connect = function (params, callback) {
            var channel = params.channel;
            sendMessage({
                type: 'net',
                command: '_connect',
                'params': params
            }, function (params) {
                if (params.subscribed) {
                    if (!_callbacks[channel])
                        _callbacks[channel] = {};
                    _callbacks[channel][params.id] = callback;
                }
                _callbacks[channel][params.id](params);
            }, true);
        };
        this.connect = function (params, callback) {
            /*
             * params = {
             *              html:'source code of a web page'
             *          }
             */
            var channel = params.channel;
            sendMessage({
                type: 'net',
                command: 'connect',
                'params': params
            }, function (params) {
                if (params.subscribed) {
                    if (!callbacks[channel])
                        callbacks[channel] = {};
                    callbacks[channel][params.id] = callback;
                }
                callbacks[channel][params.id](params);
            }, true);
        };
        this._send = function (params, callback) {
            sendMessage({
                type: 'net',
                command: '_send',
                'params': params
            }, function (params) {
                if (callback)
                    callback(params);
            });
        };
        this.send = function (params, callback) {
            /*
             * params = {
             *              html:'source code of a web page'
             *          }
             */
            sendMessage({
                type: 'net',
                command: 'send',
                'params': params
            }, function (params) {
                if (callback)
                    callback(params);
            });
        };
        this._disconnect = function (params, callback) {
            if (!params.id)
                return false;
            var channel = params.channel;
            sendMessage({
                type: 'net',
                command: '_disconnect',
                'params': params
            }, function (params) {
                if (callback)
                    callback(params);
                if (_callbacks[channel][params.id])
                    delete _callbacks[channel][params.id];
                if (_callbacks[channel])
                    delete _callbacks[channel];
            });
            return true;
        };
        this.disconnect = function (params, callback) {
            /*
             * params = {
             *              html:'source code of a web page'
             *          }
             */
            if (!params.id)
                return false;
            var channel = params.channel;
            sendMessage({
                type: 'net',
                command: 'disconnect',
                'params': params
            }, function (params) {
                if (callback)
                    callback(params);
                if (callbacks[channel][params.id])
                    delete callbacks[channel][params.id];
                if (callbacks[channel])
                    delete callbacks[channel];
            });
            return true;
        };
    };
    this.browser = {
        checkForUpdate:
			function (params, callback) {
			    /*
                 * params = {
                 *              html:'source code of a web page'
                 *          }
                 */
			    sendMessage({
			        type: 'browser',
			        command: 'checkForUpdate',
			        'params': params
			    }, callback);
			},
        getVersion:
			function (callback) {
			    /*
                 * params = {
                 *              html:'source code of a web page'
                 *          }
                 */
			    sendMessage({
			        type: 'browser',
			        command: 'getVersion'
			    }, callback);
			},
        notify:
			function (params) {
			    /*
                 * params = {
                 *              html:'source code of a web page'
                 *          }
                 */
			    sendMessage({
			        type: 'browser',
			        command: 'notify',
			        'params': params
			    });
			},
        openTab:
            function (params) {
                /*
                 * params = {
                 *              html:'source code of a web page'
                 *          }
                 */
                sendMessage({
                    type: 'browser',
                    command: 'openTab',
                    'params': params
                });
            },
        searchHistory:
            function (params, callback) {
                /*
                 * params = {
                 *              html:'source code of a web page'
                 *          }
                 */
                sendMessage({
                    type: 'browser',
                    command: 'searchHistory',
                    'params': params
                }, callback);
            }
    };
    this.xhr = {
        getResource:
			function (params, callback) {
			    /*
                 * params = {
                 *              html:'source code of a web page'
                 *          }
                 */
			    sendMessage({
			        type: 'xhr',
			        command: 'getResource',
			        'params': params
			    }, callback);
			},
        get:
			function (params, callback) {
			    /*
                 * params = {
                 *              html:'source code of a web page'
                 *          }
                 */
			    sendMessage({
			        type: 'xhr',
			        command: 'get',
			        'params': params
			    }, callback);
			},
        getJSON:
			function (params, callback) {
			    /*
                 * params = {
                 *              html:'source code of a web page'
                 *          }
                 */
			    sendMessage({
			        type: 'xhr',
			        command: 'getJSON',
			        'params': params
			    }, callback);
			},
        post:
			function (params, callback) {
			    /*
                 * params = {
                 *              html:'source code of a web page'
                 *          }
                 */
			    sendMessage({
			        type: 'xhr',
			        command: 'post',
			        'params': params
			    }, callback);
			}
    };
    this.tabs = {
        getCurrent:
            function (callback) {
                sendMessage({
                    type: 'tabs',
                    command: 'getCurrent'
                }, callback);
            },
        create:
            function (params) {
                sendMessage({
                    type: 'tabs',
                    command: 'create',
                    'params': params
                });
            },
        openOptions:
            function () {
                sendMessage({
                    type: 'browser',
                    command: 'openOptions'
                });
            },
    };
    this.com = {
        send:
            function (params, callback) {
                sendMessage({
                    type: 'com',
                    command: 'send',
                    'params': params
                }, callback);
            }
    }
}
