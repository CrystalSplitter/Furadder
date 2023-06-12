(() => {
  // const VIEW_PATH = "https://derpicdn.net/img/view";
  const TAG_LIST = document.querySelector(".tag-list");
  const RES_REGEX = /(\d+)x(\d+).*/;

  function derpibooruHandler(): ImageObj[] {
    const imgSrc = getViewURL();
    const imgSize = getImageSize();
    return [
      newImageObject({
        src: imgSrc,
        width: imgSize?.width,
        height: imgSize?.height,
      }),
    ];
  }

  function getImageSize(): Resolution | null {
    const sizeElem = document.querySelector<HTMLSpanElement>(".image-size");
    const match = sizeElem?.textContent?.trim().match(RES_REGEX);
    if (match == null) {
      consoleDebug("Could not find matching image-size element");
      return null;
    }
    const width = match[1];
    const height = match[2];
    if (width == null || height == null) {
      consoleDebug("Could not get width or height for image");
      return null;
    }
    return { width: parseInt(width), height: parseInt(height) };
  }

  /**
   * @returns The URL of the image View (full res).
   */
  function getViewURL(): string | null {
    const hrefElem = document.querySelector<HTMLLinkElement>("a[title~=View]");
    if (hrefElem == null) {
      consoleError("Unable to find view link");
      return null;
    }
    return hrefElem.href;
  }

  /**
   * Return the source links provided.
   *
   * @returns {string[]} Source URLs.
   */
  function getSourceLinks(): string[] {
    const srcs = Array.from(
      document.querySelectorAll(".image_sources .image_source__link")
    )
      .map((x) => x.textContent)
      .map((x) => (x?.includes("not provided yet") ? null : x))
      .filter((x): x is string => x != null);
    if (srcs == null || srcs.length === 0) {
      const hrefBefore = document.location.href.split("?");
      return [hrefBefore[0]];
    }
    return srcs;
  }

  /**
   * Slice the front of an author tag off, so it just returns the author name.
   */
  function artistTagToName(authorTag: string): string | null {
    const reg = /artist:(.+)/;
    const match = authorTag.match(reg);
    if (match != null && match[1]) {
      return match[1];
    }
    return null;
  }

  /**
   * Return the list of artist names.
   */
  function getArtists(): string[] {
    if (TAG_LIST == null) {
      return [];
    }
    return Array.from(TAG_LIST.children)
      .map((e) => e.getAttribute("data-tag-name"))
      .filter((tag): tag is string => tag != null)
      .map((tag) => artistTagToName(tag))
      .filter((x): x is string => x != null);
  }

  /**
   * Extract tags from Derpibooru and return them as an Array of Strings.
   */
  function getDerpiTags(): string[] {
    if (TAG_LIST == null) {
      return [];
    }
    return Array.from(TAG_LIST.children)
      .map((e) => e.getAttribute("data-tag-name"))
      .filter(
        (tag): tag is string => tag != null && !tag.startsWith("artist:")
      );
  }

  /**
   * Return the extracted description.
   */
  function getDescription(): string {
    const descElem = document.querySelector(
      ".image-description .block__content"
    );
    const desc = descrRecHelper(descElem);
    // An empty description actually displays the below, so filter that
    // out explicitly.
    if (desc === "*No description provided.*") {
      return "";
    }
    return desc;
  }

  /**
   * @param {Element} elem Recurse element target.
   * @returns {string} Combined string description for the elem.
   */
  function descrRecHelper(elem: Node | null): string {
    if (elem?.hasChildNodes()) {
      return Array.from(elem?.childNodes).reduce((acc, child) => {
        switch (child.nodeName) {
          case "#text": // (Raw) text
            return acc + (child.nodeValue ?? "");
          case "A": // Hyperlinks
            const linkChild = child as HTMLLinkElement;
            return acc + `[${descrRecHelper(linkChild)}](${linkChild.href})`;
          case "BR": // Newlines
            return acc + "";
          case "BLOCKQUOTE": // Block quotes
            return acc + "> " + descrRecHelper(child).replaceAll("\n", "\n> ");
          case "CODE": // Code
            return acc + "`" + descrRecHelper(child) + "`";
          case "DEL": // Strikethrough
            return acc + "~~" + descrRecHelper(child) + "~~";
          case "DIV": // Paragraph
            return acc + "\n" + descrRecHelper(child);
          case "EM": // Italics
            return acc + "*" + descrRecHelper(child) + "*";
          case "IMG": // Embedded image
            return acc + ((child as HTMLImageElement).src ?? "");
          case "INS": // Underline
            return acc + "__" + descrRecHelper(child) + "__";
          case "LI": // List element
            return acc + "* " + descrRecHelper(child);
          case "STRONG": // Bold
            return acc + "**" + descrRecHelper(child) + "**";
          case "UL": // Unordered list
            return acc + descrRecHelper(child);
          case "SPAN": {
            const spanChild = child as HTMLSpanElement;
            if (spanChild.className === "spoiler") {
              // Text spoiler
              return acc + "||" + descrRecHelper(child) + "||";
            } else if (spanChild.className === "imgspoiler") {
              // Image spoiler
              return acc + "![](" + descrRecHelper(child) + ")";
            }
            return acc + "";
          }
          default:
            return acc + descrRecHelper(child);
        }
      }, "");
    }
    return "";
  }

  /**
   * Transform extracted Derpi-tags.
   * @param {string[]} tags Array of raw extracted tags.
   * @returns {string[]} Transformed derpi tags for Furbooru.
   */
  function transformDerpiTags(tags: string[]): string[] {
    return [...tags, "my little pony"];
  }

  function listener(request: ExtractorRequest): Promise<Feedback> {
    const { command, data } = request;
    if (command === "contentExtractData") {
      switch (data.fetchType) {
        case "direct":
          consoleDebug("Using Direct Fetch");
          const artists = getArtists();
          return new Feedback({
            listenerType: "derpibooru",
            images: derpibooruHandler(),
            authors: artists,
            description: getDescription(),
            sourceLinks: getSourceLinks(),
            extractedTags: transformDerpiTags(getDerpiTags()),
            autoquote: false,
          }).resolvePromise();
        case "general":
          consoleDebug("Using General Fetch");
          return new Feedback({
            listenerType: "derpibooru",
            images: derpibooruHandler(),
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
