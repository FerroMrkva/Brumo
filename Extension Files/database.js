var MePersonalityVirtualDatabase = function () {
	var store = [];
	this.getTransaction = function (callback) {
		callback();
	}
	this.clear = function () {
		store = [];
	}
	this.get = function (key) {
		return store[key];
	}
	this.getAll = function () {
		return store;
	}
	this.set = function (key, value) {
		store[key] = value;
	}
	this.remove = function (key) {
		delete store[key];
	}
};

var MePersonalityLocalStorageDatabase = function () {
	var store = localStorage;
	this.getTransaction = function (callback) {
		callback();
	}
	this.clear = function (callback) {
		store.clear();
		if (callback)
			callback();
	}
	this.get = function (table, key, callback) {
		var item = store.getItem(table + key);
		if (item)
			item = JSON.parse(item);
		callback(item);
		return item;
	}
	this.set = function (table, key, value, callback) {
		if (!value) {
			if (callback)
				callback();
			return;
		}
		store.setItem(table + key, JSON.stringify(value));
		if (callback)
			callback();
	}
	this.remove = function (table, key, callback) {
		store.removeItem(table + key);
		if (callback)
			callback();
	}
};

var MePersonalityIndexedDB = function () {
	var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
	var db;
	var request = indexedDB.open("MePersonalityDatabase");
	request.onerror = function (e) {
		console.error(e);
	};
	request.onsuccess = function (e) {
		db = request.result;
	};
	request.onupgradeneeded = function (e) {
		console.log(e);
		return;
		var db = e.target.result;

		// Create an objectStore to hold information about our customers. We're
		// going to use "ssn" as our key path because it's guaranteed to be
		// unique.
		var objectStore = db.createObjectStore("store", { keyPath: "key" });

		// Create an index to search customers by name. We may have duplicates
		// so we can't use a unique index.
		objectStore.createIndex("key", "key", { unique: false });

		// Create an index to search customers by email. We want to ensure that
		// no two customers have the same email, so use a unique index.
		objectStore.createIndex("email", "email", { unique: true });

		// Store values in the newly created objectStore.
		for (i in customerData) {
			objectStore.add(customerData[i]);
		}
	};
	var request = db.transaction(["store"], webkitIDBTransaction.READ_WRITE)
		.objectStore("store")
		.delete("444-44-4444");
	request.onsuccess = function (e) {
		// It's gone!
	};

	var store = {};

	this.clear = function () {
		store.clear();
	}
	this.get = function (table, key, callback) {
		var item = store.getItem(table + key);
		callback(item && JSON.parse(item));
	}
	this.set = function (table, key, value) {
		if (!value) {
			store.removeItem(table + key);
			return;
		}
		store.setItem(table + key, JSON.stringify(value));
	}
	this.remove = function (table, key) {
		store.removeItem(table + key);
	}
}

var MePersonalityWebSQLDatabase = function () {
	var db;
	var thisDB = this;
	var transaction;
	var maxSize = 1024 * 1024 * 1024 * 10;

	function init() {
		db = openDatabase('BrumoDatabase', 1.0, 'Brumo database', maxSize);
	}

	this.db = function () {
		return db;
	}

	this.getTransaction = function (callback) {
		if (typeof (callback) != 'function')
			console.error('Database error: getTransaction: undefined callback function');
		db.transaction(function (tx) {
			transaction = tx;
			callback();
			transaction = null;
		});
	}

	this.clear = function (table, callback) {
		function clear(tx) {
			tx.executeSql('DROP TABLE ' + table + ';', [], function (tx) {
				if (callback)
					callback();
			}, function (tx, e) {
				console.error(e);
			});
		}
		if (transaction)
			clear(transaction);
		else
			db.transaction(clear);
	}
	this.get = function (table, key, callback) {
		if (typeof (callback) != 'function')
			console.error('Database error: get: undefined callback function');
		function get(tx) {
			tx.executeSql('CREATE TABLE IF NOT EXISTS ' + table + ' (key unique, value);', [], function (tx) {
				tx.executeSql('SELECT * FROM ' + table + ' WHERE key=?;', [key], function (tx, results) {
					if (!results.rows.length) {
						callback(undefined);
						return;
					}
					var item = results.rows.item(0).value;
					if (item) item = JSON.parse(item);
					callback(item);
				});
			});
		}
		if (transaction)
			get(transaction);
		else
			db.transaction(get);
	}
	this.set = function (table, key, value, callback) {
		function set(tx) {
			tx.executeSql('CREATE TABLE IF NOT EXISTS ' + table + ' (key unique, value);', [], function (tx) {
				tx.executeSql('INSERT INTO ' + table + ' values(?,?);', [key, JSON.stringify(value)], function (tx) {
					if (callback)
						callback();
				}, function (tx, e) {
					if (e.code == 6) {
						thisDB.update(table, key, value, callback);
					}
					else console.error(e);
				});
			});
		}
		if (transaction)
			set(transaction);
		else
			db.transaction(set);
	}
	this.update = function (table, key, value, callback) {
		function update(tx) {
			tx.executeSql('CREATE TABLE IF NOT EXISTS ' + table + ' (key unique, value);', [], function (tx) {
				tx.executeSql('UPDATE ' + table + ' SET value=? WHERE key=?;', [JSON.stringify(value), key], function (tx) {
					if (callback)
						callback();
				}, function (tx, e) {
					console.error(e);
				});
			});
		}
		if (transaction)
			update(transaction);
		else
			db.transaction(update);
	}
	this.remove = function (table, key, callback) {
		function remove(tx) {
			tx.executeSql('DELETE FROM ' + table + ' WHERE key=?;', [key], function (tx) {
				if (callback)
					callback();
			}, function (tx, e) {
				console.error(e);
			});
		}
		if (transaction)
			remove(transaction);
		else
			db.transaction(remove);
	}

	init();
}

