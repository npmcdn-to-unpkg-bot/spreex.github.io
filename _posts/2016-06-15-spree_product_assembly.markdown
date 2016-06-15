---
layout: post
date:   2016-06-15 10:51:12 +0500
permalink: /extensions/spree_product_assembly
categories: extensions
githubRepoName: spree-contrib/spree-product-assembly
description: Adds oportunity to make bundle of products.
---
[![Build Status](https://travis-ci.org/spree-contrib/spree-product-assembly.svg?branch=master)](https://travis-ci.org/spree-contrib/spree-product-assembly)
[![Code Climate](https://codeclimate.com/github/spree-contrib/spree-product-assembly/badges/gpa.svg)](https://codeclimate.com/github/spree-contrib/spree-product-assembly)

Create a product which is composed of other products.

---

## Installation

1. Add this extension to your Gemfile with this line:
  ```ruby
  gem 'spree_product_assembly', github: 'spree-contrib/spree-product-assembly', branch: 'X-X-stable'
  ```

  The `branch` option is important: it must match the version of Spree you're using.
  For example, use `3-0-stable` if you're using Spree `3-0-stable` or any `3.0.x` version.

2. Install the gem using Bundler:
  ```ruby
  bundle install
  ```

3. Copy & run migrations
  ```ruby
  bundle exec rails g spree_product_assembly:install
  ```

4. Restart your server

  If your server was running, restart it so that it can find the assets properly.

---

## Use

To build a bundle (assembly product) you'd need to first check the "Can be part" flag on each product you want to be part of the bundle. Then create a product and add parts to it. By doing that you're making that product an assembly.

The store will treat assemblies a bit different than regular products on checkout.
Spree will create and track inventory units for its parts rather than for the product itself.
That means you essentially have a product composed of other products. From a customer perspective it's like they are paying a single amount for a collection of products.

## Using with spree_wombat

If you use this with spree_wombat make sure that you add this extension after spree_wombat in your `Gemfile`

This extension provides a specific serializer for shipments `assembly_shipment_serializer`, to use this in your Spree storefront make sure you configure spree_wombat like this:

```ruby
config.payload_builder = {
  'Spree::Shipment' => {
    serializer: 'Spree::Wombat::AssemblyShipmentSerializer',
    root: 'shipments'
  }
}
```

---

## Contributing

See corresponding [guidelines][1].

---

Copyright (c) 2007-2015 [Spree Commerce Inc.][2] and [contributors][3], released under the [New BSD License][4]

[1]: http://guides.spreecommerce.com/developer/contributing.html
[2]: https://github.com/spree
[3]: https://github.com/spree-contrib/spree-product-assembly/graphs/contributors
[4]: https://github.com/spree-contrib/spree-product-assembly/blob/master/LICENSE.md
