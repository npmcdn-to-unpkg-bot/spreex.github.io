Mydataspace.init({
  connected: function() {
    Mydataspace.on('entities.getChildren.res', function(data) {
      ;
    });
  }
});
Mydataspace.connect();
