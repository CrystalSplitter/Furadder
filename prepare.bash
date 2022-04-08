#!/bin/bash -eux

TARGET_DIR='build'
SHARED_SRC='shared'
CHROMIUM_SRC='chromium'
FIREFOX_SRC='firefox'
POLYFILL_PATH='third_party/mozilla_browser_polyfill_0.9.0/browser-polyfill.js'

for target in chromium firefox; do
  mkdir -p "${TARGET_DIR}/${target}" || true
  cp -ru "${SHARED_SRC}"/* "${TARGET_DIR}/${target}"
  cp -ru "${target}" "${TARGET_DIR}/"
  mkdir -p "${TARGET_DIR}/${target}/background_scripts/third_party" || true
  mkdir -p "${TARGET_DIR}/${target}/popup/third_party" || true
  mkdir -p "${TARGET_DIR}/${target}/content_scripts/third_party" || true
  cp -u "${POLYFILL_PATH}" "${TARGET_DIR}/${target}/background_scripts/third_party"
  cp -u "${POLYFILL_PATH}" "${TARGET_DIR}/${target}/popup/third_party"
  cp -u "${POLYFILL_PATH}" "${TARGET_DIR}/${target}/content_scripts/third_party"
done
