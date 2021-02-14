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
          consoleDebug("Using direct fetch");
          return new Feedback({
            listenerType: "universal",
            images: imageExtractor(false),
            sourceLink: document.location.href,
          }).resolvePromise();
        case "general":
          consoleDebug("Using general server fetch");
          return new Feedback({
            listenerType: "universal",
            images: [imageExtractor(true)[0]],
          }).resolvePromise();
        default:
          const msg = `Unsupported fetch type: ${request.data.fetchType}`;
          consoleError(msg);
          return Promise.reject(msg);
      }
    }
    return Promise.reject("Not Valid Command For Universal Handler");
  }

  browser.runtime.onMessage.addListener(listener);
  consoleDebug("FurAdder Successfully Loaded");
})();
