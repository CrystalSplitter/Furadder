"use strict";

(() => {
  const SRC_STRING = "https://pbs.twimg.com/media/";
  const INFO_IDX = 2;

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
   * Return the container element of the description content and tweet info.
   */
  function getDescriptionContainer() {
    return document.querySelector("article > div > div > div > :last-child");
  }

  /**
   * Return the year of posting.
   * @returns The year of posting as an integer, or `null` if not found.
   */
  function getYear() {
    const htmlElem = document.querySelector("html");
    if (htmlElem == null) return null;
    const lang = htmlElem.getAttribute("lang");
    if (lang == null) return null;
    const descriptionContainer = getDescriptionContainer();
    if (descriptionContainer == null) {
      console.error("[FUR] Unable to find descriptionContainer.");
      return null;
    }
    const infoElem = descriptionContainer.children[INFO_IDX];
    if (infoElem == null) return null;
    const infoStr = infoElem.textContent;
    const date = parseDateString(infoStr, lang);
    if (date == null) return null;
    return date.year;
  }

  /**
   *
   */
  function getTags() {
    const output = [];
    const year = getYear();
    if (year != null) {
      output.push(year.toString())
    }
    return output;
  }

  /**
   * Return the textual content of the tweet.
   */
  function getDescription() {
    const descriptionContainer = getDescriptionContainer();
    if (descriptionContainer == null) {
      console.error("[FUR] Unable to find descriptionContainer.");
      return "";
    }
    const description = descriptionContainer.firstChild;
    if (description == null) return "";
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
          console.debug("[FUR] Using direct fetch");
          return Promise.resolve({
            listenerType: "twitter",
            images: directTwitterHandler(),
            author: getTwitterHandle(),
            description: getDescription(),
            sourceLink: document.location.href,
            expectedIdx: getImgIdx(data.urlStr),
            extractedTags: getTags(),
          });
        case "general":
          console.debug("[FUR] Using general server fetch");
          return Promise.resolve({
            listenerType: "twitter",
            images: furbooruFetchTwitterHandler(),
            author: null,
            description: null,
            sourceLink: null,
            expectedIdx: getImgIdx(data.urlStr),
            extractedTags: [],
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
  console.debug("FurAdder Successfully Loaded");
})();
