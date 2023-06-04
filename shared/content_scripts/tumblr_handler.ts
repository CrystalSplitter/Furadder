(() => {
  const SUBDOMAIN_MATCHER = /(?<subdomain>[^/]+)\.tumblr\.com/;
  const SUBROUTE_MATCHER = /(www\.)?tumblr\.com\/(?<subroute>[^/]+)/;

  async function imageExtractor(general: boolean): Promise<ImageObj[]> {
    // There may exist high-resolution images on the page which are only
    // loaded if we
    const allLocalImages = genericImageExtractor(general);
    const potentialHighRes = await Promise.all(
      highResExtractor("data-highres").concat(
        highResExtractor("data-big-photo")
      )
    );
    const highRes = potentialHighRes.filter(
      (maybe): maybe is ImageObj => maybe != null
    );
    return highRes.concat(allLocalImages);
  }

  function highResExtractor(attribute: string): Promise<ImageObj | null>[] {
    return Array.from(document.querySelectorAll(`[${attribute}]`))
      .map((elem) => elem.getAttribute(attribute))
      .filter((maybeHighRes): maybeHighRes is string => maybeHighRes != null)
      .map(async (highResSrc) => {
        consoleDebug("Trying to fetch high-res from", highResSrc);
        const newImg = await fetchImageObjectFromBlobURL(
          highResSrc,
          highResSrc
        );
        if (newImg != null) {
          return { ...newImg, fetchSrc: highResSrc };
        } else {
          return null;
        }
      });
  }

  function getArtists(): string[] {
    const subdomain_match = document.location.href.match(SUBDOMAIN_MATCHER);
    if (
      subdomain_match?.groups?.subdomain &&
      subdomain_match?.groups?.subdomain !== "www"
    ) {
      return [subdomain_match.groups?.subdomain];
    }
    const subroute_match = document.location.href.match(SUBROUTE_MATCHER);
    if (subroute_match?.groups?.subroute) {
      return [subroute_match.groups?.subroute];
    }
    consoleError("Unable to find artist");
    return [];
  }

  function getDescription(): string {
    // This is fundamentally a hard problem.
    // Tumblr allows arbitrary HTML themes. There doesn't seem to be a consistent
    // "tag" class or "description" class we can infer. We sort of just have to guess
    // and hope.
    const caption = extractCaption();
    const tumblrTags = extractTumblrTags().join("\n").trim();
    let out = "";
    if (caption != "") {
      out += caption;
      if (tumblrTags != "") {
        out += "\n\n";
      }
    }
    if (tumblrTags != "") {
      out += tumblrTags;
    }
    return out;
  }

  function extractCaption(): string {
    const textpostbody =
      document.querySelector(".textpostbody > p")?.textContent;
    if (textpostbody != null) {
      return textpostbody;
    }
    const caption = document.querySelector("figcaption.caption")?.textContent;
    if (caption != null) {
      return caption;
    }
    return "";
  }

  function extractTumblrTags(): string[] {
    const tagSpans = document.querySelectorAll(".tags");
    if (tagSpans && tagSpans.length > 0) {
      const postTagSpan = tagSpans[0];
      const containedParagraph = postTagSpan.children[0];
      return Array.from(containedParagraph.children).map((tumblrTag) => {
        return `#${tumblrTag.textContent}`;
      });
    }
    return [];
  }

  function getYear(): number | null {
    const datetime = document
      .querySelector(".dt-published")
      ?.getAttribute("datetime");
    if (datetime == null) {
      consoleError("Could not get .dt-published with datetime attribute");
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

  async function listener(request: ExtractorRequest): Promise<Feedback> {
    const { command, data } = request;
    if (command === "contentExtractData") {
      switch (data.fetchType) {
        case "direct":
          consoleDebug("Using direct fetch");
          const imgObjs = await imageExtractor(false);
          return new Feedback({
            listenerType: "tumblr",
            images: imgObjs,
            sourceLinks: [document.location.href],
            authors: getArtists(),
            description: getDescription(),
            extractedTags: getTags(),
          }).resolvePromise();
        case "general":
          consoleDebug("Using general server fetch");
          return new Feedback({
            listenerType: "tumblr",
            images: [genericImageExtractor(true)[0]],
          }).resolvePromise();
        default:
          const msg = `Unsupported fetch type: ${request.data.fetchType}`;
          consoleError(msg);
          return Promise.reject(msg);
      }
    }
    return Promise.reject("Not Valid Command For Tumblr Handler");
  }

  browser.runtime.onMessage.addListener(listener);
  consoleDebug("FurAdder Successfully Loaded");
})();
