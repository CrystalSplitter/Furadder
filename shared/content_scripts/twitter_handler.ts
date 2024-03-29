(() => {
  const SRC_STRING = "https://pbs.twimg.com/media/";

  function directTwitterHandler(): ImageObj[] {
    return filterScrapedImages(SRC_STRING).map((x) => {
      return newImageObject({
        src: x.src,
        width: x.naturalWidth,
        height: x.naturalHeight,
      });
    });
  }

  function furbooruFetchTwitterHandler(): ImageObj[] {
    return filterScrapedImages(SRC_STRING).map((x) => {
      return newImageObject({
        src: x.src,
        width: x.naturalWidth,
        height: x.naturalHeight,
        fetchSrc: document.location.href,
      });
    });
  }

  /**
   * Scrape and filter all images on the webpage based on the provided substring.
   */
  function filterScrapedImages(substringToCheck: string): HTMLImageElement[] {
    const scrapedImages = Array.from(document.images);
    const filteredImages = scrapedImages.filter((imgElem) => {
      return imgElem.src.includes(substringToCheck);
    });
    return filteredImages;
  }

  /**
   * Return the index of the image we're looking at right now.
   */

  function getImgIdx(url: string): number {
    const xs = url.toString().split("/");
    if (xs.length > 2 && xs[xs.length - 2] === "photo") {
      return parseInt(xs[xs.length - 1]) - 1;
    }
    return 0;
  }

  /**
   * Return the container element of the description content and tweet info.
   */
  function getDescriptionContainer(): Element | null {
    return document.querySelector("article > div > div > div > :last-child");
  }

  /**
   * Return the year of posting.
   * @returns The year of posting as an integer, or `null` if not found.
   */
  function getYear(): number | null {
    const htmlElem = document.querySelector("html");
    if (htmlElem == null) return null;
    const lang: Lang | null = htmlElem.getAttribute("lang") as Lang;
    if (lang == null) return null;
    const descriptionContainer = getDescriptionContainer();
    if (descriptionContainer == null) {
      consoleError("Unable to find descriptionContainer.");
      return null;
    }
    const yearString = recurseForDate(descriptionContainer);
    if (yearString == null) {
      consoleError("Can't get year string");
      return null;
    }
    const date = parseDateString(yearString, lang);
    if (date == null) {
      consoleError("Can't parse date string:", yearString);
      return null;
    }
    return date.year;
  }

  /**
   * Helper to traverse the description container to search for the date span.
   * @param elem Element to recurse on.
   * @returns The date string or null.
   */
  function recurseForDate(elem: Element): string | null {
    if (elem.children.length === 0) {
      if (elem.nodeName === "SPAN") {
        if (elem.textContent?.match(/\b20\d\d\b/)) {
          return elem.textContent;
        }
      }
      return null;
    }
    const childrenResults = Array.from(elem.children)
      .map((child) => {
        return recurseForDate(child);
      })
      .filter((x) => x != null);
    if (childrenResults.length > 0)
      return childrenResults[childrenResults.length - 1];
    return null;
  }

  /**
   *
   */
  function getTags(): string[] {
    const output: string[] = [];
    const year = getYear();
    if (year != null) {
      output.push(year.toString());
    }
    return output;
  }

  /**
   * Return the textual content of the tweet.
   */
  function getDescription(): string {
    const descriptionContainer = getDescriptionContainer();
    if (descriptionContainer == null) {
      consoleError("Unable to find descriptionContainer.");
      return "";
    }
    const description = descriptionContainer.firstChild;
    if (description == null) {
      consoleError("Unable to find firstChild for description.");
      return "";
    }
    if (description.textContent == null) {
      consoleError("Unable to get description textContent");
      return "";
    }
    return escapeMarkdown(description.textContent);
  }

  /**
   * Return the twitter handle of the posted tweet.
   */
  function getTwitterHandle() {
    const splits = document.location.href.split("/");
    if (splits != null && splits.length >= 4) {
      return splits[3];
    }
    consoleError("Unable to get twitter handle.");
    return "";
  }

  function listener(request: ExtractorRequest): Promise<Feedback> {
    const { command, data } = request;
    if (command === "contentExtractData") {
      switch (data.fetchType) {
        case "direct":
          consoleDebug("Using direct fetch");
          return new Feedback({
            listenerType: "twitter",
            images: directTwitterHandler(),
            authors: [getTwitterHandle()],
            description: getDescription(),
            sourceLinks: [document.location.href],
            expectedIdx: getImgIdx(data.urlStr),
            extractedTags: getTags(),
          }).resolvePromise();
        case "general":
          consoleDebug("Using general server fetch");
          return new Feedback({
            listenerType: "twitter",
            images: furbooruFetchTwitterHandler(),
            expectedIdx: getImgIdx(data.urlStr),
          }).resolvePromise();
        default:
          const msg = `Unsupported fetch type: ${request.data.fetchType}`;
          consoleError(msg);
          return Promise.reject(msg);
      }
    }
    return Promise.reject("Not Valid Command For Twitter Handler");
  }

  browser.runtime.onMessage.addListener(listener);
  consoleDebug("FurAdder Successfully Loaded");
})();
