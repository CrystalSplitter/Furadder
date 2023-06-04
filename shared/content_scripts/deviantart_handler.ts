(() => {
  /*
  Copied from: https://gist.github.com/micycle1/735006a338e4bea1a9c06377610886e7,
  reproduced below to preserve this knowledge.

  for direct image URL, the image quality is much lower than the original upload
  (the resolution and size of the original upload can be found in the right sidebar).
  This is not the case few years ago when the original image was accessible through
  right click, but on 2017,
  [Wix](https://www.wix.com/) acquired DeviantArt, and has been migrating the images
  to their own image hosting system from the original DeviantArt system.
  They linked most of the direct images to a stripped-down version of the original
  images; hence the bad image quality.
  Below are the three different formats of direct image URLs I found:
    - URL with `/v1/fill` inside: this means that the image went through Wix's
      encoding system and is modified to a specific size and quality.
      In this case, you remove `?token=` and its values, add `/intermediary` in
      front of `/f/` in the URL, and change the image settings right
      after `/v1/fill/` to `w_5100,h_5100,bl,q_100`. The definitions of the values
      can be found in
      [Wix's Image Service](https://support.wixmp.com/en/article/image-service-3835799),
      but basically, `w_5100,h_5100` requests the width and height of the image to be
      5100x5100 pixels, `bl` requires the baseline JPEG version, and `q_100` sets the
      quality to 100% of the original. The reasons to have this dimension are: (1) 5100
      pixels is the limit of the system; anything above it will result in
      `400 Bad Request`. (2) according to the Wix's API:

      > In case the required image is larger than the original,
      > upscale should be enabled (lg_1) in order for a proportional upscale
      > to be applied. If upscale is not enabled,
      > **the returned image will maintain the original size**.

      The original url has a file size of 153 KB and 1024x1280 resolution, while
      the modified URL has a file size of 2.03 MB and 2190x2738 resolution.
      The result is still not as good as the
      [original upload](https://www.deviantart.com/guweiz/art/Lantern-745215143)
      (4.2 MB and 2700×3375 resolution), but this is the closest I can get
      **UPDATE**: for new uploads, this trick no longer works. However, the image
      quality can still be changed. To do this, you
      keep everything in the image URL the same and change the part `q_\d+,strp`
      to `q_100`

    - URL with `/f/` but no `/v1/fill` inside: this is the original image, so just
      download it
    - URL with `https://img\d{2}` or `https://pre\d{2}`:this means that the image
      went through DeviantArt's system and is modified to a specific size. I
      could not figure out how to get the original image from these types of links,
      i.e. find `https://orig\d{2}` from them, so I just download the image as is
  */

  const WIXMP_REGEX =
    /http(s)?:\/\/images-wixmp-(.*)\.wixmp\.com\/(.*)\.(\w+)\?.*/;
  const QUALITY_REGEX = /w_\d+,h_\d+,q_\d+/;

  async function imageExtractor(general: boolean): Promise<ImageObj[]> {
    const allLocalImages = genericImageExtractor(general);
    let wixMatch: RegExpMatchArray | null = null;
    for (let i = 0; i < allLocalImages.length; i++) {
      const potentialMatch = allLocalImages[i].src?.match(WIXMP_REGEX);
      if (potentialMatch != null) {
        wixMatch = potentialMatch;
        break;
      }
    }
    if (wixMatch != null) {
      const result = await attemptHigherRes(wixMatch);
      if (result != null) {
        allLocalImages.splice(0, 0, result);
      }
    }
    return allLocalImages;
  }

  /**
   * Try to scrape for an even higher resolution using the intermediary hack.
   * @param wixMatch Wix Regular expression matching object
   * @returns A promise potentially holding a higher resolution version.
   */
  async function attemptHigherRes(
    wixMatch: RegExpMatchArray
  ): Promise<ImageObj | null> {
    const s = wixMatch[1];
    const leadingHash = wixMatch[2];
    const trailing = wixMatch[3];
    const extension = wixMatch[4];
    let potentiallyLargerFetchSrc = `http${s}://images-wixmp-${leadingHash}.wixmp.com/intermediary/${trailing}.${extension}`;
    const expRes = getExpectedRes();
    if (expRes != null) {
      potentiallyLargerFetchSrc = potentiallyLargerFetchSrc.replace(
        QUALITY_REGEX,
        `w_${expRes.width},h_${expRes.height},bl,q_100`
      );
    }
    consoleDebug("Searching for higher res at:", potentiallyLargerFetchSrc);
    const higherResObj = await fetchImageObjectFromBlobURL(
      potentiallyLargerFetchSrc,
      potentiallyLargerFetchSrc
    );
    if (higherResObj == null) {
      consoleDebug("Could not get higher res, falling back");
      // No need to return null here, higherResObj is null.
    }
    return higherResObj;
  }

  /**
   * Return the expected resolution as an object, or null if it could
   * not be found.
   */
  function getExpectedRes(): Resolution | null {
    const matches = document
      .querySelector("main")
      ?.innerText?.match("([0-9]+)x([0-9]+)px");
    if (matches != null && matches.length === 3) {
      return {
        width: parseInt(matches[1]),
        height: parseInt(matches[2]),
      };
    }
    return null;
  }

  function getArtists(): string[] {
    const elem = document.querySelector(
      "div > div > span > a.user-link[data-username]"
    );
    const usernameAttr = elem?.attributes.getNamedItem("data-username");
    if (usernameAttr == null) {
      consoleError("Unable to find artist");
      return [];
    }
    return [usernameAttr.value];
  }

  function getDescription() {
    const legacyJournal = document.querySelectorAll("div.legacy-journal")[0];
    const descBody = legacyJournal
      ? escapeMarkdown(descrRecursiveHelper(legacyJournal).trim())
      : "";
    const title = extractTitle();
    const license = extractLicenseInfo();
    if (license === "") {
      return `__**${title}**__\n\n${descBody}`;
    }
    return `__**${title}**__\n\n${descBody}\n\n_${license}_`;
  }

  function getYear(): number | null {
    const datetime = document.querySelector("time")?.getAttribute("datetime");
    if (datetime == null) {
      consoleError("Could not get <time> tag with datetime attribute");
      return null;
    }
    const year = isoYearFunc(datetime);
    if (year == null) {
      consoleError(`datetime ${datetime} was not ISO8601 formatted`);
      return null;
    }
    return year.year;
  }

  function getTags(): string[] {
    const year = getYear();
    if (year != null) {
      return [year.toString()];
    }
    return [];
  }

  /**
   * @param {Node} elem Recurse element target.
   * @returns {string} Collected description.
   */
  function descrRecursiveHelper(elem: Node | undefined): string {
    if (elem?.hasChildNodes()) {
      return Array.from(elem?.childNodes).reduce((acc, child) => {
        switch (child.nodeName) {
          case "#text":
            return acc + (child.nodeValue ?? "");
          case "BR":
            return acc + "\n";
          case "DIV":
            return acc + "\n" + descrRecursiveHelper(child);
          default:
            return acc + descrRecursiveHelper(child);
        }
      }, "");
    }
    return "";
  }

  /**
   * @returns {string} The DeviantArt image title.
   */
  function extractTitle(): string {
    return (
      document.querySelector("[data-hook=deviation_title]")?.textContent ?? ""
    );
  }

  /**
   * @returns {string} The license info from the page.
   */
  function extractLicenseInfo(): string {
    // This class name may change through obfuscation.
    const license = document.querySelector("a[rel*='license']");
    return license?.textContent ?? "";
  }

  async function listener(request: ExtractorRequest): Promise<Feedback> {
    const { command, data } = request;
    if (command === "contentExtractData") {
      switch (data.fetchType) {
        case "direct":
          consoleDebug("Using direct fetch");
          const imgObjs = await imageExtractor(false);
          const expRes = getExpectedRes();
          return new Feedback({
            listenerType: "deviantart",
            images: imgObjs,
            sourceLinks: [document.location.href],
            expectedResolutions: expRes == null ? [] : [expRes],
            authors: getArtists(),
            description: getDescription(),
            extractedTags: getTags(),
          }).resolvePromise();
        case "general":
          consoleDebug("Using general server fetch");
          return new Feedback({
            listenerType: "deviantart",
            images: [genericImageExtractor(true)[0]],
          }).resolvePromise();
        default:
          const msg = `Unsupported fetch type: ${request.data.fetchType}`;
          consoleError(msg);
          return Promise.reject(msg);
      }
    }
    return Promise.reject("Not Valid Command For Universal Handler");
  }

  browser.runtime.onMessage.addListener(listener);
  consoleDebug("FurAdder Successfully Loaded");
})();
