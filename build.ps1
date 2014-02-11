$version = $(cat "Extension Files/version.txt")
echo "building version $version"

function build_chrome_extension {
	write-host "building chrome extension..." -nonewline
	if (test-path "chrome") { rm -r -force "chrome" }
	$dirs = "chrome", "chrome/data", "chrome/docs", "chrome/external", "chrome/external/jspos", "chrome/options", "chrome/options/ace"
	echo $dirs | % { if (!(test-path $_)) { [void](md $_) } }
	cat "Extension Files/chrome/manifest.json" | % {
		$_ -replace "`"version`":", "`"version`": $version"
	} | out-file "chrome/manifest.json" -encoding "utf8"
	cp -r "Extension Files/data/fonts" "chrome/options/"
	cp "Extension Files/data/fonts.css" "chrome/options/"
	cp "Extension Files/data/Brumo-19.png" "chrome/data/"
	cp "Extension Files/data/Brumo-38.png" "chrome/data/"
	cp "Extension Files/data/logo-short-16.png" "chrome/data/"
	cp "Extension Files/data/logo-short-48.png" "chrome/data/"
	cp "Extension Files/data/logo-short-64.png" "chrome/data/"
	cp "Extension Files/data/logo-short-128.png" "chrome/data/"
	cp "Extension Files/external/jquery-2.0.3.min.js" "chrome/external/"
	cp "Extension Files/external/jquery-ui-1.10.3.custom.min.js" "chrome/external/"
	cp "Extension Files/external/sha256.js" "chrome/external/"
	cp "Extension Files/external/sanitizer.js" "chrome/external/"
	cp "Extension Files/external/readability.js" "chrome/external/"
	cp "Extension Files/external/jspos/lexer.js" "chrome/external/jspos/"
	cp "Extension Files/external/jspos/lexicon.js" "chrome/external/jspos/"
	cp "Extension Files/external/jspos/POSTagger.js" "chrome/external/jspos/"
	cp "Extension Files/net.js" "chrome/"
	#cp "Extension Files/translator.js" "chrome/"
	cp "Extension Files/ngrams.js" "chrome/"
	cp "Extension Files/tagger.js" "chrome/"
	cp "Extension Files/options/ace/ace.js" "chrome/options/ace/"
	cp "Extension Files/options/ace/theme-textmate.js" "chrome/options/ace/"
	cp "Extension Files/options/ace/theme-chrome.js" "chrome/options/ace/"
	cp "Extension Files/options/ace/mode-html.js" "chrome/options/ace/"
	cp "Extension Files/options/ace/mode-javascript.js" "chrome/options/ace/"
	cp "Extension Files/options/ace/worker-javascript.js" "chrome/options/ace/"
	cat "Extension Files/options/options.html" | % {
		$_;	if ($_ -match "INSERT_CONTENT") {
			echo '<script type=\"text/javascript\" src=\"../content.js\" charset=\"utf-8\"></script>'
		}
	} | out-file "chrome/options/options.html" -encoding "utf8"
	cp "Extension Files/options/options.css" "chrome/options/"
	cp "Extension Files/options/options.js" "chrome/options/"
	cp "Extension Files/data/loader-black-64.gif" "chrome/options/"
	cp "Extension Files/options/home.html" "chrome/options/"
	cat "Extension Files/options/model.html" | % {
		$_;	if ($_ -match "inlineScript") {
			cat "Extension Files/options/model.js"
		}
	} | out-file "chrome/options/model.html" -encoding "utf8"
	cat "Extension Files/options/tagURLs.html" | % {
		$_;	if ($_ -match "inlineScript") {
			cat "Extension Files/options/tagURLs.js"
		}
	} | out-file "chrome/options/tagURLs.html" -encoding "utf8"
	cat "Extension Files/options/browseOnlineExtensions.html" | % {
		$_;	if ($_ -match "inlineScript") {
			cat "Extension Files/options/browseOnlineExtensions.js"
		}
	} | out-file "chrome/options/browseOnlineExtensions.html" -encoding "utf8"
	cat "Extension Files/options/browseOnlineTaggers.html" | % {
		$_;	if ($_ -match "inlineScript") {
			cat "Extension Files/options/browseOnlineTaggers.js"
		}
	} | out-file "chrome/options/browseOnlineTaggers.html" -encoding "utf8"
	cat "Extension Files/options/extensions.html" | % {
		$_;	if ($_ -match "inlineScript") {
			cat "Extension Files/options/extensions.js"
		}
	} | out-file "chrome/options/extensions.html" -encoding "utf8"
	cat "Extension Files/options/taggers.html" | % {
		$_;	if ($_ -match "inlineScript") {
			cat "Extension Files/options/taggers.js"
		}
	} | out-file "chrome/options/taggers.html" -encoding "utf8"
	cat "Extension Files/options/settings.html" | % {
		$_;	if ($_ -match "inlineScript") {
			cat "Extension Files/options/settings.js"
		}
	} | out-file "chrome/options/settings.html" -encoding "utf8"
	cat "Extension Files/options/addExtension.html" | % {
		$_;	if ($_ -match "inlineScript") {
			cat "Extension Files/options/addExtension.js"
		}
	} | out-file "chrome/options/addExtension.html" -encoding "utf8"
	cat "Extension Files/options/addTagger.html" | % {
		$_;	if ($_ -match "inlineScript") {
			cat "Extension Files/options/addTagger.js"
		}
	} | out-file "chrome/options/addTagger.html" -encoding "utf8"
	cp "Extension Files/options/extensionTemplate.js" "chrome/options/"
	cp "Extension Files/options/taggerTemplate.js" "chrome/options/"
	cp "Extension Files/docs/communicationAPI.html" "chrome/docs/"
	cp "Extension Files/docs/databaseAPI.html" "chrome/docs/"
	cp "Extension Files/docs/index.html" "chrome/docs/"
	cp "Extension Files/docs/personalisationAPI.html" "chrome/docs/"
	cat "Extension Files/content.js" | % {
		$_;	if ($_ -match "/// MP_API") {
			cat "Extension Files/api.js"
		}
		if ($_ -match "/// BROWSER_SPECIFIC") {
			cat "Extension Files/chrome/content.js"
		}
	} | out-file "chrome/content.js" -encoding "utf8"
	cp "Extension Files/extContent.js" "chrome/"
	cp "Extension Files/chrome/background.html" "chrome/"
	cat "Extension Files/background.js" | % {
		$_;	if ($_ -match "function browser()") {
			echo "MePersonalityBrowser = MePersonalityGoogleChromeBrowser;"
			cat "Extension Files/browser.js"
		}
		if ($_ -match "function heap()") {
			cat "Extension Files/heap.js"
		}
		if ($_ -match "function radixTrie()") {
			cat "Extension Files/radixTrie.js"
		}
		if ($_ -match "function database()") {
			echo "MePersonalityDatabase = MePersonalityWebSQLDatabase;"
			cat "Extension Files/database.js"
		}
		if ($_ -match "function xhr()") {
			cat "Extension Files/xhr.js"
		}
		if ($_ -match "function indexer()") {
			cat "Extension Files/indexer.js"
		}
		if ($_ -match "/// BACKGROUND") {
			cat "Extension Files/bg.js"
		}
		if ($_ -match "function bgMessageHandler()") {
			cat "Extension Files/bgMessageHandler.js"
		}
	} | out-file "chrome/background.js" -encoding "utf8"
	cp -r "Extension Files/marius" "chrome/"
	echo ok
}

