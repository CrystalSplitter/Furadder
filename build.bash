#!/bin/bash -eu
echo 'Adding:'

TARGET_DIR='build'

build_firefox_addon() {
  pushd "${TARGET_DIR}/firefox" >> /dev/null
  files="$(find background_scripts content_scripts icons popup manifest.json -type f)"
  echo "$(echo "$files" | tr ' ' '\n' | awk '{print "  " $1}')"
  7z a artifact/FurAdder.xpi $files -r
  popd >> /dev/null
}

build_chromium_addon() {
  pushd "${TARGET_DIR}/chromium" >> /dev/null
  files="$(find background_scripts content_scripts icons popup manifest.json service_worker.js -type f)"
  echo "$(echo "$files" | tr ' ' '\n' | awk '{print "  " $1}')"
  7z a -tzip artifact/FurAdder.zip $files -r
  popd >> /dev/null
}

build_firefox_addon
build_chromium_addon
