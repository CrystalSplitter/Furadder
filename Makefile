.default: build

build:
	./build.bash

clean:
	rm -rf build/

firefox:
	firefox 'about:debugging#/runtime/this-firefox'

bump-minor:
	./version_bump.py minor

bump-middle:
	./version_bump.py middle

bump-major:
	./version_bump.py major

.PHONY: clean build bump-minor bump-middle bump-major firefox
