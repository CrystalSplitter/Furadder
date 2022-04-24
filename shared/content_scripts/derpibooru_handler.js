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
    if (hrefElem === null) {
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
    ).textContent;
    if (src === null) {
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
    if (TAG_LIST === null) {
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
    if (TAG_LIST === null) {
      return [];
    }
    let arr = [];
    for (let i = 0; i < TAG_LIST.childNodes.length; i++) {
      const tag = TAG_LIST.childNodes[i].getAttribute("data-tag-name");
      if (!tag.startsWith("artist:")) {
        arr.push(tag);
      }
    }
    return arr;
  }

  /**
   * Return the extracted description.
   */
  function getDescription() {
    const descElem = document.querySelector(".image-description__text");
    return descrRecursiveHelper(descElem);
  }

  function descrRecursiveHelper(node) {
    const onChildren = (childNs) => {
      let inner = "";
      childNs.forEach((child) => {
        inner += descrRecursiveHelper(child);
      });
      return inner;
    };

    switch (node.nodeName) {
      case "#text":
        if (node.nodeValue == null) {
          return "";
        } else {
          return node.nodeValue;
        }
      case "BR":
        return "\n";
      case "BLOCKQUOTE":
        return "> " + onChildren(node.childNodes).replaceAll("\n", "\n> ");
      case "DIV":
        return onChildren(node.childNodes);
      default:
        return "";
    }
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
