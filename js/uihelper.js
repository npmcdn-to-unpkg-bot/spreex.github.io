UIHelper = {
  setElemementsText: function(elems, text) {
    for (var el of elems) {
      el.innerText = text;
    }
  },

  setElemementsURL: function(elems, url) {
    for (var el of elems) {
      if (common.isBlank(url)) {
        el.classList.add('disabled');
        el.href = 'javascript:void(0)';
      } else {
        el.classList.remove('disabled');
        el.href = url;
      }
    }
  },

  getPathByURL: function(url) {
    var m = url.match(/^[^:]*:\/\/[^\?\/]*(\/[^\?]+)?/);
    if (common.isNull(m)) {
      throw new Error('Illegal URL format:' + url);
    }
    return UIHelper.parsePath(m[1]).join('/') || '';
  },

  parsePath(path) {
    return path.split('/').filter(part => common.isPresent(part));
  }
}
