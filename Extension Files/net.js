MePersonalityNet = function () {
    var serverURL = 'ws://brumo.fiit.stuba.sk/net/';
    var sockets = {};
    var This = this;
    var counter = 0;
    var pingSocket;
    this.ping = function (params, callback) {
        pingSocket = new WebSocket(serverURL + 'ping');
        var start = new Date();
        pingSocket.onerror = function (e) {
            callback({ 'error': e });
        }
        pingSocket.onmessage = function (msg) {
            var end = new Date();
            if (msg.data == 'pong')
                callback({ 'ok': true, 'time': end - start });
            else
                callback({ 'error': 'Bad response received.' });
            pingSocket.close();
        }
    }
    this._connect = function (params, callback) {
        var id = ('' + Math.random()).substr(2) + counter++;
        callback({ 'id': id, 'subscribed': true });
        if (sockets[params.channel]) {
            sockets[params.channel].clients.push({ 'id': id, 'callback': callback });
            var socket = sockets[params.channel].socket;
            if (socket.readyState == socket.OPEN)
                callback({ 'id': id, 'opened': true });
            else
                callback({ 'id': id, 'closed': true });
        }
        else {
            var t;
            var socket;
            function checkSocket() {
                //debug('checking socket ' + params.channel);
                if (!socket || socket.readyState == socket.CLOSED)
                    createNewSocket();
                else
                    clearInterval(t);
            }
            function createNewSocket() {
                function onmessage(msg) {
                    var clients = sockets[params.channel].clients;
                    //debug('got message ' + msg.data);
                    if (msg.data && msg.data.data) try {
                        msg.data = JSON.parse(msg.data.data);
                    } catch (e) {
                        console.error('Error parsing received message into JSON format');
                        console.error(e);
                        clients[i].callback({ 'id': clients[i].id, 'error': 'Error parsing received message into JSON format.', 'cause': e });
                    };
                    //debug('got message ' + msg.data);
                    for (var i = 0; i < clients.length; ++i) {
                        clients[i].callback({ 'id': clients[i].id, 'message': msg.data });
                    }
                }
                function onerror(msg) {
                    var clients = sockets[params.channel].clients;
                    for (var i = 0; i < clients.length; ++i) {
                        clients[i].callback({ 'id': clients[i].id, 'error': msg });
                    }
                }
                function onopen(msg) {
                    //debug('Channel ' + params.channel + ' opened.');
                    var clients = sockets[params.channel].clients;
                    for (var i = 0; i < clients.length; ++i) {
                        clients[i].callback({ 'id': clients[i].id, 'opened': msg });
                    }
                }
                function onclose(msg) {
                    //debug('Channel ' + params.channel + ' closed.');
                    if (!sockets[params.channel]) // this channel has been disconnected and all sockets are already closed
                        return;
                    var clients = sockets[params.channel].clients;
                    if (clients.length != 0) {
                        for (var i = 0; i < clients.length; ++i) {
                            clients[i].callback({ 'id': clients[i].id, 'closed': msg });
                        }
                        t = setInterval(checkSocket, 10000);
                    }
                }
                socket = new WebSocket(serverURL + params.channel);
                sockets[params.channel] = {
                    'socket': socket,
                    'clients': [{ 'id': id, 'callback': callback }]
                }
                socket.onmessage = onmessage;
                socket.onerror = onerror;
                socket.onopen = onopen;
                socket.onclose = onclose;
            }
            checkSocket();
        }
    };
    this.connect = function (params, callback) {
        params.channel = 'user_channel_' + params.channel;
        This._connect(params, callback);
    };
    this._send = function (params, callback) {
        debug('in channel ' + params.channel + ' send ' + JSON.stringify(params.data));
        if (sockets[params.channel]) {
            var socket = sockets[params.channel].socket;
            if (socket.readyState == socket.OPEN) {
                sockets[params.channel].socket.send(JSON.stringify({ 'data': params.data }));
                callback({ 'sent': true });
            }
            else {
                // socket is closed, send failed
                callback({ 'error': 'Channel is closed, trying to reconnect.' });
            }
        }
        else {
            // socket does not exist
            callback({ 'error': 'Channel is closed.' });
        }
    };
    this.send = function (params, callback) {
        params.channel = 'user_channel_' + params.channel;
        This._send(params, callback);
    };
    this._disconnect = function (params, callback) {
        //debug('disconnect ' + params.id + ' from ' + params.channel);
        if (!sockets[params.channel]) {
            //debug('channel ' + params.channel + ' already disconnected');
            callback({ 'error': 'Already disconnected.' });
            return;
        }
        var clients = sockets[params.channel].clients;
        var socket = sockets[params.channel].socket;
        function checkLastConnection() {
            if (clients.length == 0) {
                var socket = sockets[params.channel].socket;
                if (socket.readyState == socket.OPEN)
                    socket.close();
                delete sockets[params.channel];
            }
        }
        for (var i = 0; i < clients.length; ++i) {
            if (clients[i].id == params.id) {
                // TODO: if channel is already closed ?
                // if (socket.readyState == socket.OPEN)
                clients[i].callback({ 'id': clients[i].id, 'closed': true, '_removeCallback': true });
                //debug('client ' + clients[i].id + ' disconnected');
                clients[i] = clients[clients.length - 1];
                clients.pop();
                checkLastConnection();
                return;
            }
        }
        //debug('channel ' + params.channel + ' already disconnected');
        callback({ 'error': 'Already disconnected.' });
    }
    this.disconnect = function (params, callback) {
        params.channel = 'user_channel_' + params.channel;
        This._disconnect(params, callback);
    }
    this.getStatus = function (params, callback) {
        callback({ 'connected': connected });
    }
    var connected = false;
    var error;
    (function () {
        return;
        var last_ping = 0, failcnt = 0;
        var last_pong = new Date();
        This._connect({ 'channel': 'system' }, function (params) {
            if (params.message) {
                if (params.message == 'pong') {
                    failcnt = 0;
                    last_pong = new Date();
                    debug('ping latency: ' + (last_pong - last_ping) + 'ms');
                }
            }
            else if (params.error) {
            }
            else if (params.opened) {
                connected = true;
                console.info('Connection to the server has been established.');
            }
            else if (params.closed) {
                if (connected) {
                    connected = false;
                    console.warn('Connection to the server has been lost.');
                    for (var socket in sockets) {
                        var socket = socket.socket;
                        if (socket && socket.readyState == socket.OPEN)
                            socket.close();
                    }
                }
            }
        });
        setInterval(function () {
            var now = new Date();
            if (last_ping > last_pong) {
                if (now - last_pong > 10000) {
                    debug('ping latency: too big');
                    failcnt++;
                    if (failcnt > 5) {
                        if (connected) {
                            connected = false;
                            console.warn('Connection to the server has been lost.');
                            for (var socket in sockets) {
                                var socket = socket.socket;
                                if (socket && socket.readyState == socket.OPEN)
                                    socket.close();
                            }
                        }
                    }
                }
            }
            now = new Date();
            last_ping = now;
            This._send({ 'channel': 'system', 'data': 'ping' }, function (response) {
                if (response.error) {
                    console.error('ping error: ' + response.error);
                }
            });
        }, 5000);
    })();
};