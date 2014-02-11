PublicJS.handleMessage = function (request, sendResponse) {
    if (request == 'ping') {
        sendResponse('pong');
    }
    if (request.command == 'getExtensions') {
        sendResponse(extensionCode);
    }
    else if (request.type == 'db') {
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
    else if (request.type == 'indexer') {
        // Indexer queries
        if (request.command == 'indexHistory') {
            MePersonality.indexer.indexHistory(request.countLimit);
        }
        else if (request.command == 'clearIndexer') {
            MePersonality.indexer.clear();
        }
        else if (request.command == 'updateIndexer') {
            MePersonality.indexer.updateIndex();
            MePersonality.indexer.removeOld();
        }
        else if (request.command == 'cancelIndexing') {
            MePersonality.indexer.getState().cancelled = true;
        }
        else if (request.command == 'getDomains') {
            MePersonality.indexer.getDomains(request.count, sendResponse);
        }
        else if (request.command == 'getUserTags') {
            MePersonality.indexer.getUserTags(request.count, sendResponse);
        }
        else if (request.command == 'getUserTagsByDomain') {
            MePersonality.indexer.getUserTagsByDomain(request.domain, request.count, sendResponse);
        }
        else if (request.command == 'getUrlsByTag') {
            MePersonality.indexer.getUrlsByTag(request.tag, request.count, sendResponse);
        }
        else if (request.command == 'getTagsByUrl') {
            MePersonality.indexer.getTagsByUrl(request.url, request.count, sendResponse);
        }
        else if (request.command == 'getTagRelevancy') {
            MePersonality.indexer.getTagRelevancy(request.tag, sendResponse);
        }
        else if (request.command == 'getUrlDetails') {
            MePersonality.indexer.getUrlDetails(request.url, sendResponse);
        }
        else if (request.command == 'getState') {
            if (!MePersonality.indexer.getState().current) {
                console.warn("Invalid indexer state");
                return;
            }
            sendResponse(MePersonality.indexer.getState());
        }
    }
    else if (request.type == 'tagger') {
        // tagger
        if (request.command == 'getTags') {
            MePersonality.tagger.getTags(request.params, sendResponse);
        }
        else if (request.command == 'extractArticle') {
            MePersonality.tagger.extractArticle(request.params, sendResponse);
        }
        else if (request.command == 'getWords') {
            MePersonality.tagger.getWords(request.params, sendResponse);
        }
        else if (request.command == 'getPOStags') {
            MePersonality.tagger.getPOStags(request.params, sendResponse);
        }
        else if (request.command == 'synsetRank') {
            MePersonality.tagger.synsetRank(request.params, sendResponse);
        }
        else if (request.command == 'loadTagger') {
            reloadTagger(request.taggerId, function (params) {
                sendResponse({ 'success': params });
            }, function (params) {
                sendResponse({ 'error': params });
            });
        }
        else if (request.command == 'removeTagger') {
            removeTagger(request.taggerId, sendResponse);
        }
    }
    else if (request.type == 'ext') {
        // Extensions
        if (request.command == 'getExtensionList') {
            MePersonality.db.get('extensions', 'list', function (extList) {
                sendResponse({ 'extList': extList });
            });
        }
        else if (request.command == 'getExtension') {
            MePersonality.db.get('extensions', request.extId, function (ext) {
                sendResponse({ 'ext': ext });
            });
        }
        else if (request.command == 'loadExtension') {
            reloadExtension(request.extId, function (params) {
                sendResponse({ 'success': params });
            }, function (params) {
                sendResponse({ 'error': params });
            });
        }
        else if (request.command == 'removeExtension') {
            removeExtension(request.extId, sendResponse);
        }
        else if (request.command == 'loadTagger') {
            MePersonality.tagger.reloadTagger(request.taggerId);
        }
    }
    else if (request.type == 'browser') {
        // internal
        if (request.command == 'notify') {
            MePersonality.browser.notify(request.params);
        }
        else if (request.command == 'checkForUpdate') {
            MePersonality.browser.checkForUpdate(request.params, sendResponse);
        }
        else if (request.command == 'getVersion') {
            sendResponse(MePersonality.browser.getVersion());
        }
        else if (request.command == 'openTab') {
            MePersonality.browser.openTab(request.params);
        }
        else if (request.command == 'searchHistory') {
            MePersonality.browser.searchHistory(request.params, sendResponse);
        }
    }
    else if (request.type == 'xhr') {
        // XHR request
        if (request.command == 'getResource') {
            MePersonality.browser.xhr.getResource(request.params, sendResponse);
        }
        else if (request.command == 'get') {
            MePersonality.browser.xhr.get(request.params, sendResponse);
        }
        else if (request.command == 'getJSON') {
            MePersonality.browser.xhr.getJSON(request.params, sendResponse);
        }
        else if (request.command == 'post') {
            MePersonality.browser.xhr.post(request.params, sendResponse);
        }
    }
    else if (request.type == 'tabs') {
        // internal
        if (request.command == 'getCurrent') {
            MePersonality.browser.tabs.getCurrent(sendResponse);
        }
        else if (request.command == 'create') {
            MePersonality.browser.tabs.create(request.params);
        }
        else if (request.command == 'openOptions') {
            MePersonality.browser.tabs.openOptions();
        }
    }
    else if (request.type == 'net') {
        // Communication
        if (request.command == '_connect') {
            MePersonality.net._connect(request.params, sendResponse);
        }
        else if (request.command == 'connect') {
            MePersonality.net.connect(request.params, sendResponse);
        }
        else if (request.command == '_send') {
            MePersonality.net._send(request.params, sendResponse);
        }
        else if (request.command == 'send') {
            MePersonality.net.send(request.params, sendResponse);
        }
        else if (request.command == '_disconnect') {
            MePersonality.net._disconnect(request.params, sendResponse);
        }
        else if (request.command == 'disconnect') {
            MePersonality.net.disconnect(request.params, sendResponse);
        }
    }
    else if (request.type == 'com') {
        if (request.command == 'send') {
            // TODO:
        }
    }
}
