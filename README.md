# FurAdder
A [furbooru.org](https://furbooru.org) image extractor and uploader.

**This extension is still in development.** If you would like to give feature recommendations,
please create an issue, or thumbs-up an existing issue!

![screenshot_v0.3](media/screenshot_v0.3.png)

## Features
* Autofills the upload and fetch forum on furbooru.org.
* Extracts artist name (when available) and applies appropriate aliasing.
* Extracts highest resolution version from the page.
* Allows tag presets for faster uploading.
* Forces a rating tag so you won't forget.
* Universal extraction (pull images from any site!).

## Intelligently Supported Sites
* twitter.com
* derpibooru.org

## In Progress Sites
* deviantart.com
* furaffinity.net

The above can still be extracted using the universal extractor, but it won't
be as intelligent.

## Build Instructions

```bash
git clone https://github.com/CrystalSplitter/Furadder furadder && cd furadder
make build  # This generates the actual source in build/
```

## Legalese
This extension is independently developed, and not an official project of furbooru.org.
