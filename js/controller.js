controller = {

  init: function() {
    Mydataspace.init({
      connected: function() {
        Mydataspace.on('entities.getChildren.res', controller.handle);
      }
    });
    Mydataspace.connect();
  },

  handle: function(data) {
    var pathParts = data.path.split('/');
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
            controller.fillPost(data.children);
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

  load: funciton(url) {
    if (controller.getCurrentURL() === url) {
      return;
    }
  },

  getCurrentURL: function() {
    return window.location.href;
  },

  getCurrentPath: function() {
    return controller.getPathByURL(controller.getCurrentURL());
  }

  fillPost: function(postName, data, parentElement) {
    if (typeof parentElement === 'undefined') {
      parentElement = document;
    }
    var postPrefix = 'post_' + postName + '__';
    for (var field of data.fields) {
      var elems = parentElement.getElementsByClassName(postPrefix + field.name);
      controller.setElemementsText(elems, field.value);
    }
    for (var child of data.children) {
      controller.fillPostChild(postName, data);
    }
  },

  fillPostChild: function(postName, childData, parentElement) {
    if (typeof parentElement === 'undefined') {
      parentElement = document;
    }
    var childPrefix = 'post_' + postName + '__' + postPrefix + common.getChildName(childData.path) + '_';
    for (var childField of childData.fields) {
      var elems = parentElement.getElementsByClassName(childPrefix + childField.name);
      controller.setElemementsText(elems, field.value);
    }
  }

  updatePostList: function(data) {
    var postList = document.getElementById('post_list');
    if (common.isNull(postList)) {
      throw new Error('Illegal data');
    }
    var currentRow = postList.firstChild;
    for (var postData of data.children) {
      var postName = common.getChildName(postData);
      if (common.isNull(currentRow)) {
        postList.appendChild(controller.createPostRow(postData));
        continue;
      }
      if (postData.cratedAt < currentRow.getAttribute('data-createdAt')) {
        postList.insertBefore(controller.createPostRow(postData), currentRow);
      } else if (postData.cratedAt === currentRow.getAttribute('data-createdAt')) {
        if (!currentRow.classList.countains('post_' + postName)) {
          postList.insertBefore(controller.createPostRow(postData), currentRow);
        } else {
          controller.fillPost(postName, postData, currentRow);
          currentRow = currentRow.nextNode;
        }
      } else {
        do {
          var rowToRemove = currentRow;
          currentRow = currentRow.nextNode;
          if (common.isNull(currentRow)) {
            postList.appendChild(controller.createPostRow(postData));
            break;
          }
          postList.removeChild(rowToRemove);
        } while (postData.cratedAt > currentRow.getAttribute('data-createdAt'));
        postList.insertBefore(controller.createPostRow(postData), currentRow);
      }
    }
  },

  createPostRow: function(postData) {
    var postName = common.getChildName(data);
    var row = document.createElement('div');
    row.setAttribute('class', 'post_row clearfix post_' postName);
    row.setAttribute('data-createdAt', data.createdAt);
    row.innerHTML =
      '<a href="' + postData.path + '" onclick="return controller.load(this.href)">'
      '  <div class="pull-left">' +
      '    <div class="post_row__title post_' + postName + '__title">' +
      '      ' + common.findByName(postData.fields, 'title') +
      '    </div>' +
      '    <div class="post_row__description post_' + postName + '__description">' +
      '      ' + common.findByName(postData.fields, 'description') +
      '    </div>' +
      '  </div>' +
      '</a>';
    return row;
  }

  fillComments: function(data) {
    ;
  },

  getPathByURL: function(url) {
    return url;
  },

  setElemementsText: function(elems, text) {
    for (var el of elems) {
      el.innerText = text;
    }
  }

}
