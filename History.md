
0.19.0 / 2015-05-18
==================

  * Open-sourcing, renamed package to "zeditor"

0.18.2 / 2015-03-10
==================

  * package: update "range-normalize" to v1.1.1
  * package: update "range-equals" to v1.1.1
  * package: update "padding-command" to v1.0.4
  * package: update "selectionchange-polyfill" to v1.1.4
  * package: update "click-outside" to v1.0.3
  * package: update "list-command" to v1.1.5
  * package: update "wrap-command" to v2.0.1
  * package: update "blockquote-command" to v3.0.2
  * package: update "click-outside" to v1.0.2
  * package: update "babel" and "babel-runtime" to v4.7.4

0.18.1 / 2015-03-05
==================

  * tokenizer: use current-range
  * tokenizer: rename selection to currentSelection
  * example: add args to plugins
  * example: add commented out plugins for convenience
  * tokenizer: add missing newline
  * tokenizer: use alt value logic from util
  * tokenizer: use extraction logic in util
  * tokenizer: add util
  * tokenizer: fix `tokenizerAlt` in Token class as well
  * tokenizer: fix `data-tokenizer-alt` attr to override IMG alts
  * package.json: update padding-command dep
  * remove no-longer-used "indent-command" and "outdent-command" modules
  * input-normalizer: only copy style attribute if it exists
  * package.json: update padding-command dep
  * editor: specify max indent
  * editor: match wp-admin metrics for padding
  * input-normalizer: copy style attribute when inserting new paragraphs
  * package.json: add padding-command to deps
  * editor: use padding-command
  * History: fix version number typo

0.18.0 / 2015-03-03
==================

  * input-normalizer: correct paste event type
  * input-normalizer: add keypress normalization
  * input-normalizer: ignore some of the control keys
  * input-normalizer: normalize on paste event
  * input-normalizer: normalize `.zwsp` SPANs
  * input-normalizer: move empty non-void element normalizations
  * editor-normalizer: only merge formatting elements with same attributes
  * package.json: pin and update urlregexp dep
  * tokenizer: take img tags  into account when calculating ranges
  * Makefile: add `--source-maps-inline` flag to Babel files
  * tokenizer: extract text representation from img tags
  * tokenizer: take BRs into account when calculating ranges
  * tokenizer: add custom method for extracting text content
  * tokenizer: make tokenization recursive
  * is: add blockquote check
  * editor-link-tooltip: remove `line-height` on the INPUT
  * editor-link-tooltip: refactor to be "multi-link aware"
  * editor-link-tooltip: update to ES6 module syntax
  * editor-link-tooltip: turn into an ES6 module
  * editor-link-tooltip: use `doc` var
  * types.d.ts: add missing interface ClipboardEvent
  * package: alphabetize deps
  * package: move Make dependencies to "devDependencies"
  * package: add "range-iterator" as a dep
  * package: update "click-outside" to v1.0.1
  * package: update "drag-element" to v0.4.4
  * package: update "list-command" to v1.1.4
  * package: update "debug" to v2.1.2
  * package: update "tsify" to v0.8.1
  * package: update "wrap-command" to v2.0.0
  * package: update "browserify" to v9.0.3
  * package: update "per-frame" to v3.0.1
  * package: update "wpcom-proxy-request" to v1.0.3
  * package: update "zuul" to v2
  * package: update "browserify-jade" to v0.1.2
  * package: update "outdent-command" to v1.2.1
  * package: update "unwrap-node" to v1.0.0

0.17.2 / 2015-02-27
==================

  * package: update "click-outside" to v1.0.0
  * package: update "component-tip" to v2.4.1
  * package: update "list-command" to v1.1.3
  * package: update "link-command" to v1.2.3
  * package: update "get-document" to v1.0.0
  * input-normalizer: Revert "properly check for `collapsed` range"
  * input-normalizer: add comment about range container check
  * block-controls: add work around for Firefox painting bug
  * Makefile: fix duplicated CSS content

0.17.1 / 2015-02-24
==================

  * input-normalizer: add improvement todo
  * input-normalizer: add more advanced handling for a elements
  * input-normalizer: add basic handling for insertion at line ends
  * input-normalizer: extract topmost splittable node code
  * input-normalizer: add normalization on compositonstart
  * Makefile: remove verbose flag from `gh-pages` rule
  * Makefile: make browserify debug flag optional
  * Makefile: fix build on case-sensitive filesystems
  * package: update "indent", "outdent" and "blockquote" commands
  * package: update "styl"
  * package: update "current-range"
  * package: update "selectionchange-polyfill" to v1.1.3
  * package: update "range-equals"
  * package: update "debug" to v2.1.1
  * package: update "wrap-command" to v1.1.5
  * package: update "browserify" to v8.0.0
  * package: update "babel" to v4.4.5
  * package: remove unused "split-at-cursor" dependency

0.17.0 / 2015-02-17
==================

  * block: work around babel's new module convention
  * block: remove contenteditable='false'
  * block: add inner-focused class
  * block: add missing semicolon
  * block: handle range edge case that was breaking firefox
  * block: clarify firefox/safari comment
  * block: add note about firefox/safari support
  * block: make sure to focus editor element
  * block: add detailed explanation about asynchrony
  * block: make insertion/selection async
  * block: use mousedown event for consistency with regular caret behavior
  * block: make sure after button covers entire bottom area of editor
  * block: add logic for moving before/after blocks with mouse
  * block: add style for new buttons
  * block: add buttons for before/after navigation
  * block: update reference to babel-runtime
  * block-code: use dataset module
  * block-code: remove nested package.json
  * block-code: add rationale about interval
  * block-code: style fixes
  * block-code: add C to the languages
  * block-code: persist language choice
  * block-code: remove contenteditable='false'
  * block-code: add meta color to theme
  * block-code: add diff support
  * block-code: add TODO for multi line check
  * block-code: also delegate command query calls
  * block-code: delegate to wrap-command when text is selected
  * block-code: inherit from abstract-command
  * block-code: remove pseudo typescript
  * block-code: namespace code mirror css to editor
  * block-code: allow switching between languages
  * block-code: add mode information
  * block-code: add serialization
  * block-code: tweak style for new classes
  * block-code: theme changes
  * block-code: add code block controls
  * block-code: further customize code mirror
  * block-code: add initial implementation
  * block-controls: allow custom controls
  * block-controls: make sure we don't add an `undefined` class name
  * block-controls: use dataset module
  * code-block: adjust options div
  * editor: use block-code: command
  * editor: add `isEmpty()` function
  * Makefile: no longer delete `lib/*/node_modules` on distclean
  * Makefile: remove npm-deps
  * Makefile: include css files
  * Makefile: replace 6to5 with babel
  * Makefile: fix clean rule to not delete css files
  * package.json: update "dom-serialize"
  * package.json: remove npm-deps
  * package.json: add all deps
  * package.json: replace 6to5 with babel, bump version
  * reset.css: add display mode for pre
  * types.d.ts: work around babel's new module convention
  * types.d.ts: update type definition to babel-runtime
  * *: remove all nested package.json files

0.16.1 / 2015-02-13
==================

  * post-serializer: use numbered HTML entities

0.16.0 / 2015-02-10
==================

  * add .zuul.yml file
  * .zuul.yml: add "browsers" array
  * block: remove height transition
  * block: add handling for serialize events
  * block-embed: remove transition
  * block-embed: wrap serialization in p
  * block-embed: add "html" serialization support
  * block-html: conform to new serialize signature
  * types.d.ts: add corejs.WeakSet
  * post-serializer: update "dom-serialize"
  * post-serializer: remove special handling for blocks
  * is: add initial unit tests
  * Makefile: add `test`, `test-local` and `test-zuul` rules
  * package: add "zuul" as a dev dependency
  * tokenizer: add list handling
  * editor: add optional brackets JSDocs
  * editor: test without `new` keyword
  * editor: initial mocha test case
  * editor: add initial `toHTML()` function
  * editor: update debugger on selection changes
  * editor: add wpcom.Site to description
  * editor: add a `serialize()` test case
  * editor-overlay: move overlay-reference style to its own file
  * editor-toolbar-tooltips: use capital function name and correct arguments
  * editor-toolbar: update function name
  * input-normalizer: fix weird caret behavior
  * html-debugger: add new styles for ranges
  * html-debugger: add current-range to dependencies
  * html-debugger: pass current range to pretty-html
  * html-debugger: point to @Coreh fork of pretty-html (for now)

