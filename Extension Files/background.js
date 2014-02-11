var MePersonality = {};
// public objects
var PublicJS = {};
var MePersonalityBrowser;
var MePersonalityDatabase;
var MePersonalityIndexer;
var MePersonalityHeap;
var MePersonalityRadixTrie;

function debug(e) {
    if (MP.browser.debug)
        console.debug(e);
}

(function browser() {
})();

(function heap() {
})();

(function radixTrie() {
})();

/// DATABASE
(function database() {
})();

(function xhr() {
})();

(function readability() {
})();

(function translator() {
})();

(function ngrams() {
})();

(function POSTagger() {
    /// LEXER
    /// LEXICON
    /// POSTAGGER
})();

(function tagger() {
})();

(function net() {
})();

(function indexer() {
})();

/// BACKGROUND

(function bgMessageHandler() {
})();

/// BG_CONNECTOR

(function firefox() {
    //var tabs = require("tabs");
    //tabs.open('http://en.wikipedia.org/wiki/Bayesian_network');
    //tabs.open('http://en.wikipedia.org/wiki/2012_Lamma_Island_ferry_collision');
    //tabs.open('http://en.wikipedia.org/wiki/Bayesian_network');
    //tabs.open('http://en.wikipedia.org/wiki/2012_Lamma_Island_ferry_collision');
    //tabs.open('http://www.google.com');
    //tabs.open('http://www.bing.com');
    //tabs.open('http://www.yahoo.com');
    //tabs.open('http://www.sme.sk');
})();

(function main() {
    MePersonality.browser = new MePersonalityBrowser();
    MePersonality.browser.init({}, function () {
        MP = MePersonality;
        debug('Running Brumo version ' + MP.browser.getVersion());
        function showError(e) {
            MP.browser.notify({ text: JSON.stringify(e) });
            console.error(e);
        }
        MePersonality.db = new MePersonalityDatabase();
        if (!MePersonality.translator)
            MePersonality.translator = new MePersonalityTranslator();
        if (!MePersonality.ngrams)
            MePersonality.ngrams = new MePersonalityNgrams();
        if (!MePersonality.tagger)
            MePersonality.tagger = new MePersonalityTagger();
        if (!MePersonality.net)
            MePersonality.net = new MePersonalityNet();
        MePersonality.indexer = new MePersonalityIndexer();
        try {
            //console.log('Loading indexer data...');
            //MePersonality.indexer.load(); // TODO: async db
        } catch (e) {
            console.error('Failed to load indexer data. Index will be created.');
            console.error(e);
				}
				debug('Loading taggers and extensions...');
				loadTaggers(function () {
					debug('Local taggers loaded.');
					installResearchTaggers(function () {
						debug('Remote taggers loaded.');
						loadExtensions(function () {
							debug('Local extensions loaded.');
							installResearchExtensions(function () {											
								installLocalExtensions(function () {
									debug('Remote extensions loaded.');
									MP.browser.notify({ text: 'Brumo loaded successfully (version ' + MP.browser.getVersion() + ')' });
										MP.db.set('info', 'version', MePersonality.browser.getVersion(), function () {
											MP.browser.checkForUpdate({ 'installUpdate': true }, function (params) {
												if (params.update) {
													This.notify({ title: 'Brumo updater', text: 'Update available. Installing update now.' });
												}
											});
										});
										}, showError);
									}, showError);
								}, showError);
							}, showError);
						}, showError);
					//checkUserID();
					setInterval(function () {
						checkForUpdate({ 'installUpdate': true });
					}, 60 * 60000); // every 60 minutes
		});
})();
