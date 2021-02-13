"use strict";

(() => {
  function imageExtractor(general) {
    const arr = Array.from(document.images);
    arr.sort(sizeCompare).reverse();
    const imgObjs = arr.map((x) =>
      newImageObject({
        src: x.src,
        width: x.naturalWidth,
        height: x.naturalHeight,
        fetchSrc: general ? document.location.href : x.src,
      })
    );
    return imgObjs;
  }

  /**
   * Return the expected resolution as an object, or null if it could
   * not be found.
   */
  function getExpectedRes() {
    const matches = document
      .querySelector("main")
      .innerText.match("([0-9]+)x([0-9]+)px");
    if (matches.length == 3) {
      return {
        width: matches[1],
        height: matches[2],
      };
    }
    return null;
  }

  function listener(request) {
    const { command, data } = request;
    if (command === "contentExtractData") {
      switch (data.fetchType) {
        case "direct":
          console.debug("[FUR] Using direct fetch");
          const imgObjs = imageExtractor(false);
          return new Feedback({
            listenerType: "deviantart",
            images: imgObjs,
            sourceLink: document.location.href,
            expectedResolutions: [getExpectedRes()],
          }).resolvePromise();
        case "general":
          console.debug("[FUR] Using general server fetch");
          return new Feedback({
            listenerType: "deviantart",
            images: [imageExtractor(true)[0]],
          }).resolvePromise();
        default:
          const msg = `[FUR] Unsupported fetch type: ${request.data.fetchType}`;
          console.error(msg);
          return Promise.reject(msg);
      }
    }
    return Promise.reject("Not Valid Command For Universal Handler");
  }

  browser.runtime.onMessage.addListener(listener);
  console.debug("FurAdder Successfully Loaded");
})();
