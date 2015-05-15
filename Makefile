
# Get Makefile directory name: http://stackoverflow.com/a/5982798/376773.
# This is a defensive programming approach to ensure that this Makefile
# works even when invoked with the `-C`/`--directory` option.
THIS_MAKEFILE_PATH:=$(word $(words $(MAKEFILE_LIST)),$(MAKEFILE_LIST))
THIS_DIR:=$(shell cd $(dir $(THIS_MAKEFILE_PATH));pwd)

# BIN directory
BIN := $(THIS_DIR)/node_modules/.bin

# applications
NODE ?= node
NPM ?= $(NODE) $(shell which npm)
STYL ?= $(NODE) $(BIN)/styl
BROWSERIFY ?= $(NODE) $(BIN)/browserify
BROWSERIFY_FLAGS ?= --debug
BABEL ?= $(NODE) $(BIN)/babel
ZUUL ?= $(NODE) $(BIN)/zuul
WR ?= $(NODE) $(BIN)/wr
SERVE ?= $(NODE) $(BIN)/serve
PARALLELSHELL ?= $(NODE) $(BIN)/parallelshell
BROWSERIFY_SINGLE_FILE ?= $(NODE) $(BIN)/browserify-single-file

# source files
JADE_FILES := $(wildcard lib/*/*.jade plugins/*/*.jade)
STYL_FILES := $(wildcard lib/*/*.styl plugins/*/*.styl)
JS_FILES := $(wildcard lib/*/*.js plugins/*/*.js)
ES6_FILES := $(wildcard lib/*/*.es6 plugins/*/*.es6)
TS_FILES := $(filter-out $(wildcard lib/*/*.d.ts plugins/*/*.d.ts), $(wildcard lib/*/*.ts plugins/*/*.ts))

# compiled files
COMPILED_FILES := $(JADE_FILES:.jade=.jadejs) $(TS_FILES:.ts=.tsjs) $(ES6_FILES:.es6=.es6js) $(STYL_FILES:.styl=.styl.css)
CSS_FILES := $(STYL_FILES:.styl=.styl.css) $(filter-out $(wildcard lib/*/*.styl.css), $(wildcard lib/*/*.css))

# for gh-pages
LOCAL_CLIENT_ID=36059
GH_PAGES_CLIENT_ID=34793
GH_PAGES_TMP=/tmp/editor_gh_pages

# prevents `npm install` "infinite recursion"
export INSIDE_MAKE=1

# default rule
build: node_modules $(COMPILED_FILES) editor.css

# alias to the `node_modules` rule
install: node_modules

# helper rules to ensure that the `styl` / `tsify` /
# `browserify-single-file`, etc. commands are installed
node_modules/browserify-single-file: node_modules

node_modules/styl: node_modules

node_modules/tsify: node_modules

node_modules/babel: node_modules

node_modules/browserify-jade: node_modules

node_modules/parallelshell: node_modules

node_modules/serve: node_modules

node_modules/wr: node_modules

# ensures that the `node_modules` directory is installed and up-to-date with
# the dependencies listed in the "package.json" file.
node_modules: package.json
	@$(NPM) install
	@touch node_modules

# compile all *.jade template files into *.jadejs files usable from the
# client-side through browserify. Note that we could also simply use the
# `jadeify` transform, however then we lose the `mtime` benefits of make
%.jadejs: %.jade node_modules/browserify-single-file node_modules/browserify-jade
	@printf '\e[1;36m %-10s\e[m %s > %s\n' "jade" "$<" "$@"
	@$(BROWSERIFY_SINGLE_FILE) --transform browserify-jade $< > $@

# compile all *.styl CSS preprocessor files into *.styl.css files, which is
# what the `editor.css` rule relies on to concat the final CSS bundle
%.styl.css: %.styl node_modules/styl
	@printf '\e[1;35m %-10s\e[m %s > %s\n' "styl" "$<" "$@"
	@DEBUG= $(STYL) --whitespace < $< > $@ # note: have to reset DEBUG otherwise styl outputs some junk
	@echo >> $@ # ensure trailing \n

# compile all *.ts Typescript files into *.js files
%.tsjs: %.ts node_modules/tsify types.d.ts
	@printf '\e[1;32m %-10s\e[m %s > %s\n' "typescript" "$<" "$@"
	@$(NODE) -pe "(new (require('tsify/lib/Tsifier'))({ target: 'ES5' })).getCompiledFile('$<')" > "$@"

