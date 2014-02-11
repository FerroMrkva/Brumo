this.onDOMContentLoaded=function(){
	// Here you can write your extension code that runs when the page's DOM is fully constructed,
	// but the referenced resources may not finish loading.
};

this.onUnload = function () {
    // Here you can write your extension code that runs when the page is unloaded.
    // You shouldn't use any asynchronous calls here, since after all synchronous code is executed,
    // the webpage including your content script is destroyed and becomes unaccessible.
};

this.bgCode=function(){
	// Here you can write your extension code that runs in the background.
};
