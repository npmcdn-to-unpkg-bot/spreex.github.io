controller = {
  ROOT: 'spreex.github.io',
  currentURL: '',

  getCurrentURL: function() {
    return window.location.href;
  },

  init: function() {
    window.onpopstate = function(event) {
      controller.load(window.location.href);
    };
    Mydataspace.init({
      connected: function() {
        Mydataspace.on('entities.get.res', controller.handle);
      }
    });
    Mydataspace.connect();
  },

  load: function(url, options) {
    if (typeof options === 'undefined') {
      options = {};
    }
    var newPath = UIHelper.getPathByURL(url);
    var newPathParts = UIHelper.parsePath(newPath);
    var search = typeof options.search !== 'undefined' ? options.search : common.getURLParamByName(url);
    switch (newPathParts[0]) {
      case 'extensions':
        switch (newPathParts.length) {
          case 1:
            Mydataspace.request('entities.get', {
              root: controller.ROOT,
              path: 'extensions',
              search: search,
              children: []
            }, function() {
              document.getElementById('post').classList.add('hidden');
              document.getElementById('search').classList.remove('hidden');
            });
            break;
          case 2:
            Mydataspace.request('entities.get', {
              root: controller.ROOT,
              path: newPath,
              search: search,
              children: []
            }, function() {
              document.getElementById('search').classList.add('hidden');
              document.getElementById('post').classList.remove('hidden');
            });
            $.ajax({
              url: url,
              dataType: 'text'
            }).done(function(data) {
              var startMarket = '<div id="post__content_346238_4_6283">';
              var startIndex = data.indexOf(startMarket) + startMarket.length;
              var endIndex = data.indexOf('</div><!-- post__content_346238_4_6283 -->');
              if (startIndex === -1 || endIndex === -1) {
                throw new Error('Illegal data');
              }
              var html = data.substring(startIndex, endIndex);
              document.getElementById('post__content_346238_4_6283').innerHTML = html;
              data.substr(startIndex, endIndex);
            });
            break;
          default:
            throw new Error('Illegal URL: ' + url);
        }
        break;
      default:
        throw new Error('Illegal URL: ' + url);
    }
    var stateObj = {};
    history.pushState(stateObj, '', url);
  },

  handle: function(data) {
    var pathParts = UIHelper.parsePath(data.path);
    switch (pathParts[0]) {
      case 'extensions':
        switch (pathParts.length) {
          case 1:
            if (controller.getCurrentPath() !== data.path) {
              throw new Error('Illegal path');
            }
            controller.updatePostList(data.children);
            break;
          case 2:
            if (controller.getCurrentPath() !== data.path) {
              throw new Error('Illegal path');
            }
            controller.fillPost(data, document.getElementById('post'));
            break;
          case 3:
            if (controller.getCurrentPath() + '/' + pathParts[2] !== data.path) {
              throw new Error('Illegal path');
            }
            switch (pathParts[2]) {
              case 'comments':
                controller.fillComments(data.children);
                break;
              case 'rubygems':
              case 'github':
                controller.fillChildPost(pathParts[2], data.fields);
                break;
              default:
                throw new Error('Illegal path');
            }
            break;
          default:
            throw new Error('Illegal path');
        }
        break;
      default:
        throw new Error('Illegal path');
    }
  },

  getCurrentPath: function() {
    return UIHelper.getPathByURL(controller.getCurrentURL());
  },

  fillPost: function(data, parentElement) {
    if (typeof parentElement === 'undefined') {
      parentElement = document;
    }
    for (var field of data.fields) {
      var elems = parentElement.getElementsByClassName('post__' + field.name);
      if (/URL$/.test(field.name)) {
        UIHelper.setElemementsURL(elems, field.value);
      } else {
        UIHelper.setElemementsText(elems, field.value);
      }
    }
    if (typeof data.children !== 'undefined') {
      for (var child of data.children) {
        controller.fillPostChild(child);
      }
    }
  },

  fillPostChild: function(childData, parentElement) {
    if (typeof parentElement === 'undefined') {
      parentElement = document;
    }
    var childPrefix = 'post__' + common.getChildName(childData.path) + '_';
    for (var childField of childData.fields) {
      var elems = parentElement.getElementsByClassName(childPrefix + childField.name);
      UIHelper.setElemementsText(elems, childField.value);
    }
    var nElems =
      document.getElementsByClassName('post__n_' + common.getChildName(childData.path));
    UIHelper.setElemementsText(nElems, childData.numberOfChildren);
  },

  updatePostList: function(rowsData) {
    var postList = document.getElementById('post_list');
    if (common.isNull(postList)) {
      throw new Error('Illegal data');
    }
    if (common.isBlank(rowsData.children)) {
      postList.innerHTML = '';
    }
    var currentRow = postList.firstChild;
    for (var postData of rowsData) {
      var postName = common.getChildName(postData.path);
      if (common.isNull(currentRow)) {
        postList.appendChild(controller.createPostRow(postData));
        continue;
      }
      if (Date.parse(postData.createdAt) < Date.parse(currentRow.getAttribute('data-createdAt'))) {
        postList.insertBefore(controller.createPostRow(postData), currentRow);
      } else if (Date.parse(postData.createdAt) === Date.parse(currentRow.getAttribute('data-createdAt'))) {
        if (currentRow.getAttribute('data-postName') !== postName) {
          postList.insertBefore(controller.createPostRow(postData), currentRow);
        } else {
          controller.fillPost(postData, currentRow);
          currentRow = currentRow.nextElementSibling;
        }
      } else {
        do {
          var rowToRemove = currentRow;
          currentRow = currentRow.nextElementSibling;
          if (common.isNull(currentRow)) {
            postList.appendChild(controller.createPostRow(postData));
            break;
          }
          postList.removeChild(rowToRemove);
        } while (Date.parse(postData.createdAt) > Date.parse(currentRow.getAttribute('data-createdAt')));
        postList.insertBefore(controller.createPostRow(postData), currentRow);
      }
    }
    while (!common.isNull(currentRow)) {
      var rowToRemove = currentRow;
      currentRow = currentRow.nextElementSibling;
      postList.removeChild(rowToRemove);
    }
  },

  createPostRow: function(postData) {
    var postName = common.getChildName(postData.path);
    var row = document.createElement('div');
    row.setAttribute('class', 'post--row');
    row.setAttribute('data-postName', postName);
    row.setAttribute('data-createdAt', postData.createdAt);
    var html =
      '<a class="clearfix" href="/' + postData.path + '" onclick="event.preventDefault(); return controller.load(this.href);">\n' +
      '  <div class="pull-left">\n' +
      '    <div class="post__title--row">\n' +
      '      ' + common.findByName(postData.fields, 'title').value + '\n' +
      '    </div>\n' +
      '    <div class="post__description--row post__description">\n' +
      '      ' + common.findByName(postData.fields, 'description').value + '\n' +
      '    </div>\n' +
      '  </div>\n' +
      '</a>';
    row.innerHTML = html;
    return row;
  },

  fillComments: function(data) {
    ;
  },
}
