---
layout: post
date:   2016-03-11 23:51:12 +0500
permalink: /extensions/spree_editor
categories: extensions
githubRepoName: spree-contrib/spree_editor
description: Rich text editor for Spree with Image and File uploading in-place.
---
[![Build Status](https://travis-ci.org/spree-contrib/spree_editor.svg?branch=master)](https://travis-ci.org/spree-contrib/spree_editor)
[![Code Climate](https://codeclimate.com/github/spree-contrib/spree_editor/badges/gpa.svg)](https://codeclimate.com/github/spree-contrib/spree_editor)

This extension provides an inline rich-text editor for Spree. It implements different types of editors:

- [CKEditor][1]
- [TinyMCE][2]

Please not that this extension is just a simple integration of some pretty complex gems: [`ckeditor`][9] and [`tinymce-rails`][10].

If you have issues, please check their issues trackers first.

---

1. Add this extension to your Gemfile with this line:
  ```ruby
  gem 'spree_editor', github: 'spree-contrib/spree_editor', branch: 'X-X-stable'
  ```

  The `branch` option is important: it must match the version of Spree you're using.
  For example, use `3-0-stable` if you're using Spree `3-0-stable` or any `3.0.x` version.

2. Install the gem using Bundler:
  ```ruby
  bundle install
  ```

3. Copy & run migrations
  ```ruby
  bundle exec rails g spree_editor:install
  ```

4. If using CKEditor, and would like to enable file uploads run the ckeditor generator:
  ```sh
  $ rails g ckeditor:install --orm=active_record --backend=paperclip && rake db:migrate
  ```

5. In order to secure your file uploads to only be accessed by admins you will also need to configure config/initializers/ckeditor.rb:
  ```ruby
  config.authorize_with :cancan, Spree::Ability
  ```

6. In order to precompile CKEditor's generated assets, you will need to add a line in config/initializers/assets.rb:
  ```ruby
  Rails.application.config.assets.precompile += %w( ckeditor/*)
  ```

7. Restart your server

  If your server was running, restart it so that it can find the assets properly.

---

## Configuration

Preferences can be updated within the admin panel under "configuration" then "rich editor".

Or you may set them with an initializer within your application:

```ruby
SpreeEditor::Config.tap do |config|
  config.ids = 'product_description page_body event_body'

  # change the editor to CKEditor
  config.current_editor = 'CKEditor'
end
```

The default preference is:

```ruby
{
  enabled: true,
  current_editor: 'TinyMCE',
  ids: 'product_description page_body'
}
```

---

## Language-Support

To obtain support for multiple languages with TinyMCE add tinymce-rails-langs to your Gemfile:

```ruby
gem 'tinymce-rails-langs'
```

TinyMCE will not be loaded unless it finds a language package matching your `Spree::Config.default_locale`.

---

## Contributing

See corresponding [guidelines][8]

---

Copyright (c) 2010-2015 [divineforest][5] and other [contributors][6], released under the [New BSD License][7]

[1]: http://ckeditor.com
[2]: http://www.tinymce.com
[3]: http://www.fsf.org/licensing/essays/free-sw.html
[4]: https://github.com/spree-contrib/spree_editor/issues
[5]: https://github.com/divineforest
[6]: https://github.com/spree-contrib/spree_editor/graphs/contributors
[7]: https://github.com/spree-contrib/spree_editor/blob/master/LICENSE.md
[8]: https://github.com/spree-contrib/spree_editor/blob/master/CONTRIBUTING.md
[9]: https://github.com/galetahub/ckeditor
[10]: https://github.com/spohlenz/tinymce-rails