0.15.0 / 2015-02-04
==================

  * editor: make method name a verb
  * editor: don't pass `this.el` to the Serializer
  * editor-link-tooltip: bypass the "focus" event from being emitted
  * editor-link-tooltip: restore range explicitly to `range`
  * post-serializer: refactor to use "dom-serialize"
  * post-serializer: update "dom-serialize" to v2.0.1
  * post-serializer: remove leftover `super()` call
  * post-serializer: don't bother inheriting from `EventEmitter`
  * post-parser: invoke normalizer
  * types: add "dom-serialize" type definition
  * Makefile: use long form parameter names for 6to5
  * Makefile: recompile .ts files when `types.d.ts` changes
  * Makefile: update to new 6to5 transform naming scheme
  * package.json: update "6to5" to v3.3.9
  * *: run make docs

0.14.0 / 2015-02-03
==================

  * editor-selection: update "selectionchange-polyfill" to v1.0.0
  * editor-selection: normalize before comparing
  * editor-selection: only store selection and backward on change
  * editor-selectionchange: use "range-equals" module
  * editor-selectionchange: add a couple debug() calls
  * types.d.ts: add "range-equals"
  * editor: remove `previousSelection` type definition
  * move "focus" restore selection logic to `editor-selection` module
  * types: add "selection-set-range" type definition
  * editor-toolbar: use `editor.focus()` instead of invoking on el directly
  * editor: use `selectionSetRange()` module when necessary
  * editor-selectionchange: keep track of the `previousSelection` Range instance
  * editor: add `previousSelection` Range instance property
  * Revert "block-gallery: unselectable elements in formatbar"
  * block: only add event listeners when binding to an editor
  * block: avoid throwing if no delete button is present
  * block: add a more descriptive error message
  * block: only retrieve uid after binding
  * block-youtube: update .d.ts file
  * block-embed: udpate .d.ts file
  * tokenizer-shortcodes: use new block API
  * tokenizer-embeds: use new block API
  * post-parser: use new block API
  * pasted: use new block API
  * media-controller: pass block instance to .block()
  * block-html: remove extraneous parameter
  * editor: bind block upon insertion
  * block-youtube: use new api
  * block-vimeo: use new api
  * block-twitter: use new api
  * block-html: use new api
  * block-gallery: use new api
  * block: make it so that binding to the same editor twice doesn't throw
  * block-embed: use new constructor API
  * block: remove editor argument
  * block: add bind method
  * *: add symlinks to `.d.ts` files
  * *: export editor, block
  * block: add .d.ts file
  * editor: add type declaration for block function
  * editor: allow passing block instances directly
  * package.json: remove "main" field
  * editor-selectionchange: only emit selectionchange if selection has actually changed
  * editor: disable dragging of inline images

0.13.3 / 2015-01-29
==================

  * block-gallery: unselectable elements in formatbar
  * editor: clear the `publishParams` upon reset()
  * editor-tip: move the "corner" placements' tip by 10px
  * input-normalizer: make sure we never split empty elements
  * input-normalizer: make sure caret doesn't get stuck inside empty elements when joining paragraphs
  * input-normalizer: make sure leaf-range jumps out of empty elements
  * input-normalizer: prevent leaf-range from entering empty elements
  * package: add some more fields
  * use `data-transfer-is-file` module

0.13.2 / 2015-01-26
==================

  * editor: set unlimited max listeners on Editor
  * editor-normalizer: pass selection to currentRange call
  * editor-normalizer: fix exception when currentRange is null
  * editor-toolbar: ensure that the button's states only represent content inside the editor
  * html-debugger: tweak styling
  * types.d.ts: add accurate type definition for currentRange

0.13.1 / 2015-01-23
==================

  * .gitignore: ignore `.es6js` files
  * editor-normalizer: work around lack of method definition in lib.d.ts
  * editor-normalizer: do not restore range if not intersecting subtree
  * editor-selectionchange: update "selectionchange-polyfill" to v0.0.3
  * editor-normalizer: move transaction logic outside of normalize call.
  * wpcom-render-cache: do not load the same rendering twice
  * tokenizer-shortcodes: use render cache
  * editor-normalizer: only run transactions when root is editor.el
  * tokenizer-embeds: add logic to handle embed validation
  * wpcom-render-cache: add render cache
  * tokenizer-embeds: further modularize code
  * tokenizer-embeds: extract link check method
  * update "range-normalize" to v1.1.0

0.13.0 / 2015-01-21
==================

  * editor: instantiate mousetrap before input normalize
  * input-normalizer: bind to `document` instead of `editor.el`
  * input-normalizer: properly check for `collapsed` range
  * editor: define `mousetrapStopCallback` function
  * editor: remove unused `combo` parameter
  * build.sh: rename all compiled files to have `.js` extension
  * Makefile: add `.es6js` extension to browserify
  * Makefile: add `coreAliasing` option for 6to5
  * package.json: add "core-js" dep
  * package.json: add "6to5ify" dev dep
  * Makefile: add rules for es6 files

0.12.7 / 2015-01-20
==================

  * editor-tip: update "component-tip" to v2.3.4
  * Makefile: include target version of ecmascript
  * package: update "tsify"

0.12.6 / 2015-01-16
==================

  * auto-scroll: add auto-scroll code
  * auto-scroll: add counter based start/stop mechanism
  * auto-scroll: update element-scroll-to dependency
  * auto-scroll: deinitialize on stop
  * block: hook up `auto-scroll`
  * block-controls: define `default` cursor in buttons
  * block-gallery: add missing call to stop
  * block-gallery: fix repeated calls to start/stop
  * block-gallery: call start/stop methods on custom drag implementation
  * block-gallery: remove unnecessary css class add
  * block-gallery: remove duplicated code
  * block-gallery: resolving conflicts
  * block-gallery: add entries after to inserted stuff
  * editor: hook up `auto-scroll`
  * editor: update declaration file
  * gallery: re-render gallery when entry is printed
  * gallery: spaces and brackets in function definitions
  * gallery: add delay before to render layout
  * gallery: avoid error throughout the loop
  * gallery: consistent spances in function definition
  * gallery: remove `render` alias
  * gallery: remove pre-frame to render overview
  * gallery-block: hook up to auto-scroll
  * gallery-entry: do not re-render gallery from here
  * media-controller: hook up `auto-scroll`

0.12.5 / 2015-01-16
==================

  * block: use names consistent with the media manager
  * block: make methods protected
  * block: fix double drop bug by removing media call
  * block: forward calls to media controller
  * block: add drag update call to mousemove handler in block
  * block: fix style, 2px layout jump when dragging
  * block-gallery: add handling for dropping outside of block
  * block-gallery: also use consistent names
  * block-gallery: remove event listening, just override existing callbacks
  * editor: updating link color
  * editor: blacklist IMG tags in checkEmpty()
  * editor: refactor `checkEmpty()` to only require one iterator pass
  * editor: update "wrap-command" to v1.1.2
  * editor: allow tip classname to be passed in
  * editor: expose media in `.d.ts` file
  * editor: make sure drag cursor remains on top
  * editor-tip: update "component-tip" to v2.3.2
  * gallery: check MIME type image
  * hacks: add firefox hack for adding space on token dismiss
  * media-controller: remove MIME type control
  * media-controller: remove drag line when there aren't images
  * media-controller: allow only image files to drop
  * media-controller: remove break line
  * media-controller: add special handling for block overlays
  * pasted: add check for single a elements with url text
  * tokenizer: implement firefox hack