var MePersonalityFirefoxSQLiteStorageDatabase = function () {
	var db;
	var thisDB = this;
	var transaction;
	var maxSize = 1024 * 1024 * 1024 * 10;
	var tables = {};

	function init() {
		var file = FileUtils.getFile("ProfD", ["BrumoDatabase.sqlite"]);
		db = Services.storage.openDatabase(file);
		//db = openDatabase('MePersonalityDatabase', 1.0, 'MePersonality database', maxSize);
	}

	this.db = function () {
		return db;
	}

	this.getTransaction = function (callback) {
		if (typeof (callback) != 'function') {
			console.error('Database error: getTransaction: undefined callback function');
			return;
		}
		callback();
		//db.transaction(function (tx) {
		//	transaction = tx;
		//	callback();
		//	transaction = null;
		//});
	}

	this.clear = function (table, callback) {
		var t = db.createStatement('DROP TABLE ' + table + ';');
		t.executeAsync({
			handleError: function (aError) {
				console.error("Error: " + aError.message);
			},
			handleCompletion: function (aReason) {
				if (aReason != PublicJS.Ci.mozIStorageStatementCallback.REASON_FINISHED)
					console.warn("Query canceled or aborted!");
				if (callback)
					callback();
			}
		});
	}
	this.get = function (table, key, callback) {
		if (typeof (callback) != 'function') {
			console.error('Database error: get: undefined callback function');
			return;
		}

		if (!tables[table]) {
			if (!db.tableExists(table)) {
				callback();
				return;
			}
			else
				tables[table] = 1;
		}

		var t = db.createStatement('SELECT * FROM ' + table + ' WHERE key=:key;');
		t.params.key = key;
		var value;
		t.executeAsync({
			handleResult: function (aResultSet) {
				var item = aResultSet.getNextRow().getResultByName("value");
				if (item) item = JSON.parse(item);
				//console.log('get ok');
				//console.log(key + ': ' + item);
				value = item;
				callback(item);
			},
			handleError: function (e) {
				console.error("Error: " + e.message);
				callback({ 'error': e.message });
			},
			handleCompletion: function (aReason) {
				if (aReason != PublicJS.Ci.mozIStorageStatementCallback.REASON_FINISHED)
					console.warn("Query canceled or aborted!");
				//console.log('get completed');
				if (!value)
					callback();
			}
		});
	}
	this.set = function (table, key, value, callback) {

		function update() {
			var t = db.createStatement('UPDATE ' + table + ' SET value=:value WHERE key=:key;');
			t.params.key = key;
			t.params.value = JSON.stringify(value);
			t.executeAsync({
				handleError: function (aError) {
					console.error("Error: " + aError.message);
				},
				handleCompletion: function (aReason) {
					if (aReason != PublicJS.Ci.mozIStorageStatementCallback.REASON_FINISHED)
						console.warn("Query canceled or aborted!");
					if (callback)
						callback();
				}
			});
		}

		function set() {
			var t = db.createStatement('INSERT INTO ' + table + ' values(:key,:value);');
			t.params.key = key;
			t.params.value = JSON.stringify(value);
			var updateNeeded = false;
			t.executeAsync({
				handleError: function (aError) {
					if (aError.result == aError.CONSTRAINT)
						updateNeeded = true;
					else {
						console.error("Error: " + aError.message);
						console.log(JSON.stringify(aError));
					}
				},
				handleCompletion: function (aReason) {
					if (aReason != PublicJS.Ci.mozIStorageStatementCallback.REASON_FINISHED) {
						if (updateNeeded) {
							update();
							return;
						}
						else {
							console.warn("Query canceled or aborted!");
						}
					}
					if (callback)
						callback();
				}
			});
		}

		if (!tables[table]) {
			var t = db.createStatement('CREATE TABLE IF NOT EXISTS ' + table + ' (key unique, value);');
			t.executeAsync({
				handleError: function (aError) {
					console.error("Error: " + aError.message);
					if (callback)
						callback();
				},
				handleCompletion: function (aReason) {
					if (aReason != PublicJS.Ci.mozIStorageStatementCallback.REASON_FINISHED)
						console.warn("Query canceled or aborted!");
					tables[table] = 1;
					set();
				}
			});
		}
		else {
			set();
		}
	}
	this.remove = function (table, key, callback) {
		var t = db.createStatement('DELETE FROM ' + table + ' WHERE key=:key;');
		t.params.key = key;
		t.executeAsync({
			handleError: function (aError) {
				console.error("Error: " + aError.message);
			},
			handleCompletion: function (aReason) {
				if (aReason != PublicJS.Ci.mozIStorageStatementCallback.REASON_FINISHED)
					console.warn("Query canceled or aborted!");
				if (callback)
					callback();
			}
		});
	}

	init();
}

//var MePersonalityDatabase=MePersonalityWebSQLDatabase;
//var MePersonalityDatabase=MePersonalityVirtualDatabase;
//var MePersonalityDatabase = MePersonalityLocalStorageDatabase;
