"use strict";

(() => {
  function imageExtractor(general) {
    const arr = Array.from(document.images);
    arr.sort(sizeCompare).reverse();
    const imgObjs = arr.map((x) =>
      newImageObject({
        src: x.src,
        width: x.naturalWidth,
        height: x.naturalHeight,
        fetchSrc: general ? document.location.href : x.src,
      })
    );
    return imgObjs;
  }

  /**
   * Return the expected resolution as an object, or null if it could
   * not be found.
   */
  function getExpectedRes() {
    const matches = document
      .querySelector("main")
      .innerText.match("([0-9]+)x([0-9]+)px");
    if (matches.length === 3) {
      return {
        width: parseInt(matches[1]),
        height: parseInt(matches[2]),
      };
    }
    return null;
  }

  function getArtists() {
    const elem = document.querySelector(
      "div > div > span > a.user-link[data-username]"
    );
    if (elem == null) {
      consoleError("Unable to find artist");
      return [];
    }
    return [elem.attributes["data-username"].value];
  }

  function getDescription() {
    const legacyJournal = document.querySelectorAll("div.legacy-journal")[0];
    const descBody = legacyJournal
      ? escapeMarkdown(descrRecursiveHelper(legacyJournal, 0).trim())
      : "";
    const title = extractTitle();
    const license = extractLicenseInfo();
    if (license === "") {
      return `__**${title}**__\n\n${descBody}`;
    }
    return `__**${title}**__\n\n${descBody}\n\n_${license}_`;
  }

  /**
   * @param {Node} elem Recurse element target.
   * @returns {string} Collected description.
   */
  function descrRecursiveHelper(elem) {
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
  function extractTitle() {
    return (
      document.querySelector("[data-hook=deviation_title]")?.textContent ?? ""
    );
  }

  /**
   * @returns {string} The license info from the page.
   */
  function extractLicenseInfo() {
    // This class name may change through obfuscation.
    const license = document.querySelector("a[rel*='license']");
    return license?.textContent ?? "";
  }

  function listener(request) {
    const { command, data } = request;
    if (command === "contentExtractData") {
      switch (data.fetchType) {
        case "direct":
          consoleDebug("Using direct fetch");
          const imgObjs = genericImageExtractor(false);
          return new Feedback({
            listenerType: "deviantart",
            images: imgObjs,
            sourceLink: document.location.href,
            expectedResolutions: [getExpectedRes()],
            authors: getArtists(),
            description: getDescription(),
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
