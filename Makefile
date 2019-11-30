.PHONY: all zip xpi dev test clean


all: zip xpi

zip:
	yarn run clean
	yarn run build
	yarn run build-zip

xpi:
	yarn run clean
	yarn run build:gecko
	yarn run build-zip
	yarn run build-xpi

dev:
	yarn run clean
	yarn run build:dev:gecko
	yarn run build-zip
	yarn run build-xpi

doc:
	doxygen doxygen/Doxyfile

test:
	yarn run test

clean:
	yarn run clean
