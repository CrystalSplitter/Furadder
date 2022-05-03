"use strict";

(() => {
  const SRC_STRING = "https://pbs.twimg.com/media/";
  const VIEW_PATH = "https://derpicdn.net/img/view";
  const TAG_LIST = document.querySelector(".tag-list");

  function derpibooruHandler() {
    const imgSrc = getViewURL();
    return [
      newImageObject({
        src: imgSrc,
        lazyLoad: true,
        width: null,
        height: null,
      }),
    ];
  }

  /**
   * @returns The URL of the image View (full res).
   */
  function getViewURL() {
    const hrefElem = document.querySelector("a[title~=View]");
    if (hrefElem == null) {
      consoleError("Unable to find view link");
      return null;
    }
    return hrefElem.href;
  }

  /**
   * Return the source link provided.
   * @returns {string} Source URL.
   */
  function getSourceLink() {
    const src = document.querySelector(
      "#image-source > p > a.js-source-link"
    )?.textContent;
    if (src == null) {
      return document.location.href;
    }
    return src;
  }

  /**
   * Slice the front of an author tag off, so it just returns the author name.
   */
  function artistTagToName(authorTag) {
    const reg = /artist:(.+)/;
    const match = authorTag.match(reg);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  }

  /**
   * Return the list of artist names.
   */
  function getArtists() {
    if (TAG_LIST == null) {
      return [];
    }
    let arr = [];
    for (let i = 0; i < TAG_LIST.childNodes.length; i++) {
      const artist = artistTagToName(
        TAG_LIST.childNodes[i].getAttribute("data-tag-name")
      );
      if (artist) {
        arr.push(artist);
      }
    }
    return arr;
  }

  /**
   * Extract tags from Derpibooru and return them as an Array of Strings.
   */
  function getDerpiTags() {
    if (TAG_LIST == null) {
      return [];
    }
    let arr = [];
    TAG_LIST.childNodes.forEach((child) => {
      const tag = child.getAttribute("data-tag-name");
      if (tag == null) {
        consoleError("Couldn't get 'data-tag-name' for", tag);
        return;
      }
      if (!tag.startsWith("artist:")) {
        arr.push(tag);
      }
    });
    return arr;
  }

  /**
   * Return the extracted description.
   */
  function getDescription() {
    const descElem = document.querySelector(".image-description__text");
    return descrRecursiveHelper(descElem);
  }

  /**
   * @param {Element} elem Recurse element target.
   * @returns {string} Combined string description for the elem.
   */
  function descrRecursiveHelper(elem) {
    if (elem?.hasChildNodes()) {
      return Array.from(elem?.childNodes).reduce((acc, child) => {
        switch (child.nodeName) {
          case "#text": // (Raw) text
            return acc + (child.nodeValue ?? "");
          case "A": // Hyperlinks
            return (
              acc + "[" + descrRecursiveHelper(child) + "](" + child.href + ")"
            );
          case "BR": // Newlines
            return acc + "";
          case "BLOCKQUOTE": // Block quotes
            return (
              acc + "> " + descrRecursiveHelper(child).replaceAll("\n", "\n> ")
            );
          case "CODE": // Code
            return acc + "`" + descrRecursiveHelper(child) + "`";
          case "DEL": // Strikethrough
            return acc + "~~" + descrRecursiveHelper(child) + "~~";
          case "DIV": // Paragraph
            return acc + "\n" + descrRecursiveHelper(child);
          case "EM": // Italics
            return acc + "*" + descrRecursiveHelper(child) + "*";
          case "IMG": // Embedded image
            return acc + (child.src ?? "");
          case "INS": // Underline
            return acc + "__" + descrRecursiveHelper(child) + "__";
          case "LI": // List element
            return acc + "* " + descrRecursiveHelper(child);
          case "STRONG": // Bold
            return acc + "**" + descrRecursiveHelper(child) + "**";
          case "UL": // Unordered list
            return acc + descrRecursiveHelper(child);
          case "SPAN": {
            if (child.className === "spoiler") {
              // Text spoiler
              return acc + "||" + descrRecursiveHelper(child) + "||";
            } else if (child.className === "imgspoiler") {
              // Image spoiler
              return acc + "![](" + descrRecursiveHelper(child) + ")";
            }
            return acc + "";
          }
          default:
            return acc + descrRecursiveHelper(child);
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
  function transformDerpiTags(tags) {
    return [...tags, "my little pony"];
  }

  function listener(request) {
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
            sourceLink: getSourceLink(),
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
