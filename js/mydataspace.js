Mydataspace = {
  initialized: false,
  connected: false,
  loggedIn: false,
  requests: {},
  subscriptions: [],
  lastRequestId: 10000,
  listeners: {
    login: [],
    logout: [],
    connected: []
  },

  authProviders: {
    facebook: {
      title: 'Connect to Facebook',
      icon: 'facebook',
      url: 'https://www.facebook.com/dialog/oauth?client_id=827438877364954&scope=email&redirect_uri={{api_url}}/auth?authProvider=facebook&display=popup',
      loginWindow: {
        height: 400
      }
    },
    google: {
      title: 'Connect to Google',
      icon: 'google-plus',
      url: 'https://accounts.google.com/o/oauth2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fplus.me%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fplus.profile.emails.read&response_type=code&client_id=821397494321-s85oh989s0ip2msnock29bq1gpprk07f.apps.googleusercontent.com&redirect_uri={{api_url}}%2Fauth%3FauthProvider%3Dgoogle',
      loginWindow: {
        height: 800
      }
    },
  },

  getAuthProviders: function() {
    var ret = common.copy(Mydataspace.authProviders);
    for (let provider of ret) {
      ret.url = ret.url.replace('{{api_url}}', encodeURIComponent(Mydataspace.options.apiURL));
    }
    return ret;
  },

  getAuthProvider: function(providerName) {
    var prov = Mydataspace.authProviders[providerName];
    if (typeof prov === 'undefined') {
      return null;
    }
    var ret = common.copy(prov);
    ret.url = ret.url.replace('{{api_url}}', encodeURIComponent(Mydataspace.options.apiURL));
    return ret;
  },

  init: function(options) {
    if (Mydataspace.initialized) {
      console.warn('An attempt to re-initialize the Mydataspace');
      return;
    }
    Mydataspace.options = common.extend({
      connected: function() {
        console.log('Maybe you forgot to specify connected-event handler');
      }
    }, options);
    Mydataspace.on('connected', options.connected);
    window.addEventListener('message', function(e) {
      if (e.data.message === 'authResult') {
        localStorage.setItem('authToken', e.data.result);
        Mydataspace.emit('authenticate', { token: e.data.result });
        e.source.close();
      }
    });
    Mydataspace.initialized = true;
  },

  connect: function(done) {
    Mydataspace.socket = io(Mydataspace.options.websocketURL, {
      // secure: true,
      'force new connection' : true,
      'reconnectionAttempts': 'Infinity', //avoid having user reconnect manually in order to prevent dead clients after a server restart
      'timeout' : 10000, //before connect_error and connect_timeout are emitted.
      'transports' : ['websocket']
    });

    Mydataspace.on('connect', function () {
      Mydataspace.connected = true;
      if (common.isPresent(localStorage.getItem('authToken'))) {
        Mydataspace.emit('authenticate', { token: localStorage.getItem('authToken') });
      }
      Mydataspace.callListeners('connected');
    });

    Mydataspace.on('authenticated', function() {
      Mydataspace.loggedIn = true;
      Mydataspace.callListeners('login');
    });

    Mydataspace.on('disconnect', function() {
      Mydataspace.connected = false;
      Mydataspace.loggedIn = false;
      Mydataspace.subscriptions = [];
      Mydataspace.lastRequestId = 10000;
      Mydataspace.requests = {};
    });

    Mydataspace.on('entities.err', function(data) {
      Mydataspace.handleResponse(data, 'fail');
    });
  },

  callListeners: function(eventName, args) {
    var listeners = Mydataspace.listeners[eventName];
    if (typeof listeners === 'undefined') {
      throw new Error('Listener not exists');
    }
    for (var i in listeners) {
      listeners[i](args);
    }
  },

  /**
   * Close the websocket.
   * You need re-initialize listeners after that!
   */
  disconnect: function() {
    Mydataspace.socket.disconnect();
    Mydataspace.socket = null;
  },

  login: function(providerName) {
    var authProvider = Mydataspace.getAuthProvider(providerName);
    var authWindow = window.open(authProvider.url, '', 'width=640, height=' + authProvider.loginWindow.height);
    authWindow.focus();
    var authCheckInterval = setInterval(function() {
      authWindow.postMessage({ message: 'requestAuthResult' }, '*');
    }, 1000);
  },

  logout: function() {
    localStorage.removeItem('authToken');
    Mydataspace.disconnect();
    Mydataspace.connect();
    Mydataspace.callListeners('logout');
  },

  isLoggedIn: function() {
    return Mydataspace.loggedIn;
  },

  isConnected: function() {
    return Mydataspace.connected;
  },

  emit: function(eventName, data) {
    if (typeof Mydataspace.socket === 'undefined') {
      throw new Error('You must connect to server before emit data');
    }
    Mydataspace.socket.emit(eventName, data);
  },

  on: function(eventName, callback) {
    if (typeof Mydataspace.listeners[eventName] !== 'undefined') {
      Mydataspace.listeners[eventName].push(callback);
      return;
    }
    if (typeof Mydataspace.socket === 'undefined') {
      throw new Error('You must connect to server before subscribe to events');
    }
    Mydataspace.socket.on(eventName, callback);
  },

  request: function(eventName, data, successCallback, failCallback) {
    var options = {
      success: successCallback || function() {},
      fail: failCallback || function() {}
    };
    // Store request information to array
    Mydataspace.lastRequestId++;
    data.requestId = Mydataspace.lastRequestId;
    Mydataspace.requests[data.requestId] = {
      options: options
    }

    // Init response handler
    var responseEventName = eventName + '.res';
    if (Mydataspace.subscriptions.indexOf(responseEventName) === -1) {
      Mydataspace.subscriptions.push(responseEventName);
      Mydataspace.on(responseEventName, function(data) {
        Mydataspace.handleResponse(data, 'success');
      });
    }

    // Send request
    Mydataspace.emit(eventName, data);
  },

  handleResponse: function(data, callbackName) {
    if (typeof data.requestId === 'undefined') {
      return;
    }
    var req = Mydataspace.requests[data.requestId];
    if (typeof req === 'undefined') {
      return;
    }
    delete Mydataspace.requests[data.requestId];
    if (typeof req.options !== 'undefined' && callbackName in req.options) {
      var callback = req.options[callbackName];
      callback(data);
    }
  }

};
