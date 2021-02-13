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
      console.error("Unable to find view link");
      return null;
    }
    return hrefElem.href;
  }

  /**
   * Return the extracted description.
   */
  function getDescription() {
    return "";
  }

  /**
   * Return the source link provided.
   */
  function getSourceLink() {
    return document.location.href;
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
   * Transform extracted Derpi-tags.
   * @param tags Array of raw extracted tags.
   * @returns Transformed derpi tags for Furbooru.
   */
  function transformDerpiTags(tags) {
    return [...tags, "my little pony"];
  }

  function listener(request) {
    const { command, data } = request;
    if (command === "contentExtractData") {
      switch (data.fetchType) {
        case "direct":
          console.debug("[FUR] Using Direct Fetch");
          const artists = getArtists();
          return new Feedback({
            listenerType: "derpibooru",
            images: derpibooruHandler(),
            authors: artists,
            description: getDescription(),
            sourceLink: getSourceLink(),
            extractedTags: transformDerpiTags(getDerpiTags()),
          }).resolvePromise();
        case "general":
          console.debug("[FUR] Using General Fetch");
          return new Feedback({
            listenerType: "derpibooru",
            images: derpibooruHandler(),
          }).resolvePromise();
        default:
          const msg = `[FUR] Unsupported fetch type: ${request.data.fetchType}`;
          console.error(msg);
          return Promise.reject(msg);
      }
    }
    return Promise.reject("Not Valid Command For Twitter Handler");
  }

  browser.runtime.onMessage.addListener(listener);
  console.debug("FurAdder Successfully Loaded");
})();
