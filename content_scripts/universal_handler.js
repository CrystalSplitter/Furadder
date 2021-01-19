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

  function listener(request) {
    const { command, data } = request;
    if (command === "contentExtractData") {
      switch (data.fetchType) {
        case "direct":
          console.debug("[FUR] Using direct fetch");
          return Promise.resolve({
            listenerType: "universal",
            images: imageExtractor(false),
            author: null,
            description: null,
            sourceLink: document.location.href,
            expectedIdx: 0,
            extractedTags: [],
          });
        case "general":
          console.debug("[FUR] Using general server fetch");
          return Promise.resolve({
            listenerType: "universal",
            images: [imageExtractor(true)[0]],
            author: null,
            description: null,
            sourceLink: null,
            expectedIdx: 0,
            extractedTags: [],
          });
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
