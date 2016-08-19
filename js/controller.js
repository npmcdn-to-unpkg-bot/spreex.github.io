controller = {
  ROOT: 'spreex.github.io',
  currentURL: '',

  getCurrentURL: function() {
    return window.location.href;
  },

  init: function(apiURL, websocketURL, clientId) {
    window.onpopstate = function(event) {
      controller.load(window.location.href, false);
    };
    // Mydataspace.registerFormatter('entities.get', new EntityUnsimplifier());
    // Mydataspace.registerFormatter('entities.get.res', new EntitySimplifier());
    Mydataspace.init({
      apiURL: apiURL,
      websocketURL: websocketURL,
      clientId: clientId,
      permission: 'spreex.github.io',
      connected: function() {
        Mydataspace.on('entities.get.res', controller.handle);
        Mydataspace.on('entities.create.res', controller.onCreated);
        Mydataspace.on('entities.delete.res', controller.onDeleted);
        Mydataspace.on('login', function() {
          document.getElementById('main_menu__signout_item').classList.remove('hidden');
          document.getElementById('main_menu__signin_item').classList.add('hidden');
          $('#signin_modal').modal('hide');
          controller.reload(true);
        });
        Mydataspace.on('logout', function() {
          document.getElementById('main_menu__signin_item').classList.remove('hidden');
          document.getElementById('main_menu__signout_item').classList.add('hidden');
          controller.reload();
        });
      }
    });
    Mydataspace.connect();
  },
  onDeleted: function(data) {
    var pathParts = UIHelper.parsePath(data.path);
    if (pathParts[0] !== 'extensions') {
      return;
    }
    switch (pathParts.length) {
      case 2: // new extension created
        break;
      case 4:
        switch (pathParts[2]) {
          case 'comments':
            $('#post__comments').find('.comment').each(function() {
              if ($(this).data('entity-path') === data.path) {
                $(this).remove();
                return false;
              }
            });
            var n = parseInt($('.post__n_comments').get(0).innerText);
            $('.post__n_comments').text(n - 1);
            break;
          case 'likes':
            var n = parseInt($('.post__n_likes').get(0).innerText);
            $('.post__n_likes').text(n - 1);
            if (data.path === $('.post__n_likes_wrap').data('entity-path')) {
              $('.post__n_likes_wrap').removeClass('post__n_likes_wrap--liked');
              $('.post__n_likes_wrap').data('entity-path', null);
            }
          default:
        }
        break;
      default:
    }
  },

  onCreated: function(data) {
    var pathParts = UIHelper.parsePath(data.path);
    if (pathParts[0] !== 'extensions') {
      return;
    }
    switch (pathParts.length) {
      case 2: // new extension created
        break;
      case 4:
        switch (pathParts[2]) {
          case 'comments':
            $('#post__comments').prepend(
              controller.getCommentHTML(data));
            var n = parseInt($('.post__n_comments').get(0).innerText);
            $('.post__n_comments').text(n + 1);
            break;
          case 'likes':
            var n = parseInt($('.post__n_likes').get(0).innerText);
            $('.post__n_likes').text(n + 1);
            if (data.mine) {
              $('.post__n_likes_wrap').addClass('post__n_likes_wrap--liked');
              $('.post__n_likes_wrap').data('entity-path', data.path);
            }
          default:
        }
        break;
      default:
    }
  },

  /**
   * Load data by URL of required page.
   * @param url URL of the required page.
   * @param options Parameters of loading. Now can contains field 'search' for
   *                filtering extensions.
   */
  load: function(url, pushState, options) {
    if (typeof options === 'undefined') {
      options = {};
    }
    var newPath = UIHelper.getPathByURL(url);
    var newPathParts = UIHelper.parsePath(newPath);
    var search =
      options.search ||
      common.getURLParamByName('search', url);

    switch (newPathParts[0]) {
      case '#':
        return;
      case 'extensions':
        switch (newPathParts.length) {
          case 1: // laod extension list
            document.getElementById('post').classList.add('hidden');
            document.getElementById('search').classList.remove('hidden');
            document.getElementById('post__content').classList.remove('post__content--extended');
            document.getElementById('post_search__input').value = search;
            Mydataspace.request('entities.get', {
              root: controller.ROOT,
              path: 'extensions',
              search: search,
              children: []
            }, function() {
            });
            break;
          case 2: // load concret extension content
            controller.resetPost(options.letAloneNewComment);
            Mydataspace.emit('entities.subscribe', {
              root: controller.ROOT,
              path: newPath + '/comments/*'
            });
            Mydataspace.emit('entities.subscribe', {
              root: controller.ROOT,
              path: newPath + '/likes/*'
            });
            Mydataspace.request('entities.getMyChildren', {
              root: controller.ROOT,
              path: newPath + '/likes'
            }, function(data) {
              if (data.children.length > 0) {
                var like = data.children[0];
                $('.post__n_likes_wrap').data('entity-path', like.path);
                $('.post__n_likes_wrap').addClass('post__n_likes_wrap--liked');
              }
            });
            Mydataspace.request('entities.get', {
              root: controller.ROOT,
              path: newPath,
              // search: search,
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
              if (common.isPresent(html)) {
                document.getElementById('post__content_346238_4_6283').innerHTML = html;
              }
            });
            break;
          default:
            throw new Error('Illegal URL: ' + url);
        }
        break;
      default:
        throw new Error('Illegal URL: ' + url);
    }

    if (pushState === true || pushState === 'pushState') {
      history.pushState({}, '', url);
    } else if (pushState === 'replaceState') {
      history.replaceState({}, '', url);
    }
  },

  /**
   * Handles data received from Mydataspace API.
   */
  handle: function(data) {
    var pathParts = UIHelper.parsePath(data.path);
    switch (pathParts[0]) {
      case 'extensions':
        switch (pathParts.length) {
          // List of posts
          case 1:
            if (controller.getCurrentPath() !== data.path) {
              throw new Error('Illegal path: ' + data.path + '. Expected: ' + controller.getCurrentPath());
            }
            controller.updatePostList(data.children);
            break;
          // Post details
          case 2:
            if (controller.getCurrentPath() !== data.path) {
              throw new Error('Illegal path: ' + data.path + '. Expected: ' + controller.getCurrentPath());
            }
            controller.fillPost(data, document.getElementById('post'));
            break;
          // Post child's details (for example: comments, rubygems, github)
          case 3:
            if (controller.getCurrentPath() + '/' + pathParts[2] !== data.path) {
              throw new Error('Illegal path: ' + data.path + '. Expected: ' + controller.getCurrentPath() + '/' + pathParts[2]);
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
                throw new Error('Illegal path: ' + data.path + '. Expected comments, rubygems or github.');
            }
            break;
          default:
            throw new Error('Illegal path: ' + data.path + '. Path contains more then 3 names');
        }
        break;
      default:
        throw new Error('Illegal path: ' + data.path + '. Path must starts with `extensions`');
    }
  },

  getCurrentPath: function() {
    return UIHelper.getPathByURL(controller.getCurrentURL());
  },

  resetPost: function(letAloneNewComment) {
    if (letAloneNewComment !== true) {
      $('#post__new_comment .new_comment__textarea').val('');
      $('#post__new_comment .new_comment__textarea').removeClass('new_comment__textarea--extended');
      $('#post__new_comment .new_comment__button').hide();
    }
    $('.summery_block .post__n_likes_wrap').removeClass('post__n_likes_wrap--liked');
    $('.summery_block .post__n_likes_wrap').data('entity-path', null);
  },

  reload: function(letAloneNewComment) {
    controller.load(controller.getCurrentURL(), false, { letAloneNewComment: letAloneNewComment });
  },

  fillPost: function(data, parentElement) {
    if (typeof parentElement === 'undefined') {
      parentElement = document;
    }
    for (var field of data.fields) {
      var elems = parentElement.getElementsByClassName('post__' + field.name);
      if (/URL$/.test(field.name) || field.name === 'url') {
        if (field.name === 'readmeURL') {
          $.ajax({
            url: field.value,
            dataType: 'text'
          }).done(function(data) {
            var html = md.render(data);
            document.getElementById('post__content_346238_4_6283').innerHTML = html;
          });
        } else {
          UIHelper.setElemementsURL(elems, field.value);
        }
      } else {
        UIHelper.setElemementsText(elems, field.value);
      }
    }
    if (typeof data.children !== 'undefined') {
      for (var child of data.children) {
        controller.fillPostChild(child);
        switch (common.getChildName(child.path)) {
          case 'comments':
            $('#post__comments').empty();
            if (child.numberOfChildren > 0) {
              document.getElementById('post__loading_comments').style.display = 'block';
              Mydataspace.request('entities.get', {
                root: data.root,
                path: common.getChildPath(data.path, 'comments'),
                children: []
              }, function() {
                document.getElementById('post__loading_comments').style.display = 'none';
              }, function() {
                document.getElementById('post__loading_comments').style.display = 'none';
              });
            } else {
              document.getElementById('post__loading_comments').style.display = 'none';
            }
            break;
          default:
            break;
        }
      }
    }
  },

  fillPostChild: function(childData, parentElement) {
    if (typeof parentElement === 'undefined') {
      parentElement = document;
    }
    var childPrefix = 'post__' + common.getChildName(childData.path) + '_';
    for (var childField of childData.fields) {
      if (common.isBlank(childField.value)) {
        continue;
      }
      var elems = parentElement.getElementsByClassName(childPrefix + childField.name);
      if (/URL$/.test(childField.name) || childField.name === 'url') {
        UIHelper.setElemementsURL(elems, childField.value);
      } else if (/Date$/.test(childField.name) || childField.name === 'date') {
        UIHelper.setElemementsText(elems, new Date(childField.value).toLocaleString());
      } else if (/IMG$/.test(childField.name) || childField.name === 'img') {
        UIHelper.setElemementsSRC(elems, childField.value);
      } else {
        UIHelper.setElemementsText(elems, childField.value);
      }
    }
    var nElems =
      document.getElementsByClassName('post__n_' + common.getChildName(childData.path));
    UIHelper.setElemementsText(nElems, childData.numberOfChildren);
  },

  updatePostList: function(rowsData) {
    var postList = document.getElementById('post_list');
    if (postList == null) {
      throw new Error('Illegal data');
    }
    if (common.isBlank(rowsData.children)) {
      postList.innerHTML = '';
    }
    var currentRow = postList.firstChild;
    for (var postData of rowsData) {
      var postName = common.getChildName(postData.path);
      if (currentRow == null) {
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
          if (currentRow == null) {
            postList.appendChild(controller.createPostRow(postData));
            break;
          }
          postList.removeChild(rowToRemove);
        } while (Date.parse(postData.createdAt) > Date.parse(currentRow.getAttribute('data-createdAt')));
        postList.insertBefore(controller.createPostRow(postData), currentRow);
      }
    }
    while (currentRow != null) {
      var rowToRemove = currentRow;
      currentRow = currentRow.nextElementSibling;
      postList.removeChild(rowToRemove);
    }
  },

  createPostRow: function(postData) {
    var postName = common.getChildName(postData.path);
    var row = document.createElement('div');
    row.setAttribute('class', 'post post--row');
    row.setAttribute('data-postName', postName);
    row.setAttribute('data-createdAt', postData.createdAt);
    var html =
      '<a class="clearfix relative" href="/' + postData.path + '" onclick="event.preventDefault(); return controller.load(this.href, true);">\n' +
      '  <div>\n' +
      '    <div class="post__title--row">\n' +
      '      ' + common.findByName(postData.fields, 'title').value + '\n' +
      '    </div>\n' +
      '    <div class="post__description--row post__description">\n' +
      '      ' + common.findByName(postData.fields, 'description').value + '\n' +
      '    </div>\n' +
      '  </div>\n' +
      '  <div class="post__github_short_info">\n' +
      '    <div class="summery_block__item">\n' +
      '      <i class="fa fa-code-fork" aria-hidden="true"></i><span class="summery_block__item_value">' + common.findByName(postData.fields, 'githubForks').value + '</span>\n' +
      '    </div>\n' +
      '    <div class="summery_block__item">\n' +
      '      <i class="fa fa-star" aria-hidden="true"></i><span class="summery_block__item_value">' + common.findByName(postData.fields, 'githubStars').value + '</span>\n' +
      '    </div>\n' +
      // '    <div class="summery_block__item">\n' +
      // '      <i class="fa fa-eye" aria-hidden="true"></i><span class="summery_block__item_value post__github_watchers">' + common.findByName(postData.fields, 'githubWatchers').value + '</span>\n' +
      // '    </div>\n' +
      '  </div>\n' +
      '</a>';
    row.innerHTML = html;
    return row;
  },

  getCommentHTML: function(comment) {
    var additionalClasses = '';
    if (comment.mine) {
      additionalClasses = 'comment--mine';
    }
    return '<div data-entity-path="' + comment.path + '" class="comment info_block ' + additionalClasses + '">' +
    '<div class="comment__header">' + comment.createdAt + '</div>' +
    '<div onclick="controller.deleteComment($(this).parent().data(\'entity-path\'))" ' +
         'class="comment__delete"><i class="fa fa-2x fa-times" aria-hidden="true"></i></div>' +
    '<div class="comment__content">' + common.findByName(comment.fields, 'text').value + '</div>' +
    '</div>';
  },

  fillComments: function(comments) {
    if (comments.length == 0) {
      $('#post__no_comments').show();
    } else {
      $('#post__no_comments').hide();
      $.each(comments, function(i, comment) {
        $('#post__comments').append(controller.getCommentHTML(comment));
      });
    }
  },

  guid: function() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  },

  postComment: function($textarea) {
    Mydataspace.request('entities.create', {
      root: controller.ROOT,
      path: common.getChildPath(controller.getCurrentPath(), 'comments/' + controller.guid()),
      fields: [
        {
          name: 'text',
          value: $textarea.val()
        }
      ]
    }, function() {
      $textarea.val('');
    }, function() {

    });
  },

  deleteComment: function(path) {
    Mydataspace.emit('entities.delete', {
      root: controller.ROOT,
      path: path
    });
  },

  swithLike: function() {
    var $elem = $('.summery_block .post__n_likes_wrap');
    if ($elem.data('entity-path') == null) {
      Mydataspace.emit('entities.create', {
        root: controller.ROOT,
        path: common.getChildPath(controller.getCurrentPath(), 'likes/' + controller.guid())
      });
    } else {
      Mydataspace.emit('entities.delete', {
        root: controller.ROOT,
        path: $elem.data('entity-path')
      });
    }
  }
}
