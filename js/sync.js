console.log('SCRIPT: Sync.js');
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
    Mydataspace.registerFormatter('entities.get.res', new EntitySimplifier());
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

  getDataFromStorage: function(done) {
    Mydataspace.request('entities.get', { root: Sync.ROOT, path: 'extensions', children: [] }, function(data) {
      done(data.children);
    });
  },

  getPostsToRemove: function(postsOnSite, postsInStorage) {
    return common.permit(
      common.mapToArray(postsInStorage, false)
            .filter(post => typeof common.findByName(postsOnSite, common.getChildName(post.path)) === 'undefined'), ['root', 'path']);
  },

  getPostsToCreate: function(postsOnSite, postsInStorage) {
    var ret =
      postsOnSite
        .filter(postOnSite => postsInStorage[postOnSite.name] == null)
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
          var postInStorage = postsInStorage[postOnSite.name];
          if (postInStorage == null) {
            return null;
          }
          var res = { root: Sync.ROOT, path: 'extensions/' + postOnSite.name, fields: [] };
          for (let field of Sync.FIELDS) {
            if (postInStorage.fields[field] != null && postOnSite[field] === postInStorage.fields[field]) {
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

  syncStatistics: function() {
    Sync.connectToStorage(() => {
      Sync.getDataFromStorage((postsInStorage) => {
        Promise.all(postsOnSite.map(postOnSite => Sync.getGithubRepo(postOnSite))).then(postsGithubForUpdate => {
          Mydataspace.request('entities.change', postsGithubForUpdate, function() {
            if (MDSConsole != null) {
              MDSConsole.success('Statistics successfully updated!');
            }
          });
        });
      });
    });
  },

  filter: function(obj, predicate) {
    var result = {};
    for (key in obj) {
      if (obj.hasOwnProperty(key) && !predicate(obj[key])) {
        result[key] = obj[key];
      }
    }
    return result;
  },

  syncDescriptions: function() {
    Sync.connectToStorage(() => {
      Sync.getDataFromStorage((postsInStorage) => {
        let postsForUpdate =
          common.mapToArray(postsInStorage, false)
                .filter(post => common.isBlank(post.fields['description']))
                .map(post => ({
                  root: post.root,
                  path: post.path,
                  fields: [],
                  children: ['github']
                }));
        Mydataspace.request('entities.get', postsForUpdate, data => {
          let postsForUpdate =
            data.map(function(post) {
              return {
                root: Sync.ROOT,
                path: post.path,
                fields: [{ value: post.children['github'].fields['description'], name: 'description' }]
              };
            });
          Mydataspace.request('entities.change', postsForUpdate, function() {
            console.log('Descriptions updated successful');
            if (MDSConsole != null) {
              MDSConsole.info('Descriptions updated successful');
              MDSConsole.success();
            }
          });
        });
      });
    });
  },

  sync: function() {
    Sync.connectToStorage(() => {
      Sync.getDataFromSite((postsOnSite) => {
        Sync.getDataFromStorage((postsInStorage) => {
          Mydataspace.request('entities.delete', Sync.getPostsToRemove(postsOnSite, postsInStorage), function() {
            console.log('Excess posts deleted');
            Mydataspace.request('entities.create', Sync.getPostsToCreate(postsOnSite, postsInStorage), function() {
              console.log('New posts created');
              Mydataspace.request('entities.change', Sync.getPostsToChange(postsOnSite, postsInStorage), function() {
                console.log('Changed posts updated');
                Promise.all(postsOnSite.map(postOnSite => Sync.getGithubRepo(postOnSite))).then(postsGithubForUpdate => {
                  Mydataspace.request('entities.change', postsGithubForUpdate, function() {
                    console.log('Posts successfully synchronized!');
                    if (MDSConsole != null) {
                      MDSConsole.success('Posts successfully synchronized!');
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
