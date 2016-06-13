'use strict';
// var expect = require('chai').expect;

describe('getPostsToChange', function() {
  it('returns posts for change', function() {
    var res = Sync.getPostsToChange([
      { name: 'spree_pages', title: 'spree_pages', description: 'This is a really basic page CMS' }
    ], [
      {
        root: 'spreex.github.io',
        path: 'extensions/spree_pages',
        fields: [
          { name: 'websiteURL', value: 'http://spreecommerce.com' },
          { name: 'title', value: 'spree_pages' },
          { name: 'description', value: 'Old description' },
        ]
      }
    ]);
    console.log(res[0].fields);
    expect(res.length).to.eq(1);
    expect(res[0].fields.length).to.eq(1);
    expect(res[0].fields[0].name).to.eq('description');
    expect(res[0].fields[0].value).to.eq('This is a really basic page CMS');
  });
});
