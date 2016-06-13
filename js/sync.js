const ROOT = 'spreex.github.io';
const FIELDS = [
  'title',
  'description',
  'websiteURL',
  'demoURL',
  'sourceCodeURL',
  'githubRepoName',
  'rubygemsGemName'
];
const GITHUB_FIELDS = {
  forks: 'forks',
  subscribers_count: 'watchers',
  open_issues: 'issues',
  watchers: 'stars'
}

/**
 * Connect & login to MyDataSpace.
 */
function connectToStorage(done) {
  Mydataspace.init({
    connected: function() {
      Mydataspace.on('login', function() {
        done();
      });
    }
  });
  Mydataspace.connect();
}

function getDataFromStorage(done) {
  Mydataspace.request('entities.get', { root: ROOT, path: 'extensions' }, done);
}

function getDataFromSite(done) {
  $.ajax({
    url: 'http://spreex.github.io/posts.js',
    mathod: 'get',
    dataType: 'json'
  }).done(function(data) {
    done(formatDataFromSite(data));
  });
}

function getGithubRepo(postOnSite) {
  const gh = new GitHub();
  const parts = postOnSite.githubRepoName.split('/');
  return gh.getRepo(parts[0], parts[1]).getDetails().then(function(details) {
    const fields = [];
    const data = details.data;
    for (let field in GITHUB_FIELDS) {
      field.push({
        name: GITHUB_FIELDS[field],
        value: data[field]
      });
    }
    return {
      root: ROOT,
      path: 'extensions/' + postOnSite.name,
      fields: fields
    };
  });
}

function getPostsToRemove(postsOnSite, postsInStorage) {
  return postsInStorage.filter(post => typeof common.findByName(postsOnSite, common.getChildName(post.path)) !== 'undefined');
}

function isPostExistsInStorage(postInStorage, name) {
  return !common.isNull(findPostInStorage(postInStorage, name));
}

function findPostInStorage(postInStorage, name) {
  var ret = postsInStorage.filter(postInStorage => postInStorage.root === ROOT && postInStorage.path === 'extensions/' + name);
  if (ret.length > 0) {
    return ret[0];
  }
  return null;
}

function getPostsToCreate(postsOnSite, postsInStorage) {
  var ret =
    postsOnSite
      .filter(postOnSite => !isPostExistsInStorage(postsInStorage, postOnSite.name))
      .map(function(postOnSite) {
        var res = { root: ROOT, path: 'extensions/' + postOnSite.name, fields: [] };
        for (let field of FIELDS) {
          res.fields.push({
            name: field,
            value: postOnSite[field]
          });
        }
        return res;
      });
  return ret;
}

function getPostsToChange(postsOnSite, postsInStorage) {
  var ret =
    postsOnSite
      .map(function(postOnSite) {
        var postInStorage = findPostInStorage(postsInStorage, postOnSite.name);
        if (common.isNull(postInStorage)) {
          return null;
        }
        var res = { root: ROOT, path: 'extensions/' + postOnSite.name, fields: [] };
        for (let field of FIELDS) {
          if (postOnSite[field] === common.findByName(postInStorage.fields, field).value) {
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
}

function sync() {
  connectToStorage(() => {
    getDataFromSite((postsOnSite) => {
      getDataFromStorage((postsInStorage) => {
        Mydataspace.request('entities.delete', getPostsToRemove(postsOnSite, postsInStorage), function() {
          Mydataspace.request('entities.create', getPostsToCreate(postsOnSite, postsInStorage), function() {
            Mydataspace.request('entities.change', getPostsToChange(postsOnSite, postsInStorage), function() {
              Promise.all(postsOnSite.map(postOnSite => getGithubRepo(postOnSite))).then(postsForUpdate => {
                Mydataspace.emit('entities.change', postsForUpdate);
              });
            });
          });
        });
      });
    });
  });
}
