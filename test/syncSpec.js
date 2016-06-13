'use strict';
// var expect = require('chai').expect;
describe('Sync', function() {

  describe('isPostExistsInStorage', function() {
    it('returns true for existent post', function() {
      var res = Sync.isPostExistsInStorage([
        { root: 'spreex.github.io', path: 'extensions/spree_pages' },
        { root: 'spreex.github.io', path: 'extensions/spree_reviews' },
        { root: 'spreex.github.io', path: 'extensions/spree_wishlist' },
      ], 'spree_pages');
      expect(res).to.eq(true);
    });
    it('returns true for inexistent post', function() {
      var res = Sync.isPostExistsInStorage([
        { root: 'spreex.github.io', path: 'extensions/spree_pages' },
        { root: 'spreex.github.io', path: 'extensions/spree_reviews' },
        { root: 'spreex.github.io', path: 'extensions/spree_wishlist' },
      ], 'spree_paypal');
      expect(res).to.eq(false);
    });
  });

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
      expect(res.length).to.eq(1);
      expect(res[0].fields.length).to.eq(1);
      expect(res[0].fields[0].name).to.eq('description');
      expect(res[0].fields[0].value).to.eq('This is a really basic page CMS');
    });
  });


  describe('getPostsToRemove', function() {
    it('returns posts for delete', function() {
      var res = Sync.getPostsToRemove([
        { name: 'spree_pages', title: 'spree_pages', description: 'This is a really basic page CMS' },
        { name: 'spree_reviews', title: 'spree_reviews' },
        { name: 'spree_pages', title: 'spree_paypal' }
      ], [
        { root: 'spreex.github.io', path: 'extensions/spree_pages' },
        { root: 'spreex.github.io', path: 'extensions/spree_reviews' },
        { root: 'spreex.github.io', path: 'extensions/spree_wishlist' },
      ]);
      expect(res.length).to.eq(1);
      expect(res[0].path).to.eq('extensions/spree_wishlist');
    });
  });


  describe('getPostsToCreate', function() {
    it('returns posts to create', function() {
      var res = Sync.getPostsToCreate([
        { name: 'spree_pages', title: 'spree_pages', description: 'This is a really basic page CMS' },
        { name: 'spree_reviews', title: 'spree_reviews' },
        { name: 'spree_paypal', title: 'spree_paypal' }
      ], [
        { root: 'spreex.github.io', path: 'extensions/spree_pages' },
        { root: 'spreex.github.io', path: 'extensions/spree_reviews' },
        { root: 'spreex.github.io', path: 'extensions/spree_wishlist' },
      ]);
      console.log(res);
      expect(res.length).to.eq(1);
      expect(res[0].path).to.eq('extensions/spree_paypal');
    });
  });


});
