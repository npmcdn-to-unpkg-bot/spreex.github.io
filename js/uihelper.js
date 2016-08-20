UIHelper = {
  isEmptyFields: function(fields) {
    for (var i in fields) {
      var field = fields[i];
      if (common.isPresent(field.value) && field.value !== '0' && field.value !== 0) {
        return false;
      }
    }
    return true;
  },

  addOrReplaceURLParam: function(url, paramName, paramValue) {
    var urlParts = url.split('?');
    var query = urlParts[1] || '';
    var queryParts;
    if (query === '') {
      queryParts = [];
    } else {
      queryParts = query.split('&');
    }

    var found = false;
    for (var i in queryParts) {
      var part = queryParts[i];
      if (part.startsWith(paramName + '=')) {
        if (common.isPresent(paramValue)) {
          queryParts[i] = paramName + '=' + paramValue;
        } else {
          queryParts.splice(i, 1);
        }
        found = true;
        break;
      }
    }

    if (!found && common.isPresent(paramValue)) {
      queryParts.push(paramName + '=' + paramValue);
    }

    if (queryParts.length === 0) {
      return urlParts[0];
    }

    var resultQuery = queryParts.join('&');
    return urlParts[0] + '?' + resultQuery;
  },

  setElemementsText: function(elems, text) {
    for (var i = 0; i < elems.length; i++) {
      elems[i].innerText = text;
    }
  },

  setElemementsSRC: function(elems, url) {
    for (var i = 0; i < elems.length; i++) {
      if (common.isBlank(url)) {
        elems[i].href = 'img/no-image.png';
      } else {
        elems[i].src = url;
      }
    }
  },

  setElemementsTitle: function(elems, str) {
    for (var i = 0; i < elems.length; i++) {
      elems[i].setAttribute('title', str);
    }
  },

  setElemementsURL: function(elems, url) {
    for (var i = 0; i < elems.length; i++) {
      var el = elems[i];
      if (common.isBlank(url)) {
        el.classList.add('disabled');
        el.href = 'javascript:void(0)';
      } else {
        el.classList.remove('disabled');
        var suffix = el.getAttribute('data-url-suffix');
        el.href = url + (suffix || '');
      }
    }
  },

  getPathByURL: function(url) {
    var parts = url.split('?');
    var m = parts[0].match(/^[^:]*:\/\/[^\?\/]*(\/[^\?]+)?/);
    if (m == null) {
      throw new Error('Illegal URL format:' + url);
    }
    return typeof m[1] === 'undefined' ? 'extensions' : UIHelper.parsePath(m[1]).join('/');
  },

  parsePath(path) {
    return path.split('/').filter(part => common.isPresent(part));
  }
}
