common = {
  isNumber: function(n) {
      return Number(n) === n;
  },

  isInt: function(n) {
      return common.isNumber(n) && n % 1 === 0;
  },

  isNull: function(value) {
    return typeof value === 'undefined' || value === null;
  },

  isBlank: function(value) {
    return common.isNull(value) || value === '';
  },

  isPresent: function(value) {
    return !common.isBlank(value);
  },

  extend: function(dest, source) {
    var ret = common.copy(dest);
    common.extendOf(ret, source);
    return ret;
  },

  extendOf: function(dest, source) {
    if (common.isBlank(source)) {
      return dest;
    }
    if (common.isPrimative(dest) || common.isPrimative(source)) {
      throw new Error('Cant extend primative type');
    }
    var ret = Array.isArray(dest) ? [] : {};
    for (var i in dest) {
      if (typeof source[i] === 'undefined') {
        continue;
      }
      if (common.isPrimative(dest[i]) || common.isPrimative(source[i])) {
        dest[i] = common.copy(source[i]);
      } else { // mergin
        common.extendOf(dest[i], source[i]);
      }
    }
    for (var i in source) {
      if (typeof dest[i] === 'undefined') {
        dest[i] = common.copy(source[i]);
      }
    }
    return ret;
  },

  copy: function(data) {
    if (common.isPrimative(data)) {
      return data;
    }
    var ret = Array.isArray(data) ? [] : {};
    for (var i in data) {
      ret[i] = common.copy(data[i]);
    }
    return ret;
  },

  primativeTypes: [
    'number',
    'string',
    'boolean',
    'undefined'
  ],

  isPrimative: function(value) {
    return value === null || common.primativeTypes.indexOf(typeof value) > -1;
  },

  convertNameValueArrayToMap: function(arr) {
    var ret = {};
    for (var  i in arr) {
      ret[arr[i].name] = arr[i].value;
    }
    return ret;
  }

  convertMapToNameValue: function(obj) {
    var ret = [];
    for (var  i in obj) {
      ret.push({
        name: i,
        value: obj[i]
      });
    }
    return ret;
  }

  findByName: function(arr, name) {
    if (!Array.isArray(arr)) {
      throw new Error('Argument arr isnt array');
    }
    if (typeof name === 'undefined') {
      throw new Error('Name is undefined');
    }
    for (var  i in arr) {
      if (arr[i].name === name) {
        return arr[i];
      }
    }
  }
  function getChildName(path) {
    var i = path.lastIndexOf('/');
    if (i === -1) {
      throw new Error('Path has no child');
    }
    return path.substr(i + 1);
  }

}
