# Autolinker.js

Because I had so much trouble finding a good auto-linking implementation out in
the wild, I decided to roll my own. It  seemed that everything I found out there
was either an implementation that didn't cover every case, or was just limited
in one way or another.

So, this utility attempts to handle everything. It:

- Autolinks URLs, whether or not they start with the protocol (i.e. 'http://').
  In other words, it will automatically link the text "google.com", as well as
  "http://google.com".
- Will properly handle URLs with special characters
- Will properly handle URLs with query parameters or a named anchor (i.e. hash)
- Will autolink email addresses.
- Will autolink phone numbers.
- Will autolink mentions (Twitter, Instagram, Soundcloud).
- Will autolink hashtags.
- Will properly handle HTML input. The utility will not change the `href`
  attribute inside anchor (&lt;a&gt;) tags (or any other tag/attribute), 
  and will not accidentally wrap the inner text of an anchor tag with a
  new one (which would cause doubly-nested anchor tags).

Hope that this utility helps you as well!

Full API Docs: [http://gregjacobs.github.io/Autolinker.js/api/](http://gregjacobs.github.io/Autolinker.js/api/#!/api/Autolinker)<br>
Live Example: [http://gregjacobs.github.io/Autolinker.js/examples/live-example/](http://gregjacobs.github.io/Autolinker.js/examples/live-example/)


## v2.0 released Dec 2018

See [Upgrading from v1.x -> v2.x (Breaking Changes)](#upgrading-from-v1x---v2x-breaking-changes) at the bottom of this readme


## Installation

#### Download

Simply clone or download the zip of the project, and link to either
`dist/Autolinker.js` or `dist/Autolinker.min.js` with a script tag:

```html
<script src="path/to/Autolinker.min.js"></script>
```


#### Using with [Node.js](http://nodejs.org) via [npm](https://www.npmjs.org/):

```shell
npm install autolinker --save
```


#### Using with [Node.js](http://nodejs.org) via [yarn](https://yarnpkg.com/):

```shell
yarn add autolinker
```


JavaScript in Node.js or Webpack:

```javascript
var Autolinker = require( 'autolinker' );
// note: npm wants an all-lowercase package name, but the utility is a class and
// should be aliased with a capital letter
```

TypeScript:

```ts
import { Autolinker } from 'autolinker';
```


## Usage

Using the static [link()](http://gregjacobs.github.io/Autolinker.js/api/#!/api/Autolinker-static-method-link)
method:

```javascript
var linkedText = Autolinker.link( textToAutolink[, options] );
```

Using as a class:

```javascript
var autolinker = new Autolinker( [ options ] );

var linkedText = autolinker.link( textToAutoLink );
```

Note: if using the same options to autolink multiple pieces of html/text, it is
slightly more efficient to create a single Autolinker instance, and run the
[link()](http://gregjacobs.github.io/Autolinker.js/api/#!/api/Autolinker-method-link)
method repeatedly (i.e. use the "class" form above).


#### Example:

```javascript
var linkedText = Autolinker.link( "Check out google.com", { className: "myLink" } );
// Produces: "Check out <a class="myLink myLink-url" href="http://google.com" target="_blank">google.com</a>"
```

## Options

These are the options which may be specified for linking. These are specified by
providing an Object as the second parameter to [Autolinker.link()](http://gregjacobs.github.io/Autolinker.js/api/#!/api/Autolinker-static-method-link). These include:

- [newWindow](http://gregjacobs.github.io/Autolinker.js/api/#!/api/Autolinker-cfg-newWindow) : Boolean<br />
  `true` to have the links should open in a new window when clicked, `false`
  otherwise. Defaults to `true`.<br /><br />
- [urls](http://gregjacobs.github.io/Autolinker.js/api/#!/api/Autolinker-cfg-urls) : Boolean/Object<br />
  `true` to have URLs auto-linked, `false` to skip auto-linking of URLs.
  Defaults to `true`.<br>

  This option also accepts an Object form with 3 properties to allow for 
  more customization of what exactly gets linked. All default to `true`:

    - schemeMatches (Boolean): `true` to match URLs found prefixed with a scheme,
      i.e. `http://google.com`, or `other+scheme://google.com`, `false` to
      prevent these types of matches.
    - wwwMatches (Boolean): `true` to match urls found prefixed with `'www.'`,
      i.e. `www.google.com`. `false` to prevent these types of matches. Note
      that if the URL had a prefixed scheme, and `schemeMatches` is true, it
      will still be linked.
    - tldMatches: `true` to match URLs with known top level domains (.com, .net,
      etc.) that are not prefixed with a scheme or `'www.'`. Ex: `google.com`,
      `asdf.org/?page=1`, etc. `false` to prevent these types of matches.
      <br />

  Example usage: `urls: { schemeMatches: true, wwwMatches: true, tldMatches: false }`

- [email](http://gregjacobs.github.io/Autolinker.js/api/#!/api/Autolinker-cfg-email) : Boolean<br />
  `true` to have email addresses auto-linked, `false` to skip auto-linking of
  email addresses. Defaults to `true`.<br /><br />
- [phone](http://gregjacobs.github.io/Autolinker.js/api/#!/api/Autolinker-cfg-phone) : Boolean<br />
  `true` to have phone numbers auto-linked, `false` to skip auto-linking of
  phone numbers. Defaults to `true`.<br /><br />
- [mention](http://gregjacobs.github.io/Autolinker.js/api/#!/api/Autolinker-cfg-mention) : String<br />
  A string for the service name to have mentions (@username) auto-linked to. Supported
  values at this time are 'twitter', 'soundcloud' and 'instagram'. Pass `false` to skip
  auto-linking of mentions. Defaults to `false`.<br /><br />
- [hashtag](http://gregjacobs.github.io/Autolinker.js/api/#!/api/Autolinker-cfg-hashtag) : Boolean/String<br />
  A string for the service name to have hashtags auto-linked to. Supported
  values at this time are 'twitter', 'facebook' and 'instagram'. Pass `false` to skip
  auto-linking of hashtags. Defaults to `false`.<br /><br />
- [stripPrefix](http://gregjacobs.github.io/Autolinker.js/api/#!/api/Autolinker-cfg-stripPrefix) : Boolean<br />
  `true` to have the `'http://'` (or `'https://'`) and/or the `'www.'` 
  stripped from the beginning of displayed links, `false` otherwise. 
  Defaults to `true`.<br />
  
  This option also accepts an Object form with 2 properties to allow for 
  more customization of what exactly is prevented from being displayed. 
  Both default to `true`:

    - scheme (Boolean): `true` to prevent the scheme part of a URL match
      from being displayed to the user. Example: `'http://google.com'` 
      will be displayed as `'google.com'`. `false` to not strip the 
      scheme. NOTE: Only an `'http://'` or `'https://'` scheme will be
      removed, so as not to remove a potentially dangerous scheme (such
      as `'file://'` or `'javascript:'`).
    - www (Boolean): `true` to prevent the `'www.'` part of a URL match
      from being displayed to the user. Ex: `'www.google.com'` will be
      displayed as `'google.com'`. `false` to not strip the `'www'`.
  
  <br /><br />
- [stripTrailingSlash](http://gregjacobs.github.io/Autolinker.js/api/#!/api/Autolinker-cfg-stripTrailingSlash) : Boolean<br />
  `true` to remove the trailing slash from URL matches, `false` to keep
  the trailing slash. Example when `true`: `http://google.com/` will be 
  displayed as `http://google.com`. Defaults to `true`.
- [truncate](http://gregjacobs.github.io/Autolinker.js/api/#!/api/Autolinker-cfg-truncate) : Number/Object<br />
  A number for how many characters long URLs/emails/Twitter handles/Twitter
  hashtags should be truncated to inside the text of a link. If the match is
  over the number of characters, it will be truncated to this length by
  replacing the end of the string with a two period ellipsis ('..').<br /><br />

  Example: a url like 'http://www.yahoo.com/some/long/path/to/a/file' truncated
  to 25 characters may look like this: 'yahoo.com/some/long/pat..'<br /><br />

  In the object form, both `length` and `location` may be specified to perform
  truncation. Available options for `location` are: 'end' (default), 'middle',
  or 'smart'. Example usage:

    ```javascript
    truncate: { length: 32, location: 'middle' }
    ```

  The 'smart' truncation option is for URLs where the algorithm attempts to
  strip out unnecessary parts of the URL (such as the 'www.', then URL scheme,
  hash, etc.) before trying to find a good point to insert the ellipsis if it is
  still too long. For details, see source code of:
  [TruncateSmart](http://gregjacobs.github.io/Autolinker.js/api/#!/api/Autolinker.truncate.TruncateSmart)
- [className](http://gregjacobs.github.io/Autolinker.js/api/#!/api/Autolinker-cfg-className) : String<br />
  A CSS class name to add to the generated anchor tags. This class will be added
  to all links, as well as this class plus "url"/"email"/"phone"/"hashtag"/"mention"/"twitter"/"instagram"
  suffixes for styling url/email/phone/hashtag/mention links differently.

  For example, if this config is provided as "myLink", then:

  1) URL links will have the CSS classes: "myLink myLink-url"<br />
  2) Email links will have the CSS classes: "myLink myLink-email"<br />
  3) Phone links will have the CSS classes: "myLink myLink-phone"<br />
  4) Twitter mention links will have the CSS classes: "myLink myLink-mention myLink-twitter"<br />
  5) Instagram mention links will have the CSS classes: "myLink myLink-mention myLink-instagram"<br />
  5) Hashtag links will have the CSS classes: "myLink myLink-hashtag"<br />
- [decodePercentEncoding](http://gregjacobs.github.io/Autolinker.js/api/#!/api/Autolinker-cfg-decodePercentEncoding): Boolean<br />
  `true` to decode percent-encoded characters in URL matches, `false` to keep
  the percent-encoded characters.
  
  Example when `true`: `https://en.wikipedia.org/wiki/San_Jos%C3%A9` will
  be displayed as `https://en.wikipedia.org/wiki/San_José`.
  
  Defaults to `true`.
- [replaceFn](http://gregjacobs.github.io/Autolinker.js/api/#!/api/Autolinker-cfg-replaceFn) : Function<br />
  A function to use to programmatically make replacements of matches in the
  input string, one at a time. See the section
  <a href="#custom-replacement-function">Custom Replacement Function</a> for
  more details.

For example, if you wanted to disable links from opening in [new windows](http://gregjacobs.github.io/Autolinker.js/api/#!/api/Autolinker-cfg-newWindow), you could do:

```javascript
var linkedText = Autolinker.link( "Check out google.com", { newWindow: false } );
// Produces: "Check out <a href="http://google.com">google.com</a>"
```

And if you wanted to truncate the length of URLs (while also not opening in a new window), you could do:

```javascript
var linkedText = Autolinker.link( "http://www.yahoo.com/some/long/path/to/a/file", { truncate: 25, newWindow: false } );
// Produces: "<a href="http://www.yahoo.com/some/long/path/to/a/file">yahoo.com/some/long/pat..</a>"
```

## More Examples
One could update an entire DOM element that has unlinked text to auto-link them
as such:

```javascript
var myTextEl = document.getElementById( 'text' );
myTextEl.innerHTML = Autolinker.link( myTextEl.innerHTML );
```

Using the same pre-configured [Autolinker](http://gregjacobs.github.io/Autolinker.js/api/#!/api/Autolinker)
instance in multiple locations of a codebase (usually by dependency injection):

```javascript
var autolinker = new Autolinker( { newWindow: false, truncate: 25 } );

//...

autolinker.link( "Check out http://www.yahoo.com/some/long/path/to/a/file" );
// Produces: "Check out <a href="http://www.yahoo.com/some/long/path/to/a/file">yahoo.com/some/long/pat..</a>"

//...

autolinker.link( "Go to www.google.com" );
// Produces: "Go to <a href="http://www.google.com">google.com</a>"

```

## Retrieving the List of Matches

If you're just interested in retrieving the list of [Matches](http://greg-jacobs.com/Autolinker.js/api/#!/api/Autolinker.match.Match) without producing a transformed string, you can use the [parse()](http://greg-jacobs.com/Autolinker.js/api/#!/api/Autolinker-static-method-parse) method.

For example:

```
var matches = Autolinker.parse( "Hello google.com, I am asdf@asdf.com", {
    urls: true,
    email: true
} );

console.log( matches.length );           // 2
console.log( matches[ 0 ].getType() );   // 'url'
console.log( matches[ 0 ].getUrl() );    // 'google.com'
console.log( matches[ 1 ].getType() );   // 'email'
console.log( matches[ 1 ].getEmail() );  // 'asdf@asdf.com'
```


## Custom Replacement Function

A custom replacement function ([replaceFn](http://gregjacobs.github.io/Autolinker.js/api/#!/api/Autolinker-cfg-replaceFn))
may be provided to replace url/email/phone/mention/hashtag matches on an
individual basis, based on the return from this function.

#### Full example, for purposes of documenting the API:

```javascript
var input = "...";  // string with URLs, Email Addresses, Mentions (Twitter, Instagram), and Hashtags

var linkedText = Autolinker.link( input, {
    replaceFn : function( match ) {
        console.log( "href = ", match.getAnchorHref() );
        console.log( "text = ", match.getAnchorText() );

        switch( match.getType() ) {
            case 'url' :
                console.log( "url: ", match.getUrl() );

                return true;  // let Autolinker perform its normal anchor tag replacement

            case 'email' :
                var email = match.getEmail();
                console.log( "email: ", email );

                if( email === "my@own.address" ) {
                    return false;  // don't auto-link this particular email address; leave as-is
                } else {
                    return;  // no return value will have Autolinker perform its normal anchor tag replacement (same as returning `true`)
                }

            case 'phone' :
                console.log( "Phone Number: ", match.getNumber() );

                return '<a href="http://newplace.to.link.phone.numbers.to/">' + match.getNumber() + '</a>';

            case 'mention' :
                console.log( "Mention: ", match.getMention() );
                console.log( "Mention Service Name: ", match.getServiceName() );

                return '<a href="http://newplace.to.link.mention.handles.to/">' + match.getMention() + '</a>';

            case 'hashtag' :
                console.log( "Hashtag: ", match.getHashtag() );

                return '<a href="http://newplace.to.link.hashtag.handles.to/">' + match.getHashtag() + '</a>';
        }
    }
} );
```

#### Modifying the default generated anchor tag

```javascript
var input = "...";  // string with URLs, Email Addresses, Mentions (Twitter, Instagram), and Hashtags

var linkedText = Autolinker.link( input, {
    replaceFn : function( match ) {
        console.log( "href = ", match.getAnchorHref() );
        console.log( "text = ", match.getAnchorText() );

        var tag = match.buildTag();         // returns an `Autolinker.HtmlTag` instance for an <a> tag
        tag.setAttr( 'rel', 'nofollow' );   // adds a 'rel' attribute
        tag.addClass( 'external-link' );    // adds a CSS class
        tag.setInnerHtml( 'Click here!' );  // sets the inner html for the anchor tag

        return tag;
    }
} );
```


The `replaceFn` is provided one argument:

1. An [Autolinker.match.Match](http://gregjacobs.github.io/Autolinker.js/api/#!/api/Autolinker.match.Match)
   object which details the match that is to be replaced.


A replacement of the match is made based on the return value of the function.
The following return values may be provided:

1. No return value (`undefined`), or `true` (Boolean): Delegate back to
   Autolinker to replace the match as it normally would.
2. `false` (Boolean): Do not replace the current match at all - leave as-is.
3. Any String: If a string is returned from the function, the string will be used
   directly as the replacement HTML for the match.
4. An [Autolinker.HtmlTag](http://gregjacobs.github.io/Autolinker.js/api/#!/api/Autolinker.HtmlTag)
   instance, which can be used to build/modify an HTML tag before writing out its
   HTML text.


## Full API Docs

The full API docs for Autolinker may be referenced at:
[http://gregjacobs.github.io/Autolinker.js/api/](http://gregjacobs.github.io/Autolinker.js/api/#!/api/Autolinker)

## Live Example

[http://gregjacobs.github.io/Autolinker.js/examples/live-example/](http://gregjacobs.github.io/Autolinker.js/examples/live-example/)


## Users of Internet Explorer 8 and Below

Autolinker compiles into ES5, and uses ES5 library methods. If you need 
to run Autolinker on ancient browsers (i.e. Internet Explorer 8 
or below), you will need some polyfills. 

I recommend using the [core-js](https://www.npmjs.com/package/core-js)
ES5 polyfill. You may also be able to get away with adding this single 
polyfill, but that may or may not be true in the future:

```js
if( typeof Array.prototype.forEach !== 'function' ) {
    Array.prototype.forEach = function( callback, thisArg ) {
        for( var i = 0; i < this.length; i++ ) {
            callback.apply( thisArg || this, [ this[ i ], i, this ] );
        }
    };
}
```


## Upgrading from v1.x -> v2.x (Breaking Changes)

1. If you are still on v0.x, first follow the instructions in the 
   [Upgrading from 0.x -> 1.x](#upgrading-from-v0x---v1x-breaking-changes) 
   section below.
2. Codebase has been converted to TypeScript, and uses ES6 exports. Use the `import` 
   statement to pull in the `Autolinker` class and related entities such as
   `Match`:

   ```ts
   import { Autolinker, Match } from 'autolinker';
   ```
3. You will no longer need the `@types/autolinker` package as this package now
   exports its own types
4. You will no longer be able to override the regular expressions in the `Matcher`
   classes by assigning to the prototype (for instance, something like
   `PhoneMatcher.prototype.regex = ...`). This is due to how TypeScript creates 
   properties for class instances in the constructor rather than on prototypes, 
   and it's not worth working around. The notion of providing your own
   regular expression for these classes is brittle anyway, as the 
   `Matcher` classes rely on capturing groups in the RegExp being in the right 
   place, and these are subject to change as the regular expression needs to 
   be updated. Use your own `Matcher` class instead if you would like to 
   override this functionality, such as with the `phoneMatcherFactory` config.

## Upgrading from v0.x -> v1.x (Breaking Changes)

1. `twitter` option removed, replaced with `mention` (which accepts 'twitter', 
   'instagram' and 'soundcloud' values)
2. Matching mentions (previously the `twitter` option) now defaults to
   being turned off. Previously, Twitter handle matching was on by 
   default.
3. `replaceFn` option now called with just one argument: the `Match` 
   object (previously was called with two arguments: `autolinker` and 
   `match`)
4. (Used inside the `replaceFn`) `TwitterMatch` replaced with 
   `MentionMatch`, and `MentionMatch.getType()` now returns `'mention'` 
   instead of `'twitter'`
5. (Used inside the `replaceFn`) `TwitterMatch.getTwitterHandle()` -> 
   `MentionMatch.getMention()`



## Developing / Contributing

Pull requests definitely welcome. To setup the project, make
sure you have [Node.js](https://nodejs.org) installed. Then
open up a command prompt and type the following:

```
npm install -g yarn  # if you don't have yarn already

cd Autolinker.js     # where you cloned the project
yarn install
```

To run the tests:

```
yarn test
```

- Make sure to add tests to cover your new functionality/bugfix.
- Run the `yarn test` command to build/test (or alternatively, open the 
  `tests/index.html` file to run the tests).
- Please use tabs for indents! Tabs are better for everybody 
  (individuals can set their editors to different tab sizes based on 
  their visual preferences).


#### Building the Project Fully

For this you will need [Ruby](https://www.ruby-lang.org) installed (note: Ruby
comes pre-installed on MacOS), with the [JSDuck](https://github.com/senchalabs/jsduck) 
gem. 

See https://github.com/senchalabs/jsduck#getting-it for installation 
instructions on Windows/Mac/Linux

[JSDuck](https://github.com/senchalabs/jsduck) is used to build the project's
API/documentation site. See [Documentation Generator Notes](#Documentation Generator Notes)
for more info.


#### Running the Live Example Page Locally

Run:

```
yarn serve
```

Then open your browser to: http://localhost:8080/docs/examples/live-example/index.html

You should be able to make a change to source files, refresh your page, and see
the changes.

Note: If anyone wants to submit a PR converting `gulp watch` to `webpack` with 
the live development server, that would be much appreciated :)


#### Documentation Generator Notes

This project uses [JSDuck](https://github.com/senchalabs/jsduck) for its 
documentation generation, which produces the page at [http://gregjacobs.github.io/Autolinker.js](http://gregjacobs.github.io/Autolinker.js).

Unfortunately, JSDuck is a very old project that is no longer maintained. As 
such, it doesn't support TypeScript or anything from ES6 (the `class` keyword, 
arrow functions, etc). However, I have yet to find a better documentation 
generator that creates such a useful API site. (Suggestions for a new one are 
welcome though - please raise an issue.)

Since ES6 is not supported, we must generate the documentation from the ES5 
output. As such, a few precautions must be taken care of to make sure the 
documentation comes out right:

1. `@cfg` documentation tags must exist above a class property that has a 
   default value, or else it won't end up in the ES5 output. For example:

   ```ts
   // Will correctly end up in the ES5 output

   /**
    * @cfg {String} title
    */
   readonly title: string = '';



   // Will *not* end up in ES5 output, and thus, won't end up in the generated
   // documentation

   /**
    * @cfg {String} title
    */
   readonly title: string;
   ```
2. The `@constructor` tag must be replaced with `@method constructor`


## Changelog

See [Releases](https://github.com/gregjacobs/Autolinker.js/releases)
