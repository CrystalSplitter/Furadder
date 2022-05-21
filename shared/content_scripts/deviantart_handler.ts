(() => {
  function imageExtractor(general: boolean): ImageObj[] {
    return genericImageExtractor(general);
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

  function listener(request: ExtractorRequest): Promise<Feedback> {
    const { command, data } = request;
    if (command === "contentExtractData") {
      switch (data.fetchType) {
        case "direct":
          consoleDebug("Using direct fetch");
          const imgObjs = imageExtractor(false);
          const expRes = getExpectedRes();
          return new Feedback({
            listenerType: "deviantart",
            images: imgObjs,
            sourceLink: document.location.href,
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