# compile all *.es6 ECMAScript 6 files into *.js files
%.es6js: %.es6 node_modules/babel
	@printf '\e[1;93m %-10s\e[m %s > %s\n' "babel" "$<" "$@"
	@$(BABEL) "$<" --source-maps-inline --optional runtime --experimental > "$@"

# concats all the built `*.styl.css` CSS files
editor.css: reset.css node_modules $(CSS_FILES)
	@printf '\e[1;93m %-10s\e[m %s\n' "concat" "editor.css"
	@cat reset.css $(wildcard $(shell node -pe "require('path').dirname(require.resolve('component-tip'))")/*.css) $(CSS_FILES) > $@

# bundle the `*.js` files into the `bundle.js` file
example/bundle.js: example/app.js node_modules $(COMPILED_FILES) $(JS_FILES)
	@printf '\e[1;93m %-10s\e[m %s\n' "browserify" "$@"
	@$(BROWSERIFY) \
		--extension=.jadejs \
		--extension=.tsjs \
		--extension=.es6js \
		$(BROWSERIFY_FLAGS) \
		example/app.js \
		> $@

watch: node_modules/parallelshell
	@$(PARALLELSHELL) "$(MAKE) example-server" "$(MAKE) example-watch"

example-server: node_modules/serve editor.css example/bundle.js
	@$(SERVE) --port 8888 "$(THIS_DIR)"

# spawn a watcher to rebuild the files for the `example` dir
# whenever a source file changes
example-watch: node_modules/wr
	@$(WR) --chime 0 "$(MAKE) example" example/ lib/ plugins/ *.js *.css

# helper rule
example: editor.css example/bundle.js

# the `clean` rule deletes all the files created from `make build`
clean:
	rm -f editor.css \
		example/bundle.js \
		$(COMPILED_FILES)

clean-typescript:
	rm -f $(TS_FILES:.ts=.tsjs)

clean-jade:
	rm -f $(JADE_FILES:.jade=.jadejs)

clean-styl:
	rm -f $(STYL_FILES:.styl=.styl.css)

# the `distclean` rule deletes all the files created from `make install`
distclean:
	rm -rf node_modules

gh-pages: example
	@-git checkout -- package.json
	rm -rf $(GH_PAGES_TMP) \
		&& mkdir -p $(GH_PAGES_TMP) \
		&& rsync -rL example/* $(GH_PAGES_TMP) \
		&& sed -i.bak 's/$(LOCAL_CLIENT_ID)/$(GH_PAGES_CLIENT_ID)/' $(GH_PAGES_TMP)/bundle.js \
		&& rm -f $(GH_PAGES_TMP)/bundle.js.bak \
		&& git checkout gh-pages \
		&& git fetch \
		&& git reset --hard origin/gh-pages \
		&& rm -rf * \
		&& rsync -rL $(GH_PAGES_TMP)/* . \
		&& echo "now run 'git add . && git commit -v'"

# run `dox --api` to generate API docs for the Readme.md files for each submodule
%/Readme.md: %/index.js node_modules
	$(eval OUTPUT := $(shell node -pe "require('fs').realpathSync('$@')"))
	@printf '\e[1;35m %-10s\e[m %s > %s\n' "dox --api" "$<" "$(OUTPUT)"
	@perl -0777 -i.bak -pe 's/API\n---.*/API\n---\n\n/igs' "$(OUTPUT)" \
		&& dox --api < "$<" >> "$(OUTPUT)" \
		&& rm "$(addsuffix .bak,$(OUTPUT))"

docs: $(addsuffix Readme.md,$(dir $(JS_FILES)))

test:
	@if [ "x$(BROWSER_NAME)" = "x" ]; then \
		$(MAKE) test-local; \
		else \
		$(MAKE) test-zuul; \
	fi

test-local:
	@$(ZUUL) --local --ui mocha-bdd lib/*/test/*.js

test-zuul:
	@$(ZUUL) \
		--uimocha-bdd \
		--browser-name $(BROWSER_NAME) \
		--browser-version $(BROWSER_VERSION) \
		--browser-platform "$(BROWSER_PLATFORM)" \
		lib/*/test/*.js; \
	fi


.PHONY: install build example clean clean-typescript clean-jade clean-styl distclean gh-pages docs test test-local test-zuul watch example-server example-watch