0.12.4 / 2015-01-06
==================

  * editor-normalizer: use element type definitions
  * editor-normalizer: add normalization for adjascent elements
  * editor-normalizer: make check for nested a elements more general
  * editor-normalizer: make empty editor check after builtins sentinel
  * editor-normalizer: move empty check to end of normalization chain
  * editor-normalizer: normalize on "compositionend" event
  * editor-normalizer: correctly add BR element on empty break paragraphs
  * input-normalizer: add more robust check for collapsed
  * input-normalizer: add normalization for space with selection
  * input-normalizer: further elaborate on BR behavior
  * input-normalizer: only create two br elements when necessary
  * input-normalizer: make comment technically accurate again
  * input-normalizer: handle shift+enter on empty paragraphs

0.12.3 / 2014-12-17
==================

  * post-parser: emit `parser` event when parser process has been done

0.12.2 / 2014-12-17
==================

  * editor: remove root-level `.sticky` styling

0.12.1 / 2014-12-17
==================

  * editor: remove color from CODE blocks
  * editor-link-tooltip: use "node-contains" instead of "within-element"
  * editor-link-tooltip: force "edit mode" when the Change pencil is clicked
  * editor-selectionchange: clone the Range before normalizing
  * editor-selectionchange: use "node-contains" to check if Selection is within the Editor
  * editor-tip: update "component-tip" to v2.3.0
  * gallery-entry: stop event propagation when entry is removed
  * remove final "scribe" references
  * tokenizer-shortcodes: add CODE to non-void shortcodes whitelist

0.12.0 / 2014-12-16
===================

  * tokenizer: make link token only replaceable automatically
  * tokenizer-embeds: make normal link token invisible.
  * tokenizer: move invisible field to flags section
  * tokenizer: add support for invisible tokens
  * tokenizer: remove final q
  * tokenizer: fix extra q
  * tokenizer: remove commented out style code
  * tokenizer-embeds: add new interaction
  * tokenizer: make accessory links underlined on hover
  * tokenizer-shortcodes: use right class names for links
  * tokenizer-embeds: use right class names for links
  * tokenizer: add code for accessory interaction
  * tokenizer-embeds: add accessory
  * tokenizer-shortcodes: add accessory
  * tokenizer: add token accessory styling
  * tokenizer: add createAcessory method
  * tokenizer: add accessory field to tokeng
  * tokenizer: add accessory rendering code
  * tokenizer: use new hack name, make second if checks shorter
  * hacks: rename hack to make name more general
  * tokenizer: use hack to preserve caret in safari
  * tokenizer-embed: add exclusion function
  * tokenizer: only render when an update is not scheduled yet
  * tokenizer: add logic to handle selection change, misc fixes
  * tokenizer: fix exclude logic, add extra flag
  * tokenizer: fix type issue
  * tokenizer: add custom exclusion function support
  * editor-normalizer: make normalizer resilient to empty text nodes
  * editor-normalizer: normalize nested a tags
  * tokenizer-embeds: check if link is not the same
  * tokenizer-embeds: depend on component-query
  * tokenizer: fix intersectsNode implementation
  * tokenizer: use new intersectsNode method
  * tokenizer: add intersectsNode method
  * tokenizer-embeds: add on load replacement
  * tokenizer-shortcodes: remove reference to flags
  * tokenizer: completely remove tokens variable
  * tokenizer: do not initialize flags variable
  * tokenizer-embeds: use new flag API
  * tokenizer-shortcodes: use new flag api
  * tokenizer: use individual flag fields
  * tokenizer: use standard naming for element field
  * tokenizer: fix exclusion check
  * tokenizer-embeds: use new API
  * tokenizer-shortcodes: use new API
  * tokenizer: switch to new constructor API
  * token: switch to new constructor API
  * tokenizer: add handler for selection changes
  * tokenizer: rely on reset event
  * editor: decouple from tokenizer
  * tokenizer: do not exclude links
  * editor: apply tokens on load
  * tokenizer-shortcodes: get tokens replaced on load
  * tokenizer: fix throw on token when editor is unfocused
  * tokenizer: add code to handle replacement on load
  * tokenizer: fix wrong field name
  * tokenizer-*: allow excluding on esc
  * tokenizer: handle esc key as well
  * input-normalizer: delegate enter handling to tokenizer
  * tokenizer: add handlers for different token triggers
  * token: flip argument order
  * tokenizer-*: conform to new function signature
  * tokenizer: add flags to constructor
  * token: add no flags flag
  * token: add flags

0.11.2 / 2014-12-15
==================

  * editor: add keyboard shortcut to Link "title"
  * editor: rename `.sub` class to `.subheader`
  * editor: force `cursor: auto`
  * editor-link-tooltip: apply some defensive styling
  * editor-link-tooltip: use a CSS selector to detect "new links"
  * editor-tip: scope tip styles to `.editor-tip` class
  * html-debugger: even higher z-index!
  * remove "stickyfill" -- not working with Calypso integration.

0.11.1 / 2014-12-12
==================

  * regenerate docs
  * removing "sticky" on the formatbar for now
  * editor-selectionchange: update "selectionchange-polyfill" to v0.0.2
  * editor-tip: update "component-tip" to v2.2.0

0.11.0 / 2014-12-11
==================

  * use stickyfill polyfill
  * add styling for `.sticky` class
  * editor: add classes to toolbar buttons
  * editor: set formatbar "color" to match "fill"
  * editor: initialize the Serializer instance
  * editor: use `new Tokenizer` syntax
  * editor: add `Editor#tip()` function
  * editor: add JSDoc comments for optional `element`
  * editor: update "list-command" to v1.1.1
  * editor-normalizer: add note about BR special case
  * editor-normalizer: add logic for handling plain text-originated divs
  * editor-normalizer: delegate further processing by creating DIV instead of P
  * editor-normalizer: make sure BR elements trigger a wrapper split
  * editor-tip: set "editor-tip" as a class name
  * editor-toolbar-tooltips: use `editor.tip()` function
  * editor-link-tooltip: use `editor.tip()` function
  * input-normalizer: select LI instead of UL/OL on backward delete
  * pasted: correctly handle case where editor is empty
  * pasted: make error checking more robust
  * pasted: don't transform or unwrap DIVs (for plain text processing)
  * post-serializer: refactor to use TypeScript
  * post-serializer: emit "node", "text" and "element" events
  * post-serializer: remove `data-onserialize` logic
  * post-serializer: add support for `data-onserialize` function-string
  * tokenizer: normalize range when checking for focus

0.10.2 / 2014-12-09
==================

  * editor: expose the `wpcom` instance on Editor
  * editor: use "list-command" module
  * *: use "mutation-observer" npm module
  * editor-normalizer: move adjacent unknown nodes to same wrapper
  * gallery-entry: adjust uploading spinner for slideshow
  * gallery-entry: update spinner when layout changes
  * pasted: remove special case of P element when pasting multiple nodes
  * pasted: handle case where current node is not an HTMLElement
  * pasted: add missing deps to package.json
  * pasted: add code for performing insertion
  * pasted: call new insertion function
  * progress-spinnner: update spinner path in uploading process
  * progress-spinner: fix transparency color
  * progress-spinner: resize center. fix drawing spinner
  * progress-spinner: add function to render internal circle
  * progress-spinner: use size variables
  * progress-spinner: improve jsdoc
  * progress-spinner: update spinner width
  * progress-spinnner: use 100x100 size
  * types.d.ts: add insertNode declaration
  * z-index for buttons with tooltip (heading, alignment) reset to auto

0.10.1 / 2014-12-05
==================

  * types.d.ts: add type definition for dom-move
  * editor-normalizer: use replaceChild
  * editor-normalizer: add li > p normalization
  * editor-normalizer: use dom-move
  * pasted: restructure logic, remove style tags
  * pasted: add special handing to the markup firefox receives
  * gallery: fix uploading style in circle layout
  * example: pass request handler like a parameter

