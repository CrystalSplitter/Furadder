"use strict";

(() => {
  const SRC_STRING = "https://pbs.twimg.com/media/";

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

  function twitterHandler() {
    const scrapedImages = Array.from(document.images);
    const filteredImages = scrapedImages.filter((imgElem) => {
      return imgElem.src.includes(SRC_STRING);
    });
    //filteredImages.sort((a, b) => -sizeCompare(a, b));
    const imgObjects = filteredImages.map((x) => {
      return { src: x.src, width: x.naturalWidth, height: x.naturalHeight };
    });
    return imgObjects;
  }

  function getImgIdx(url) {
    const xs = url.toString().split("/");
    if (xs.length > 2 && xs[xs.length - 2] === "photo") {
      return parseInt(xs[xs.length - 1]) - 1;
    }
    return 0;
  }

  function getDescription() {
    const parentDiv = document.querySelector("article > div > div > div");
    if (parentDiv) {
      return parentDiv.lastChild.innerText;
    } else {
      return "";
    }
  }

  function listener(request) {
    if (request.command === "extractData") {
      const imgs = twitterHandler();
      return Promise.resolve({
        images: imgs,
        author: "author",
        description: getDescription(),
        sourceLink: document.location.href,
        expectedIdx: getImgIdx(request.urlStr),
      });
    }
    return Promise.reject();
  }

  browser.runtime.onMessage.addListener(listener);
  console.debug("Furadder Successfully Loaded");
})();
