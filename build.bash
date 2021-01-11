#!/usr/bin/env bash
echo 'Adding:'
files=$(find background_scripts content_scripts icons media popup manifest.json -type f)
echo "$(echo "$files" | tr ' ' '\n' | awk '{print "  " $1}')"
7z a build/FurAdder.xpi $files -r
