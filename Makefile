.DEFAULT_GOAL := build

clean:
	rm -r build

build: prepare
	./build.bash

prepare: 
	./prepare.bash

firefox:
	firefox 'about:debugging#/runtime/this-firefox'

bump-minor:
	./version_bump.py minor

bump-middle:
	./version_bump.py middle

bump-major:
	./version_bump.py major

prettier:
	prettier -w shared chromium firefox

.PHONY: clean prepare build bump-minor bump-middle bump-major firefox
