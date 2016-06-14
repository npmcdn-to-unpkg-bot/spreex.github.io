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

  mapToArray: function(map) {
    var ret = [];
    for (var key in map) {
      ret.push(map[key]);
      ret[ret.length - 1].name = key;
    }
    return ret;
  },

  convertNameValueArrayToMap: function(arr) {
    var ret = {};
    for (var  i in arr) {
      ret[arr[i].name] = arr[i].value;
    }
    return ret;
  },

  convertMapToNameValue: function(obj) {
    var ret = [];
    for (var  i in obj) {
      ret.push({
        name: i,
        value: obj[i]
      });
    }
    return ret;
  },

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
  },

  getChildName: function(path) {
    var i = path.lastIndexOf('/');
    if (i === -1) {
      throw new Error('Path has no child');
    }
    return path.substr(i + 1);
  },

  getURLParamByName: function(name, url) {
      if (!url) url = window.location.href;
      name = name.replace(/[\[\]]/g, "\\$&");
      var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
          results = regex.exec(url);
      if (!results) return null;
      if (!results[2]) return '';
      return decodeURIComponent(results[2].replace(/\+/g, " "));
  },


  permit: function(data, keys) {
    if (typeof data === 'undefined') {
      return [];
    }
    if (arguments.length > 2) {
      keys = [];
      for (var i = 1; i < arguments.length; i++) {
        keys.push(arguments[i]);
      }
    }
    if (Array.isArray(data)) {
      return common.permitArray(data, keys);
    } else {
      var ret = {};
      if (Array.isArray(keys)) {
        for (var i in keys) {
          var k = keys[i];
          var val = data[k];
          if (typeof val !== 'undefined') {
            ret[k] = val;
          }
        }
      } else {
        for (var k in keys) {
          var type = keys[k];
          var val = data[k];
          if (typeof val !== 'undefined') {
            var ok = false;
            if (common.isPrimitive(type)) {
              ok = common.isValidPrimitiveType(val, type);
            } else {
              ret[k] = common.permit(val, type);
            }
            if (ok) {
              ret[k] = val;
            }
          }
        }
      }
      return ret;
    }
  },

  permitArray: function(arr, keys) {
    var ret = [];
    for (var i in arr) {
      var data = arr[i];
      ret[i] = common.permit(data, keys);
    }
    return ret;
  },

  isValidPrimitiveType: function(val, type) {
    var ok = false;
    switch (type) {
      case 's': // string
      case 'j': // javascript
      case 'u': // javascript source
        if (Array.isArray(val)) {
          ok = val.reduce(function(prev, curr) {
            return prev && common.isPrimitive(curr);
          });
        } else {
          ok = common.isPrimitive(val);
        }
        break;
      case 'i':
        ok = common.isInt(val);
        break;
      case 'r':
        ok = common.isReal(val);
        break;
      case 'o':
        ok = common.isObject(val);
        break;
      case 'a':
        ok = true;
        break;
    }
    return ok;
  },

  isReal: function(value) {
    return !isNaN(parseFloat(value));
  },

  isInt: function(value) {
    return !isNaN(parseInt(value));
  },

  isComplex: function(value) {
    return isObject(value) || Array.isArray(value);
  },

  isPrimitive: function(value) {
    return !isComplex(value);
  },

  isObject: function(value) {
    return typeof value === 'object';
  },

}
