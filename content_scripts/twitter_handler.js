"use strict";

(() => {
  const SRC_STRING = "https://pbs.twimg.com/media/";

  function newImageObject(props) {
    return {
      ...props,
      fetchSrc: props.fetchSrc ? props.fetchSrc : props.src,
    };
  }

  /**
   * Compare sizes of images.
   */
  function sizeCompare(img1, img2) {
    const pixCount1 = img1.naturalWidth * img1.naturalHeight;
    const pixCount2 = img2.naturalWidth * img2.naturalHeight;
    if (pixCount1 < pixCount2) {
      return -1;
    }
    if (pixCount1 > pixCount2) {
      return 1;
    }
    return 0;
  }

  function directTwitterHandler() {
    return filterScrapedImages(SRC_STRING).map((x) => {
      return newImageObject({
        src: x.src,
        width: x.naturalWidth,
        height: x.naturalHeight,
      });
    });
  }

  function furbooruFetchTwitterHandler() {
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
  function filterScrapedImages(substringToCheck) {
    const scrapedImages = Array.from(document.images);
    const filteredImages = scrapedImages.filter((imgElem) => {
      return imgElem.src.includes(substringToCheck);
    });
    return filteredImages;
  }

  /**
   * Return the index of the image we're looking at right now.
   */
  function getImgIdx(url) {
    const xs = url.toString().split("/");
    if (xs.length > 2 && xs[xs.length - 2] === "photo") {
      return parseInt(xs[xs.length - 1]) - 1;
    }
    return 0;
  }

  /**
   * Return the textual content of the tweet.
   */
  function getDescription() {
    const parentDiv = document.querySelector("article > div > div > div");
    if (parentDiv === null) {
      return "";
    }
    const descriptionContainer = parentDiv.lastChild;
    if (descriptionContainer === null) {
      return "";
    }
    const description = descriptionContainer.firstChild;
    if (description === null) {
      return "";
    }
    return description.innerText;
  }

  /**
   * Return the twitter handle of the posted tweet.
   */
  function getTwitterHandle() {
    const splits = document.location.href.split("/");
    if (splits.length >= 4) {
      return splits[3];
    }
    console.error("[FUR] Unable to get twitter handle.");
    return "";
  }

  function listener(request) {
    const { command, data } = request;
    if (command === "contentExtractData") {
      switch (data.fetchType) {
        case "direct":
          console.debug("[FUR] Using Direct Fetch");
          return Promise.resolve({
            listenerType: "twitter",
            images: directTwitterHandler(),
            author: getTwitterHandle(),
            description: getDescription(),
            sourceLink: document.location.href,
            expectedIdx: getImgIdx(data.urlStr),
          });
        case "general":
          console.debug("[FUR] Using general Server Fetch");
          return Promise.resolve({
            listenerType: "twitter",
            images: furbooruFetchTwitterHandler(),
            author: null,
            description: null,
            sourceLink: null,
            expectedIdx: getImgIdx(data.urlStr),
          });
        default:
          const msg = `[FUR] Unsupported fetch type: ${request.data.fetchType}`;
          console.error(msg);
          return Promise.reject(msg);
      }
    }
    return Promise.reject("Not Valid Command For Twitter Handler");
  }

  browser.runtime.onMessage.addListener(listener);
  console.debug("Furadder Successfully Loaded");
})();
