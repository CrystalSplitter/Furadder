#!/bin/bash -eu

TARGET_DIR='build'

die() {
  echo "${1}" >&2
  exit 1
}

transpile() {
  tsc -p "${TARGET_DIR}/firefox/tsconfig.json"
  tsc -p "${TARGET_DIR}/chromium/tsconfig.json"
}

build_firefox_addon() {
  pushd "${TARGET_DIR}/firefox" >> /dev/null
  files="$(find background_scripts content_scripts fonts icons popup options universal_utils svg manifest.json -type f ! -name "*.ts" )"
  echo "$(echo "$files" | tr ' ' '\n' | awk '{print "  " $1}')"
  7z a artifact/FurAdder.xpi $files -r
  popd >> /dev/null
}

build_chromium_addon() {
  pushd "${TARGET_DIR}/chromium" >> /dev/null
  files="$(find background_scripts content_scripts fonts icons popup options universal_utils svg manifest.json service_worker.js -type f ! -name "*.ts")"
  echo "$(echo "$files" | tr ' ' '\n' | awk '{print "  " $1}')"
  7z a -tzip artifact/FurAdder.zip $files -r
  popd >> /dev/null
}

[[ -d "${TARGET_DIR}/firefox" ]] || die "${TARGET_DIR}/firefox does not exist. Run ./prepare.bash first."
[[ -d "${TARGET_DIR}/chromium" ]] || die "${TARGET_DIR}/chromium does not exist. Run ./prepare.bash first."

transpile
build_firefox_addon
build_chromium_addon