function build_firefox_extension {
	write-host "building firefox extension..." -nonewline
	if (test-path "firefox") { rm -r -force "firefox" }
	$dirs = "firefox", "firefox/data", "firefox/data/docs", "firefox/data/external", "firefox/data/external/jspos", "firefox/data/options", "firefox/data/options/ace", "firefox/packages", "firefox/background"
	echo $dirs | % { if (!(test-path $_)) { [void](md $_) } }
	cat "Extension Files/firefox/package.json" | % {
		$_ -replace "`"version`":", "`"version`": $version"
	} | out-file "firefox/package.json" -encoding "ascii"
	cp -r "Extension Files/external/browser-action-jplib" "firefox/packages/"
	cp -r "Extension Files/external/toolbarwidget-jplib" "firefox/packages/"
	cp -r "Extension Files/data/fonts" "firefox/data/options/"
	cp "Extension Files/data/fonts.css" "firefox/data/options/"
	cp "Extension Files/data/Brumo.png" "firefox/data/"
	cp "Extension Files/data/logo-short-16.png" "firefox/data/"
	cp "Extension Files/data/logo-short-48.png" "firefox/data/"
	cp "Extension Files/data/logo-short-64.png" "firefox/data/"
	cp "Extension Files/data/logo-short-128.png" "firefox/data/"
	cp "Extension Files/external/jquery-2.0.3.min.js" "firefox/data/external/"
	cp "Extension Files/external/jquery-ui-1.10.3.custom.min.js" "firefox/data/external/"
	cp "Extension Files/external/sha256.js" "firefox/data/external/"
	cp "Extension Files/external/sanitizer.js" "firefox/data/external/"
	cp "Extension Files/external/readability.js" "firefox/data/external/"
	cp "Extension Files/external/jspos/lexer.js" "firefox/data/external/jspos/"
	cp "Extension Files/external/jspos/lexicon.js" "firefox/data/external/jspos/"
	cp "Extension Files/external/jspos/POSTagger.js" "firefox/data/external/jspos/"
	cp "Extension Files/net.js" "firefox/data/"
	#cp "Extension Files/translator.js" "firefox/data/"
	cp "Extension Files/ngrams.js" "firefox/data/"
	cp "Extension Files/tagger.js" "firefox/data/"
	cp "Extension Files/firefox/hidden.html" "firefox/data/"
	cp "Extension Files/firefox/hidden.js" "firefox/data/"
	cp "Extension Files/options/ace/ace.js" "firefox/data/options/ace/"
	cp "Extension Files/options/ace/theme-textmate.js" "firefox/data/options/ace/"
	cp "Extension Files/options/ace/theme-chrome.js" "firefox/data/options/ace/"
	cp "Extension Files/options/ace/mode-html.js" "firefox/data/options/ace/"
	cp "Extension Files/options/ace/mode-javascript.js" "firefox/data/options/ace/"
	cp "Extension Files/options/ace/worker-javascript.js" "firefox/data/options/ace/"
	cp "Extension Files/options/options.html" "firefox/data/options/"
	cp "Extension Files/options/options.css" "firefox/data/options/"
	cp "Extension Files/options/options.js" "firefox/data/options/"
	cp "Extension Files/data/loader-black-64.gif" "firefox/data/options/"
	cp "Extension Files/options/home.html" "firefox/data/options/"
	cat "Extension Files/options/model.html" | % {
		$_;	if ($_ -match "inlineScript") {
			cat "Extension Files/options/model.js"
		}
	} | out-file "firefox/data/options/model.html" -encoding "utf8"
	cat "Extension Files/options/tagURLs.html" | % {
		$_;	if ($_ -match "inlineScript") {
			cat "Extension Files/options/tagURLs.js"
		}
	} | out-file "firefox/data/options/tagURLs.html" -encoding "utf8"
	cat "Extension Files/options/browseOnlineExtensions.html" | % {
		$_;	if ($_ -match "inlineScript") {
			cat "Extension Files/options/browseOnlineExtensions.js"
		}
	} | out-file "firefox/data/options/browseOnlineExtensions.html" -encoding "utf8"
	cat "Extension Files/options/browseOnlineTaggers.html" | % {
		$_;	if ($_ -match "inlineScript") {
			cat "Extension Files/options/browseOnlineTaggers.js"
		}
	} | out-file "firefox/data/options/browseOnlineTaggers.html" -encoding "utf8"
	cat "Extension Files/options/extensions.html" | % {
		$_;	if ($_ -match "inlineScript") {
			cat "Extension Files/options/extensions.js"
		}
	} | out-file "firefox/data/options/extensions.html" -encoding "utf8"
	cat "Extension Files/options/taggers.html" | % {
		$_;	if ($_ -match "inlineScript") {
			cat "Extension Files/options/taggers.js"
		}
	} | out-file "firefox/data/options/taggers.html" -encoding "utf8"
	cat "Extension Files/options/settings.html" | % {
		$_;	if ($_ -match "inlineScript") {
			cat "Extension Files/options/settings.js"
		}
	} | out-file "firefox/data/options/settings.html" -encoding "utf8"
	cat "Extension Files/options/addExtension.html" | % {
		$_;	if ($_ -match "inlineScript") {
			cat "Extension Files/options/addExtension.js"
		}
	} | out-file "firefox/data/options/addExtension.html" -encoding "utf8"
	cat "Extension Files/options/addTagger.html" | % {
		$_;	if ($_ -match "inlineScript") {
			cat "Extension Files/options/addTagger.js"
		}
	} | out-file "firefox/data/options/addTagger.html" -encoding "utf8"
	cp "Extension Files/options/extensionTemplate.js" "firefox/data/options/"
	cp "Extension Files/options/taggerTemplate.js" "firefox/data/options/"
	cp "Extension Files/docs/communicationAPI.html" "firefox/data/docs/"
	cp "Extension Files/docs/databaseAPI.html" "firefox/data/docs/"
	cp "Extension Files/docs/index.html" "firefox/data/docs/"
	cp "Extension Files/docs/personalisationAPI.html" "firefox/data/docs/"
	cat "Extension Files/content.js" | % {
		$_;	if ($_ -match "/// MP_API") {
			cat "Extension Files/api.js"
		}
		if ($_ -match "/// BROWSER_SPECIFIC") {
			cat "Extension Files/firefox/content.js"
		}
	} | out-file "firefox/data/content.js" -encoding "utf8"
	cp "Extension Files/extContent.js" "firefox/data/"
	cat "Extension Files/background.js" | % {
		$_;	if ($_ -match "function browser()") {
			cat "Extension Files/browser.js"
			echo "MePersonalityBrowser = MePersonalityMozillaFirefoxBrowser;"
		}
		if ($_ -match "function heap()") {
			cat "Extension Files/heap.js"
		}
		if ($_ -match "function radixTrie()") {
			cat "Extension Files/radixTrie.js"
		}
		if ($_ -match "function database()") {
			cat "Extension Files/database.js"
			echo "MePersonalityDatabase = MePersonalityFirefoxSQLiteStorageDatabase;"
		}
		if ($_ -match "function xhr()") {
			cat "Extension Files/xhr.js"
		}
		if ($_ -match "function indexer()") {
			cat "Extension Files/indexer.js"
		}
		if ($_ -match "/// BACKGROUND") {
			cat "Extension Files/bg.js"
		}
		if ($_ -match "function bgMessageHandler()") {
			cat "Extension Files/bgMessageHandler.js"
		}
	} | out-file "firefox/background/background.js" -encoding "utf8"
	cp -r "Extension Files/marius" "firefox/data/"
	echo ok
}

build_chrome_extension
build_firefox_extension
