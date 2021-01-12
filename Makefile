.default: build

build:
	./build.bash

clean:
	rm -rf build/

bump-minor:
	./version_bump.py minor

bump-middle:
	./version_bump.py middle

bump-major:
	./version_bump.py major

.PHONY: clean
