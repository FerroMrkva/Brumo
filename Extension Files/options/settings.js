//<![CDATA[
var userID;

function loaded() {
    $('#installUpdate').click(installUpdate);
    $('#generateUserID').click(generateUserID);
    $('#removeUserID').click(removeUserID);
    MP.browser.getVersion(function (version) {
        $('#version').text('Current version: ' + version);
        loadUserID(function () {
            checkForUpdate();
        });
    });
};

function loadUserID(callback) {
    MP.db.get('info', 'userID', function (uid) {
        if (!uid) {
            $('#userID').html('Your are now anonymous.');
            $('#removeUserID').css('display', 'none');
            $('#generateUserID').css('display', '');
            callback();
            return;
        }
        userID = 'Your user ID: ' + uid;
        $('#userID').html(userID);
        $('#removeUserID').css('display', '');
        $('#generateUserID').css('display', 'none');
        MP.db.get('info', '_hiddenUserID', function (hidden_uid) {
            if (!hidden_uid) {
                MP.db.set('info', '_hiddenUserID', uid, callback);
            }
            else {
                callback();
            }
        });
    });
}

function unloaded() {
};

function generateUserID() {
    var id;
    MP.db.get('info', '_hiddenUserID', function (uid) {
        if (uid) {
            // already generated, use the old one
            MP.db.set('info', 'userID', uid, function () {
                userID = uid;
                $('#userID').html('Your user ID: ' + userID);
                $('#removeUserID').css('display', '');
                $('#generateUserID').css('display', 'none');
            });
        }
        else {
            MP.net._connect({ 'channel': 'genuid' }, function (params) {
                if (params.subscribed) {
                    id = params.id;
                    return;
                }
                if (params.message) {
                    MP.db.set('info', '_hiddenUserID', params.message, function () {
                        MP.db.set('info', 'userID', params.message, function () {
                            userID = params.message;
                            $('#userID').html('Your user ID: ' + userID);
                            $('#removeUserID').css('display', '');
                            $('#generateUserID').css('display', 'none');
                        });
                    });
                    MP.net._disconnect({ 'id': id, 'channel': 'genuid' });
                }
                else if (params.error) {
                    $('#userID').html(params.message).addClass('errorText');
                    setTimeout(function () {
                        $('#userID').html('Your are now anonymous.').removeClass('errorText').addClass('infoText');
                    }, 5000);
                    MP.net._disconnect({ 'id': id, 'channel': 'genuid' });
                }
            });
        }
    });
}

function removeUserID() {
    userID = undefined;
    $('#userID').html('Your are now anonymous.');
    $('#removeUserID').css('display', 'none');
    $('#generateUserID').css('display', '');
    MP.db.remove('info', 'userID');
}

function checkForUpdate() {
    $('#checkStatus').text('Checking for updates...');
    $('#checkStatusloader').css('display', '');
    MP.browser.checkForUpdate({}, function (params) {
        $('#checkStatusloader').css('display', 'none');
        if (params.update) {
            $('#checkStatus').text('Update available.');
            $('#installUpdate').css('display', '');
        }
        else if (params.error) {
            $('#checkStatus').text('Error: Cannot check for updates.');
        }
        else {
            $('#checkStatus').text('Your version is up to date.');
        }
    });
}

function installUpdate() {
    $('#installUpdate').css('display', 'none');
    $('#checkStatus').text('Installing update...');
    $('#checkStatusloader').css('display', '');
    MP.browser.getVersion(function (oldVersion) {
        MP.browser.checkForUpdate({ 'installUpdate': true }, function () {
            var t = setInterval(function () {
                MP.browser.getVersion(function (curVersion) {
                    if (curVersion != oldVersion) {
                        clearInterval(t);
                        $('#version').text('Current version: ' + curVersion);
                        $('#checkStatusloader').css('display', 'none');
                        $('#checkStatus').text('Update installed successfully.');
                    }
                });
            }, 100);
        });
    });
}

//]]>