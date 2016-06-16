Sync = {
  URL: 'http://spreex.github.io',
  ROOT: 'spreex.github.io',
  FIELDS: [
    'title',
    'description',
    'websiteURL',
    'demoURL',
    'sourceCodeURL',
    'githubRepoName',
    'rubygemsGemName',
    'readmeURL',
    'tags'
  ],
  GITHUB_FIELDS: {
    forks: 'forks',
    subscribers_count: 'watchers',
    open_issues: 'issues',
    watchers: 'stars',
    description: 'description'
  },
  /**
   * Connect & login to MyDataSpace.
   */
  connectToStorage: function(done) {
    if (Mydataspace.isLoggedIn()) {
      done();
      return;
    }
    Mydataspace.init({
      apiURL: 'http://api-mydatasp.rhcloud.com',
      websocketURL: 'http://api-mydatasp.rhcloud.com:8000',
      connected: function() {
        Mydataspace.on('login', function() {
          done();
        });
      }
    });
    Mydataspace.connect();
  },

  getDataFromStorage: function(done) {
    Mydataspace.request('entities.get', { root: Sync.ROOT, path: 'extensions', children: [] }, function(data) {
      done(data.children);
    });
  },

  getDataFromSite: function(done) {
    var oReq = new XMLHttpRequest();
    oReq.addEventListener('load', function() {
      done(eval('(' + this.responseText + ')'));
    });
    oReq.open('GET', Sync.URL + '/posts.json');
    oReq.send();
  },

  getGithubRepo: function(postOnSite) {
    const gh = new GitHub();
    const parts = postOnSite.githubRepoName.split('/');
    return gh.getRepo(parts[0], parts[1]).getDetails().then(function(details) {
      const fields = [];
      const data = details.data;
      for (let field in Sync.GITHUB_FIELDS) {
        fields.push({
          name: Sync.GITHUB_FIELDS[field],
          value: data[field]
        });
      }
      var ret = {
        root: Sync.ROOT,
        path: 'extensions/' + postOnSite.name + '/github',
        fields: fields
      };
      return ret;
    });
  },

  getPostsToRemove: function(postsOnSite, postsInStorage) {
    return common.permit(postsInStorage.filter(post => typeof common.findByName(postsOnSite, common.getChildName(post.path)) === 'undefined'), ['root', 'path']);
  },

  isPostExistsInStorage: function(postInStorage, name) {
    return !common.isNull(Sync.findPostInStorage(postInStorage, name));
  },

  findPostInStorage: function(postsInStorage, name) {
    var ret = postsInStorage.filter(postInStorage => postInStorage.root === Sync.ROOT && postInStorage.path === 'extensions/' + name);
    if (ret.length > 0) {
      return ret[0];
    }
    return null;
  },

  getPostsToCreate: function(postsOnSite, postsInStorage) {
    var ret =
      postsOnSite
        .filter(postOnSite => !Sync.isPostExistsInStorage(postsInStorage, postOnSite.name))
        .map(function(postOnSite) {
          var res = { root: Sync.ROOT, path: 'extensions/' + postOnSite.name, fields: [] };
          for (let field of Sync.FIELDS) {
            res.fields.push({
              name: field,
              value: postOnSite[field]
            });
          }
          return res;
        });
    return ret;
  },

  getPostsToChange: function(postsOnSite, postsInStorage) {
    var ret =
      postsOnSite
        .map(function(postOnSite) {
          var postInStorage = Sync.findPostInStorage(postsInStorage, postOnSite.name);
          if (common.isNull(postInStorage)) {
            return null;
          }
          var res = { root: Sync.ROOT, path: 'extensions/' + postOnSite.name, fields: [] };
          for (let field of Sync.FIELDS) {
            var fieldInStorage = common.findByName(postInStorage.fields, field);

            if (typeof fieldInStorage !== 'undefined' && postOnSite[field] === fieldInStorage.value) {
              continue;
            }

            if (typeof postOnSite[field] === 'undefined') {
              continue;
            }

            res.fields.push({
              name: field,
              value: postOnSite[field]
            });
          }
          return res;
        });
    return ret;
  },

  sync: function() {
    Sync.connectToStorage(() => {
      Sync.getDataFromSite((postsOnSite) => {
        Sync.getDataFromStorage((postsInStorage) => {
          Mydataspace.request('entities.delete', Sync.getPostsToRemove(postsOnSite, postsInStorage), function() {
            Mydataspace.request('entities.create', Sync.getPostsToCreate(postsOnSite, postsInStorage), function() {
              Promise.all(postsOnSite.map(postOnSite => Sync.getGithubRepo(postOnSite))).then(postsGithubForUpdate => {
                Mydataspace.request('entities.change', postsGithubForUpdate, function() {
                  var postsForUpdate = Sync.getPostsToChange(postsOnSite, postsInStorage);
                  postsForUpdate.fields.push({
                    name: 'githubStars',
                    value: common.findByName('stars', postsGithubForUpdate.fields).value
                  });
                  postsForUpdate.fields.push({
                    name: 'githubForks',
                    value: common.findByName('forks', postsGithubForUpdate.fields).value
                  });
                  if (common.isBlank(common.findByName('description', postsForUpdate.fields))) {
                    postsForUpdate.fields.push({
                      name: 'description',
                      value: common.findByName('description', postsGithubForUpdate.fields).value
                    });
                  }
                  Mydataspace.request('entities.change', postsForUpdate, function() {
                    if (typeof console.scriptComplete === 'function') {
                      console.scriptComplete();
                    }
                  });
                });
              });
            });
          });
        });
      });
    });
  }

}
