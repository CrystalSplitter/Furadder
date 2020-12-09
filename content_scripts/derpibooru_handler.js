"use strict";

(() => {
  const SRC_STRING = "https://pbs.twimg.com/media/";
  const VIEW_PATH = "https://derpicdn.net/img/view"

  function derpibooruHandler() {
    const imgSrc = getViewURL();
    return [newImageObject({
      src: imgSrc,
      lazyLoad: true,
      width: null,
      height: null,
    })];
  }

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
    return "";
  }

  /**
   * Return the artist name.
   */
  function getArtist() {
    return "";
  }

  function listener(request) {
    const { command, data } = request;
    if (command === "contentExtractData") {
      switch (data.fetchType) {
        case "direct":
          console.debug("[FUR] Using Direct Fetch");
          return Promise.resolve({
            images: derpibooruHandler(),
            author: getSourceLink(),
            description: getDescription(),
            sourceLink: document.location.href,
            expectedIdx: 0,
          });
          break;
        default:
          const msg = `[FUR] Unsupported fetch type: ${request.data.fetchType}`;
          console.error(msg);
          return Promise.reject(msg);
          break;
      }
    }
    return Promise.reject("Not Valid Command For Twitter Handler");
  }

  browser.runtime.onMessage.addListener(listener);
  console.debug("Furadder Successfully Loaded");
})();