0.10.0 / 2014-12-04
==================

  * editor: make addStyles() process a `::editor` psuedo-selector
  * editor: add `automattic-editor-%id%` class name to wrapper
  * editor: add an `editor.id` UID string
  * editor: add `addStyles()` public API function
  * example: bump "wpcom" to "3.1.0" version
  * editor: only clone range if normalization is needed
  * editor: add logic to mantain caret inside editor children
  * reset.css: only apply underline to links with href
  * tokenizer: fix typescript 1.3 complaint
  * editor: make sure links and uls are styled sensibly
  * pasted: reorder htmlpipes, and add new normalizations
  * pasted: fix whitespace logic for good
  * pasted: add logic for removing comments
  * pasted: add logic for handling office lists
  * pasted: run paste normalizations before built-ins
  * editor-normalizer: allow both uls and ols to be nested
  * editor-normalizer: allow nested ul elements
  * editor-normalizer: allow specifying middleware order
  * pasted: add dom-move dep to package.json
  * pasted: only create HTMLBlocks for tables for now
  * pasted: improve whitespace logic to handle spaces before and after inline elements
  * editor-normalizer: special case tmp elements
  * pasted: reorganize logic to use dom-move
  * editor-normalizer: run middleware before storing selection
  * editor: remove paste handler from editor, use pasted plugin
  * pasted: make pasted an editor plugin
  * editor-normalizer: augment normalize signature
  * editor-normalizer: fix join hint regression
  * editor-normalizer: make normalizations use passed arguments
  * editor-normalizer: simplify middleware usage signature
  * editor-normalizer: bind functions
  * editor-normalizer: move normalizations to array
  * editor-normalizer: add normalization array
  * editor-normalizer: aparently it isn't really needed, since it's disabled for months now
  * editor-normalizer: remove unnecessary check for overlay update
  * block: remove transitions, at least for now as they're glitchy
  * editor-toolbar-tooltips: larger delay for the "add click outside" logic being added
  * tokenizer: remove trailing whitespace
  * Makefile: add missing @ symbol
  * Makefile: invoke "tsify" module directly
  * tokenizer: change `updateTimer` to a NodeJS.Timer instance
  * package: update "tsify" and "browserify" to latest versions
  * post-serializer: add support for "data-serialize"
  * editor: fix format bar Tip placement
  * example: log "error" events via console.error()
  * types: add newline
  * example: remove `version` span
  * example: remove the `site_id` span
  * example: fix whitespace
  * example: remove "Logout" button
  * pasted: remove monospace detection
  * editor-normalizer: add more and improve existing normalizations
  * Updated .gitignore file to exclude IntelliJ IDEA files.
  * pasted: remove logic for figuring out block element size

0.9.1 / 2014-11-19
==================

  * block-controls: do not select unselectable action
  * block-controls: add and require classes module
  * block-controls: tweak handling css classes
  * block-controls: add `selectable` param to #add mtd
  * block-embed: load retina script over https
  * block-embed: enable retina image replacement on embed block
  * editor: add z-index to .automattic-editor-wrapper
  * editor: use "collapse" webmodule
  * editor: fix incorrect argument parameters
  * editor: add deprecate messages
  * editor: deprecate `setParam()` and `getParam()`
  * editor: use "hashmap" module for `publishParams`
  * editor-normalizer: use collapse
  * input-normalizer: use collapse
  * input-normalizer: add collapse dep
  * input-normalizer: add transaction on dismiss
  * input-normalizer: fix selection bug and add transaction
  * input-normalizer: move cursor to right of token on dismiss
  * input-normalizer: dismiss tokens on esc
  * gallery-entry: add radius when it's uploading
  * gallery-block: set `+` button unselectable
  * progress-spinner: update "debug" to v2.1.0
  * tokenizer: remove commented rule
  * tokenizer: add code for handling block replacements
  * tokenizer: disable underline on tokens
  * tokenizer: fix code style
  * tokenizer: return exclusion element on both codepaths
  * tokenizer: expand selector to match .no-tokens class
  * tokenizer: add exclude method to token
  * tokenizer: add check for excluded elements
  * tokenizer: add component-query dep
  * tokenizer: add range intersection check
  * tokenizer: add block-elements dep
  * tokenizer-embeds: simplify embed logic
  * tokenizer-shortcodes: add "caption" to non-void whitelist
  * tokenizer-shortcodes: include latex shortcode
  * tokenizer-shortcodes: add replacement logic
  * types.d.ts: add collapse
  * use the "inherits" module

0.9.0 / 2014-11-18
==================

 * editor: change run() to runAndSquash()
 * editor: use `selectNodeContents()`
 * editor: remove "inject-at-cursor" usage
 * editor: emit a "paste" event before inserting content
 * editor: clean up "onpaste" logic a bit
 * editor: add type information for the "paste" event
 * editor: add positioning styles for the .sub icon
 * editor: use a common "tip" class name for the button with the tip
 * editor: remove a couple extraneous classes
 * editor: add keyboard shortcut keys to tooltips
 * editor: force link color for all "psuedo states"
 * editor: make `margin-top` be 30px
 * editor: use SVG for the header subscripts
 * editor: remove seemingly irrelevant styling
 * editor: remove #{command} from Add Media button
 * editor: use common styling for the editor-tip Tips
 * editor: simplify CSS hacks and adjust for SVG instead of HTML
 * editor: `include` the svg icons for the formatbar .jade files
 * editor: use short Stack Overflow link
 * editor: add the formatbar SVG files
 * editor-link-tooltip: make link tooltip `<input>` have transparent background
 * editor-tip: remove default "height" on Tips
 * editor-tip: remove formatbar button styling
 * input-normalizer: add command to replace current token
 * media-controller: improve new gallery from entry
 * tokenizer-embeds: use current protocol for // urls
 * tokenizer-embeds: remove TODO
 * tokenizer-embeds: add replacement function
 * tokenizer: add method to get currently focused token
 * tokenizer: add replace method to token
 * tokenizer: change replacement signature
 * tokenizer: fix range reference
 * tokenizer: extract focused() method
 * tokenizer-embeds: add embed detection functionality
 * tokenizer-embeds: add new deps
 * block-gallery: add `ref` parameter
 * gallery: set initial value to move timer
 * gallery: remove break line
 * gallery: remove delay handling css after move
 * gallery: listening `entry drop` to move entries
 * gallery: reset drag when entry leaves area
 * gallery: add `moving` flag to avoid crazy swaps
 * gallery: added delay before to move entries
 * gallery: add moveTimer to wait moving entries
 * gallery: add onreadytodrop() bound function
 * gallery-entry: remove break line
 * gallery-entry: bind and emit `entry drop` event
 * gallery-entry: emir `entry leave` event
 * gallery-entry: tweak drop and drag entry styles
 * gallery-entry: remove unused drag/drop properties

