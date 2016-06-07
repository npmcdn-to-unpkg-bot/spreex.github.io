Datamanager = {
  fillPost: function(data) {
    var pathParts = data.path.split('/');
    if (pathParts.length < 2 || pathParts[0] !== 'extensions') {
      return;
    }
    if (pathParts.length === 2) {
      // extensions/spree_pages
      if (common.isPresent(data.title)) {
        document.getElementById('post__title').innerHTML = data.title;
      }
      if (common.isPresent(data.description)) {
        document.getElementById('post__description').innerHTML = data.description;
      }
    } else if (pathParts.length === 3) {
      // extensions/spree_pages/github
      switch (pathParts[2]) {
        case 'github':
          document.getElementById('github_block__watchers').innerHTML = data.fields.watchers;
          document.getElementById('github_block__stars').innerHTML = data.fields.stars;
          document.getElementById('github_block__forks').innerHTML = data.fields.forks;
          document.getElementById('github_block__issues').innerHTML = data.fields.issues;
          break;
        case 'rubygems':
          document.getElementById('rubygems_block__watchers').innerHTML = data.fields.totalDownload;
          document.getElementById('rubygems_block__lastVersion').innerHTML = data.fields.lastVersion;
          document.getElementById('github_block__forks').innerHTML = data.fields.forks;
          document.getElementById('github_block__issues').innerHTML = data.fields.issues;
          break;
        case 'comments':
          break;
      }
    }
  }
}