0.8.0 / 2014-11-14
==================

  * editor: conform to new post-parser API, and make `reset()` take an optional content string
  * post-parser: make it accept just a String of content
  * post-parser: remove the "metadata" image ID fetching logic
  * editor: remove "self" from JSDoc
  * editor: add embeds
  * tokenizer: fix syntax
  * tokenizer-embeds: add tokenizer-embeds
  * editor: add `serialize()` type declaration
  * editor: remove unused serialize() parameters
  * tokenizer: remove token reference, call requestUpdate()
  * tokenizer-shortcodes: add package.json
  * tokenizer: update deps
  * tokenizer: add note about bogus rects
  * tokenizer: add pending flag to token constructor
  * tokenizer: render pending tokens, fix bogus rects
  * tokenizer-shortcodes: flag pending state on tokens
  * tokenizer: add pending flag
  * tokenizer: add styles for ready/pending states
  * tokenizer-shortcodes: conform to the new add signature
  * tokenizer: new add signature
  * gallery-entry: check if dragged is not defined
  * gallery-entry: pass entry in gallery uploading evs
  * gallery-entry: fux typo
  * gallery-entry: fix typo
  * gallery: rename to onactiveentry()
  * gallery-entry: call gallery#onactiveEntry()
  * gallery: un listening entry `active` event
  * gallery-entry: request gallery render in `print`
  * gallery: un linsten `print` entry event
  * gallery: not listen entry `destroy` event
  * gallery-entry: remove entry from gallery
  * gallery: remove listening entry `drag end` event
  * gallery-entry: emit `entry drag end` in gallery
  * gallery: remove listening entry `drag start` event
  * gallery-entry: emit `entry drag start` in gallery
  * gallery: not listen entry `upload` event
  * gallery-entry: handle gallery `upload` stuff
  * gallery: clean entry code
  * gallery-entry: move `entry start upload` to entry
  * tokenizer: fix typo
  * tokenizer: fix off-by-one error
  * tokenizer: fix intersects to happen only at the same element
  * tokenizer: readd and fix last rect class
  * tokenizer: add class to focused tokens
  * tokenizer: render on selection change
  * tokenizer: call update() per element
  * tokenizer: only display text on focused, move microcopy to last token
  * tokenizer: increase microcopy font-size
  * tokenizer: add style for focused token
  * tokenizer: calculate token range on construction
  * tokenizer: remove calculateRange() call
  * tokenizer-shortcodes: conform to new token API
  * tokenizer: add element parameter to token API
  * tokenizer-shortcodes: conform to new API
  * tokenizer: update API to include element
  * tokenizer: reduce update interval
  * gallery-entry: fix ghost styles
  * editor: pass post object in `post ready` emission
  * block-gallery: simplify changeEntryOfGallery mtd
  * gallery: refact #moveEntry
  * block-gallery: use #moveEntry again
  * block-gallery: check if entry still uploading
  * editor-toolbar-tooltips: hide tooltip when the cursor make the button inactive
  * blog-gallery: move entry for new gallery
  * gallery: add #moveEntry method
  * editor-toolbar-tooltips: implement "active mode"
  * editor: mark the "Heading" button as "active"
  * editor: use editor#block to insert new gallery
  * media-controller: clean new gallery from drop
  * tokenizer-shortcodes: implement non-void whitelist
  * tokenizer: fix rendering of shortcodes on line breaks
  * editor-normalizer: use "block-elements" module
  * types: add "block-elements" declaration
  * editor-toolbar-tooltips: add "active" class to button
  * editor: remove <sub>1</sub> from Header button "inactive" state
  * tokenizer-shortcodes: remove tick-based content check
  * tokenizer: only check periodically for tokens to avoid slowdown
  * editor: use "blockquote" command shortcut in formatbar "title"
  * editor-toolbar-tooltips: add the "click outside" logic
  * editor-toolbar-tooltips: add a few debug() calls
  * editor-toolbar-tooltips: use "dataset" module
  * editor-toolbar-tooltips: whitespace fix
  * gallery: listening `print` entry event
  * post-parser: add debug line
  * npmignore: ignore `.gitignore` file
  * add empty `.npmignore` file
  * editor: append renderer element
  * tokenizer: add container style
  * tokenizer-shortcodes: add temporarily a call to renderer
  * tokenizer: add reference and call to renderer
  * tokenizer: add initial renderer implementation
  * tokenizer: calculate range when adding tokens
  * tokenizer: fix off-by-one error
  * progress-spinner: add unit [ms] to tr duration
  * pkg: bump "wpcom" to "0.5.2"
  * tokenizer-shortcodes: add implementation
  * input-normalizer: comment out tokenizer call for now
  * editor-normalizer: remove legacy tokenizer call
  * wpcom-undocumented: fix index.d.ts
  * tokenizer: fix token impl
  * tokenizer: make methods public
  * tokenizer-shortcodes: fix whitespace
  * progress-uploading: change mask color
  * gallery-entry: add filter in uploading process
  * gallery-entry: resolving conflict
  * gallery-entry: tweak lapses
  * progress-spinner: remove unused css class
  * gallery-entry: tidy adding uploading vars
  * tokenizer-shortcodes: add initial implementation
  * gallery-entry: add debug lines to print lapses
  * gallery-entry: don't pass wrapper to Spinner()
  * progress-spinner: add update() method
  * gallery-entry: autouploading only in `print file`
  * gallery-entry: update spinner when size changes
  * gallery: emit `size` entry event
  * tokenizer: add optimization for case where there are no intersections
  * tokenizer: add new initial tokenizer implementation
  * tokenizer: add token implementation
  * gallery-entry: pass wrapper elemento to spinner
  * progress-spinner: pass DOM wrapper in constructor
  * progress-spinner: add #get() method
  * progress-spinner: hide spinner using css class
  * progress-spinner: add class to hide spinner
  * gallery-entry: remove css mask
  * progress-spinner: adjust transparencies
  * progress-spinner: draw internal circle
  * progress-spinner: add `width` key to opts param
  * progress-spinner: remoce r2 from instance
  * progress-spinner: circunscribe spinner
  * progress-spinner: store circle prps in component
  * progress-spinner: draw external circle
  * progress-spinner: add path to make mask
  * post-serializer: rename debug identifier
  * post-parser: fix media endpoint v1.1 bug
  * gallery-entry: improve spinner end step animation
  * progress-spinner: fix setting prp bug
  * progress-spinner: refact -> add #set() method
  * gallery-entry: update to spinner api
  * progress-spinner: rename #set by #go
  * progress-spinner: add #timing() method
  * progress-spinner: less is more
  * gallery-entry: use spinner#duration() instead of
  * progress-spinner: rename `delay` to `progress`
  * progress-spinner: remove scale options prp
  * progress-spinner: add #delay() to set delay ani
  * progress-spinner: remove commented lines
  * gallery-entry: implement spinner fake delay
  * progres-spinner: rollback width option. adjust r2
  * progress-spinner: pass stroke-width like width opt
  * progress-spinner: uddate values to given parameter
  * progress-spinner: reflex animation
  * progress-spinner: implemewnt css animation
  * progress-spinner: remove timer animation
  * progress-spinner: minor jsdoc improvement
  * progress-spinner: add optional `init` value
  * gallery-entry: hide spinner when media uploades
  * progress-spinner: add #hide() method
  * gallery-entry: add mask instead of use opacity
  * progress-spinner: replace `options` by `opts`
  * gallery-entry: remove initial mask
  * gallery-entry: apply spinner progress
  * gallery-entry: add spinner when image is uploaded
  * gallery-entry: start to listen progress event
  * gallery-entry: fix media URL for 'v1.1' endpoint
  * gallery-entry: update to media endpoint 1.1
  * gallery-entry: pass setDataFromResponse method
  * progress-spinner: support multiple settings
  * progress-spinner: implement timer to draw progress
  * progress-spinner: add timer
  * progress-spinner: add debug line
  * progress-spinner: add #thml() method
  * progress-spinner: set size through of options
  * progress-spinner: draw using html markup
  * progress-spinner: add package json file
  * progress-spinner: paint path children elements
  * progress-spinner: add path children elements
  * progress-spinner: add elements object
  * progress-spinner: set size and position using styles
  * progress-spinner: remove options to set size :-(
  * progress-spinner: unit is needed in size options
  * progress-spinner: create `svg` DOM element
  * progress-spinner: set el size through of options
  * gallery-entry: add and use `spinner` component
  * init progress spinner component
  * gallery-entry: start to build style in spinner
  * gallery-entry: add spinner element

0.7.3 / 2014-11-12
==================

  * build: only force half the number of CPUs for jobs
  * block-controls: add `text-decoration: none` styling to controls
  * editor: CSS tweaks for header tooltip positioning
  * editor: use `dataset` module
  * example: redirect to `https:` in gh-pages "production"
  * package: turn the build step into a "prepublish" step
  * Makefile: remove the individual `npm install` rules

0.7.2 / 2014-11-11
==================

  * update to media endpoint version `1.1`

0.7.1 / 2014-11-10
==================

  * example: refactor example to use user's "primary_blog" by default
  * example: use "wpcom-proxy-request" for gh-pages example
  * example: use "min-height" instead of "height"
  * editor: fix placeholder text overflow
  * editor: add note about css prop
  * editor: fix code style
  * editor: fix toolbar button size in firefox
  * pasted: bump "dom-paste" version to 2.0.2
  * Readme: add details on running standalone example

0.7.0 / 2014-11-10
==================

  * add `install.sh` script
  * block-embed: add "http://" prefix to `url` if not present
  * example: make the #editor DIV take up 80% height
  * example: re-use `auth` variable
  * example: use "wpcom-browser-auth"
  * example: comment out log calls
  * editor: force the `.body` DIV to 100% height
  * editor: update "outdent-command" to v1.1.1
  * editor: update "blockquote-command" to v2.0.2
  * editor: remove redundant call to overlay update
  * editor-normalizer: move tokenization step outside of transaction
  * editor-normalizer: consolidate normalization into a single transaction
  * editor-selectionchange: update "selectionchange-polyfill" to v0.0.1
  * html-debugger: only update when visible
  * input-normalizer: generate non-void inline els selector
  * input-normalizer: use inline-elements and void-elements
  * input-normalizer: add new deps
  * input-normalizer: add matches-selector dep
  * input-normalizer: make sure BR is inserted inside inline elements
  * pasted: update "dom-paste" version
  * pasted: normalize for white-space: pre-wrap
  * tokenizer: convert "wildcard URL" embeds to RegExps
  * tokenizer: add style for markdown link
  * tokenizer: fix incorrect classification
  * tokenizer: add tokenization for markdown link syntax
  * tokenizer: add check for escape sequence
  * tokenizer: add allotment list
  * tokenizer: make the optional "https?://" prefix be a non-capture group
  * tokenizer: make the "https?://" prefix on embed URLs optional
  * transaction-manager: handle nested compositions
  * transaction-manager: special case composition of unknown operations
  * types.d.ts: add missing type declarations
  * package: bump "wpcom.js" to v0.2.4

0.6.1 / 2014-10-31
==================

  * editor: fix silly variable mistake

0.6.0 / 2014-10-31
==================

  * editor: rename "before publish" event to just "publish"
  * editor: remove "editor-detect-title" plugin
  * editor: consider BLOCKQUOTEs as content as well
  * editor: remove `toHTML()`/`toHtml()` for now
  * editor-link-tooltip: don't render link tooltip when cursor is collapsed at the end of a link
  * editor-link-tooltip: remove noisy debug() call
  * editor-link-tooltip: collapse the Range after form submit
  * reset: apply `text-decoration: underline` to A link elements

0.5.5 / 2014-10-30
==================

  * Makefile: add explicit `browserify-single-file`, `styl`, `tsify` and `browserify-jade` install rules
  * package: remove unused "jade" dependency
  * *: update "range-normalize" to v1.0.0
  * *: update "debug" to v2.1.0
  * editor: update "native-command" to v0.2.1
  * editor: update "header-command" to v1.0.1
  * editor: update "blockquote-command", "outdent-command", and "indent-command"
  * editor: make sure editor style also gets used inside html blocks
  * editor: use new pasted api
  * editor: use a TextNode iterator approach for checkEmpty()
  * editor: use new pasted api
  * editor: update "editor-detect-title" to v0.0.4
  * editor: blacklist "overlay-reference" DIVs in checkEmpty()
  * editor: add a < 2 childNodes fast check to checkEmpty()
  * editor: add styles for tables
  * editor: split styles to fix html-blocks
  * editor-link-tooltip: sanitize link before executing `createLink` command
  * editor-normalizer: fix retry logic in misplaced root node normalization
  * editor-normalizer: fix a bug where normalization was attempted in orphaned nodes
  * editor-toolbar: remove unused dependencies
  * editor-keyboard-shortcuts: remove explicit Range normalization logic
  * html-block: add icon
  * pasted: normalize inline elements
  * pasted: add /mono/ regexp
  * pasted: allow sub and sup
  * pasted: add average size based heading detection
  * pasted: remove extraneous console.log call
  * pasted: include font element in unwrapped elements
  * pasted: allow del element
  * pasted: add underline and line-through detection
  * pasted: detect code via monospaced font whitelist
  * pasted: allow code element
  * pasted: add logic to replace styling with em and strong tags
  * pasted: fix allowed h tags
  * pasted: create fragment
  * pasted: bump dom-paste
  * pasted: reintegrate html-pipe into new paste logic
  * pasted: change api to use dom-paste
  * pasted: use dom-paste
  * pasted: wrap unknown elements in html blocks
  * reset.css: take tables into account

0.5.4 / 2014-10-28
==================

  * add `editor detect title` plugin
  * emit `before publish` event
  * add toHTML alias method
  * move `tasks` handler from `media-controller` to `editor`
  * add editor#getParam() and editor#setParam() methods

0.5.3 / 2014-10-24
==================

  * editor: remove throttle call
  * editor-link-tooltip: attempt to call `tip.hide()` manually
  * editor-tip: don't add the "click outside" handler by default
  * example: log the "selectionchange" and "contentchange" events for now
  * *: use npm's copy of "inserted" module
  * sandbox: update "iframify" to v0.1.2
  * post-serializer: only get the "data-id" attr from Element nodes
  * package: update "npm-deps" to v0.3.6

0.5.2 / 2014-10-22
==================

  * package: update "npm-deps" to v0.3.1
  * Revert "npm-deps, package-base.json stuff..."

0.5.1 / 2014-10-21
==================

  * Makefile: pin "npm-deps" version to v0.3.1
  * package-base: remove "npm-deps" as a dependency
  * gitignore: ignore the root-level package.json file
  * move package.json to package-base.json
  * *: use npm's "dataset" module
  * types: add "dataset" npm module type definition
  * dataset: remove component

0.5.0 / 2014-10-21
==================

  * block: use margin consistent with paragraphs
  * block: use dataset module
  * block-gallery: add #listenUploading()
  * block-gallery: render single image markup
  * block-gallery: add #html() method
  * block-gallery: update `upload` entry event
  * block-gallery: render single image like gallery
  * block-gallery: fix assigning with entry property
  * block-gallery: wait uploaded img to print it
  * block-gallery: refresh new gallery from entry
  * block-gallery: add expection when drop single img
  * dataset: add module for dataset
  * editor: bump drag element dependency version, fixing ie bug
  * editor: remove "underline" command from formatbar
  * editor: scroll media block into view
  * editor: wait until pending tasks are done before publish
  * editor: add new block insertion logic
  * editor: remove #load(). Add #toHtml()
  * editor: rename renderContent() to toHtml()
  * editor: store editor.parser handler
  * editor: add #load() to load html content
  * editor: refact publish -> emit `update` or `add`
  * editor: use MutationObserver shim
  * editor-overlay: make padding overlay hack conditional
  * editor-overlay: use dataset module
  * editor-overlay: read margin of correct element
  * editor-overlay: add note about hack
  * editor-overlay: use padding instead of height
  * editor-normalizer: make selection restore hack conditional
  * editor-normalizer: delete empty root elements instead of adding BR to them
  * editor-normalizer: preserve br chains
  * editor-normalizer: use MutationObserver shim
  * editor-normalizer: use dataset module
  * editor-toolbar: use dataset module
  * example: use remote fonts
  * gallery: emit entry uploading events
  * gallery: rename counter to uploading_counter
  * gallery: move function setEntrySize() as method
  * gallery: use dataset module
  * gallery: initialize event on legacy DOM 3 way as a fallback
  * gallery-entry: simplify uploading event names
  * gallery-entry: add opacity when img is uploading
  * gallery-entry: add styles for markup
  * gallery-entry: minor debug line change
  * hacks: add code for triggering browser-specific hacks
  * input-normalizer: Handle delete on list items.
  * input-normalizer: handle joining two lists
  * input-normalizer: wrap operation in transaction
  * input-normalizer: handle enter in empty list items
  * input-normalizer: handle case where previous element is a list
  * input-normalizer: use br elements for the newlines
  * input-normalizer: add select around mode
  * input-normalizer: fix bug when overlay ref is before paragraph
  * input-normalizer: check for end of a blank element
  * input-normalizer: check for next node presence
  * is: add logic to detect empty list items
  * is: also account for ordered lists in check
  * is: add list check
  * media-controller: return media block in #addMedia()
  * media-controller: emit `tasks done` event
  * media-controller: hanlding gallery uploading tasks
  * mutation-observer: add MutationObserver shim for old IE
  * post-parser: store images into media object
  * post-parser: add #result() method
  * post-parser: remove unused htmlString var
  * post-serializer: use dataset module
  * transaction-manager: user MutationObserver shim
  * types.d.ts: add type definitions for bowser module
  * Revert "Use `\n` newlines everywhere"

0.4.0 / 2014-10-03
==================

  * block-gallery: switch between stack and square
  * editor: adjust btn
  * editor: default the `backward` property to false
  * editor: add type info for the `backward` boolean
  * editor: add the "selectionchange" event to the TypeScript definition
  * editor: update "link-command" to v1.2.1
  * editor: mount the `EditorSelectionchange` plugin
  * editor: add `selection` property to definition
  * editor: use `<del>` for the "strikethrough" command
  * editor: add keyboard shortcut to "title" on strikethrough command
  * editor: add "code" button to formatbar
  * editor: rename `shortcut` variable to `command`
  * editor: add a lot more keyboard shortcut mappings
  * editor: don't hard-code the font-side for `code` elements
  * editor: update "wrap-command" to v1.0.1
  * editor: add "code" wrap command
  * editor: use WrapCommand for "strikethrough" command
  * editor: update "wrap-command" to v1.0.0
  * editor: use "wrap-command" for bold, italic, and underline
  * editor: use "outdent-command" module
  * editor: update the HTML debugger after "contentchange" event
  * editor: reset() uses a `\n` newline instead of a <br>
  * editor: fix publish() being called with no arguments
  * editor: remove "show-placeholder" delay logic
  * editor: add a slight left padding to the placeholder
  * editor: set <button> for add media button
  * editor: update "indent-command" to v2.1.0
  * editor: update "blockquote-command" to v1.3.0
  * editor: fix jumpy header dropdown arrow
  * editor: remove "ErrorScreen" module usage
  * editor: update "indent-command" to v2.0.2
  * editor: update "blockquote-command" to v1.2.2
  * editor: use "current-selection"
  * editor-normalizer: use `childNodes` instead of `children`
  * editor-normalizer: remove `editor.el.normalize()` call on every selection change
  * editor-normalizer: use `\n` text node instead of <br> elements
  * editor-normalizer: remove weird `while (!ready)` loop
  * editor-normalizer: remove unused `BLOCK_ELEMENTS` array
  * editor-link-tooltip: remove hacky event listeners
  * editor-link-tooltip: disable the IE input X button
  * editor-toolbar: just rely on the "contentchange" and "selectionchange" events
  * editor-toolbar: don't explicitly pass in a normalized Range
  * editor-toolbar-tooltips: remove hacky event listeners
  * editor-selectionchange: add a `backward` boolean to the editor
  * editor-selectionchange: initial commit of module
  * error-screen: remove component
  * example: remove redundant `publish()` logic
  * example: re-add publish menu option
  * example: add "error" event handler
  * example: re-add publish menu option
  * example: go directly to auth page upon Logout
  * gallery: add missed semicolon
  * gallery: remove setLayoutFromEntriesCount() method
  * gallery: pass `prev` and `current` parameters
  * gallery-entry: add `draggable` attribute
  * gallery-entry: not drag single image
  * gallery-entry: remove `draggable` in single image
  * html-debugger: remove unused "mutation-observer" dep
  * html-debugger: remove `throttle()`
  * input-normalizer: remove .styl file
  * input-normalizer: always use \n instead of <br> for Enter keypresses
  * input-normalizer: add debug() call
  * input-normalizer: add breakline in start position
  * input-normalizer: hide tmp carte ghost element
  * input-normalizer: create tmp dom element once
  * input-normalizer: define elements once
  * input-normalizer: insert <br> in beginning
  * input-normalizer: insert `<br>` in end position
  * input-normalizer: remove start to listen shift key
  * input-parser: add hack to move into the editable
  * is: make `emptyParagrah()` and `emptyOverlayReference()` work with `\n` newlines
  * package: bump wpcom@2.2.0
  * post-parser: whitelist `<code>` elements
  * post-parser: remove the `<br>s` from content
  * post-parser: finally remove all `\n`
  * post-parser: remove line breaks from the content
  * post-parser: improve regex url detection
  * post-parser: allow https protocol detection
  * post-parser: render urls string to anchor elements
  * post-serializer: correct comment line
  * post-serializer: wp.com dones't use `<br>`
  * post-serializer: not define twice the same var
  * reset: render line-through for `<s>` and `<del>` tags
  * sandbox: use a8c fork of iframify for now
  * tokenizer: remove "tokens" after replacement
  * tokenizer: remove unused `rid` and `rurl` RegExps
  * tokenizer: use numbers instead of booleans
  * tokenizer: emit "error" event when embeds/shortcodes don't load
  * tokenizer: fix `debug` scope name typo
  * types: add "selection-is-backward" type definition
  * types: add "get-document", "selectionchange-polyfill", and "within-element" declarations
  * types: remove unused "component-emitter" module declaration
  * *: use Node.js core "events.EventEmitter"
  * *: update "per-frame" to v3.0.0

0.3.1 / 2014-09-17
==================

  * editor: add media `+` media button in formatbar
  * input-normalizer: transform tokens on enter
  * editor-normalizer: rely on the editor's tokenizer
  * editor: use tokenizer
  * tokenizer: fix build, readd replace method
  * tokenizer: rename shortcodes module, add tokens
  * transaction-manager: use frozen-range component
  * editor-link-tooltip: handle ESC key closing tooltip
  * editor-link-tooltip: add "disabled" state to the done checkmark
  * include Noticons on the standalone example
  * error-screen: add error screen

0.3.0 / 2014-09-10
==================

  * editor: emit `contentchange` event
  * editor: make the "link" and "unlink" icons be 120% font size
  * editor: use Fontello "link" and "unlink" icons
  * editor: removing () and adjust titles
  * editor: fix selection bug in safari
  * editor: fix more inline els
  * editor: reset content on edit
  * editor: add shortcut to toggle grid display
  * editor: fix grid bug in inline elements
  * editor: update "blockquote-command" to v1.2.1
  * editor: update "link-command" to v1.1.1
  * editor: update "indent-command" to v2.0.0
  * editor: re-enable "editor-link-tooltip" as a plugin
  * editor: fix formatbar for reset, try `position: sticky`
  * editor: make editor conform to a typographic grid
  * editor-overlay: snap overlays to grid
  * editor-overlay: use css transforms
  * editor-link-tooltip: add basic "javascript:" protocol filtering
  * editor-link-tooltip: always use `doc` document ref
  * editor-link-tooltip: use "unwrap-node" for removing A links
  * editor-link-tooltip: remove `.automattic-editor-wrapper` prefix
  * editor-link-tooltip: empty the `<input>` upon a new link
  * editor-link-tooltip: refactor to be an Editor plugin
  * editor-tip: remove trailing whitespace
  * editor-toolbar: use "range-normalize" for Commands
  * editor-toolbar: update button states on "click" and "dblclick"
  * example: update "fontello" build to use new "wpeditor" font name build
  * example: fix wpeditor.css font url() locations
  * example: remove local copy of "Dashicons"
  * example: use wp.com's copy of Dashicons
  * gallery: fix drag and drop individual images to create new galleries
  * gallery: fix block param bug
  * gallery: remove optional `block` parameter
  * gallery: add #setLayoutFromEntriesCount() method
  * gallery: re-emit `change gallery drop` entry event
  * gallery-block: create a gallery from dropped entry
  * gallery-entry: remove unsed `ondrop` method
  * block: add height transition
  * block: fix flash on load
  * block: rename el var using camelCase
  * block: bind `delete` button with #onremove() mtd
  * block-controls: swap alignment icons
  * block-gallery: pass entry.id when a new is created
  * block-gallery: moving entries between galleries
  * block-gallery: no pass this instance to Gallery()
  * block-gallery: change entry of galleries
  * block-gallery: remove listening gallery events
  * block-gallery: check if current entry is defined
  * block-gallery: check current entry changes
  * block-gallery: store `current_entry` in global var
  * block-gallery: listen current dragging entry
  * block-gallery: remove unnecessary transparency
  * block-gallery: destroy dragged entry
  * block-gallery: add dragged entry to new gallery
  * block-gallery: create GalleryBlock from drop `el`
  * block-gallery: bind `empty drop` gallery event
  * gallery-entry: emit `drag start` and `drag end`
  * Makefile: remove `--cache-min` npm flag
  * add `reset.css` Editor-specific CSS reset
  * gallery: pass optional `block` param to construct
  * gallery: listen `drop` and `empty drop` events
  * gallery: refact -> add #destroy() method
  * gallery: emit `empty drop` event
  * gallery-block: set `stack` layout for new gallery
  * gallery-entry: listen `drop` event from gallery el
  * gallery-entry: emit `change drop` event
  * gallery-entry: check id exists a dragged entry
  * gallery-entry: listen `drop` over `drags` entries
  * gallery-entry: pass drop `el` in `drop` emission
  * gallery-entry: allow drop in document.
  * transaction-manager: remove timer based hack and use proper check
  * transaction-manager: fix possible source of race condition
  * transaction-manager: pass extra parameter to command
  * transaction-manager: handle range parameter in command
  * transaction-manager: add an optional parameter to undo/redo methods
  * transaction-manager: use new range approach
  * types: fix "current-range" and "current-selection" definitions
  * html-debugger: listen on "contentchange" event directly

0.2.0 / 2014-09-03
==================

  * block: remove min-height
  * block: remove negative margin in overlay reference
  * block: add appear animation
  * block: remove margins from overlay
  * block-embed: add transition to iframe height
  * editor: fix bad `editor.el` reference
  * editor: check if post param is an object
  * editor: remove stopImmediatePropagation() call
  * editor-normalizer: fix blockquotes
  * input-normalizer: remove range-normalize dependency
  * input-normalizer: add range-position
  * input-normalizer: add leaf-range algorithm
  * input-normalizer: properly handle more delete cases
  * sandbox: update to iframify 0.0.2

0.1.2 / 2014-09-01
==================

  * post-serializer: fix serialization of quotes in text nodes
  * add .d.ts files for all JS modules
  * block: consume Emitter as a typescript module
  * types.d.ts: add types file
  * input-normalizer: upgrade range-normalize
  * input-normalizer: fix trailing whitespace
  * editor: remove `yields/k`, make `mousetrap` an prop of Editor
  * post-parser: add non breaking space logic
  * editor: reset post on .reset() call
  * editor-keyboard-shortcuts: adapt to new api
  * editor-keyboard-shortcuts: update mousetrap version
  * editor: update "blockquote-command" to v1.0.1
  * editor: use "blockquote-command" module
  * editor: use the native "indent" and "outdent" commands for now
  * editor: use "header-command" module
  * block: disable 3d rotation effect
  * post-serializer: wrap root level text nodes in p tags
  * post-serializer: only replace first/last spaces when no siblings are present
  * post-serializer: add &nbsp; on save
  * example: print out the Editor version number
  * editor: remove "scribe" properly declaration
  * editor-normalizer: add missing parameter
  * editor-normalizer: suppress normalization during composition
  * transaction-manager: add missing parameter
  * input-normalizer: move event binding to input-normalizer
  * transaction-manager: add frozen range
  * html-debugger: fix observing in wrong element
  * Makefile: cache npm modules for 1 week
  * input-normalizer: use current-selection component
  * editor-normalizer: use current-selection component
  * Makefile: remove deamdify
  * editor: fix vim limbo edit
  * font-loader: convert weight to string
  * editor: preload fonts
  * font-loader: allow instancing without new
  * font-loader: add font loader
  * editor: use white-space pre-wrap
  * editor-normalizer: use current-range
  * input-normalizer: use current-range
  * input-normalize: fix wrong module name
  * transaction-manager: fix grammar
  * editor-link-tooltip: use "unwrap-node" module
  * input-normalizer: add comments
  * input-normalizer: fix firefox caret bug
  * Makefile: remove deamdify
  * editor-normalizer: handle persistent BR in firefox
  * input-normalizer: normalize enter inside element
  * editor: switch to new command syntax
  * editor-keyboard-shortcuts: use mousetrap
  * editor: create overlay manager with editor instance
  * editor-overlay: take Editor instead of HTMLElement
  * shortcodes: wrap shortcode ops in transactions
  * input-normalizer: replace scribe calls with transaction manager calls
  * editor: declare transaction manager in interface
  * transaction-manager: add transaction manager
  * editor-commands: remove module
  * editor: re-enable the native "strikethrough" command
  * editor-toolbar: properly get the Range from the current Selection
  * add `command.d.ts` file for the Command interface
  * editor-keyboard-shortcuts: convert to TypeScript
  * editor-normalizer: add note about uppercase
  * editor: comment remaining call to transactionManager
  * editor-overlay: hide overlays by default upon add
  * editor-normalizer: normalize empty paragraphs
  * editor-toolbar-tooltips: refactor to be an Editor plugin
  * editor-keyboard-shortcuts: refactor for Commands interface usage
  * editor: add "native-command" as a dependency
  * editor-normalizer: add empty editor check
  * editor: remove the scribe dep

0.1.1 / 2014-08-26
==================

  * editor: use npm's copy of "drag-element@0.4.2"
  * package: make "browserify" be a dev dependency
  * package: update "browserify" to v5.10.1
  * editor-link-tooltip: less fragile code to get `form` reference
  * block-gallery: allow save an empty gallery
  * Makefile: use `browserify-jade` transform to compile .jade files
  * Makefile: use "tsify" browserify plugin to compile TypeScript files
  * Makefile: remove the `node_modules/*` helper rules
  * Makefile: enable browserify source maps for "example" app
  * gallery: set order when an entry is removed
  * gallery: rename #entryOrder() by #injectEntry()
  * block-controls: update control icon codes
  * gallery-entry: reduce delete button margin
  * gallery-entry: remove active bgc in circle layout
  * example: update fontello icon set file

0.1.0 / 2014-08-18
==================

  * package: update `npm-deps` to v0.2.0
  * package: use "preinstall" phase for the `make` task
  * example: make `wpcom` and `editor` be globals
  * example: load proper font weights and styles
  * is: add empty overlay reference check code
  * i18n: add null i18n implementation
  * editor-overlay: add placeholder `<br>` element
  * editor-normalizer: do not convert shortcode into block if cursor is inside paragraph
  * editor: add typescript definition of API
  * editor: add optional i18n parameter
  * editor: correctly remove placeholder `<br>` in all scenarios
  * editor: correctly handle overlay reference deletion
  * editor: attempting to have more explicit styling for Calypso
  * editor: fix H1 button styling
  * editor: remove trailing semicolons
  * editor: use non-colliding class name for "H1" header dropdown button
  * editor: use "show-placeholder" as class name
  * editor: ignore keypresses with unwanted modifers
  * editor: allow inserting a paragraph before the block
  * editor: wrap dom manipulations in transaction manager calls
  * editor: add handling of keyboard edge-cases
  * editor: remove trailing whitespace
  * editor: add empty `<p><br></p>` so that the editor remains focusable
  * editor: fix web font weights
  * gallery: continued improvements to the `gallery` shortcode
  * block-embed: include scripts
  * shortcodes: allow `_` underscore for markdown bold and italic
  * shortcodes: handle markdown-styled formatting
  * shortcodes: remove vestigial youtube code
  * shortcodes: special-case twitter block
  * shortcodes: add special handling for vimeo

0.0.1 / 2014-08-01
==================

  * Initial release!
