"use strict";

(() => {
  /**
   * Return the expected resolution as an object, or null if it could
   * not be found.
   */
  function getExpectedRes() {
    const matches = document
      .querySelector("main")
      .innerText.match("([0-9]+)x([0-9]+)px");
    if (matches.length === 3) {
      return {
        width: parseInt(matches[1]),
        height: parseInt(matches[2]),
      };
    }
    return null;
  }

  function getArtists() {
    const elem = document.querySelector(".submission-id-sub-container > a");
    if (elem === null) {
      return [];
    }
    return [elem.textContent];
  }

  function getDescription() {
    const elem = document.querySelector(
      ".section-body > .submission-description"
    );
    return elem ? escapeMarkdown(elem.textContent.trim()) : "";
  }

  function listener(request) {
    const { command, data } = request;
    if (command === "contentExtractData") {
      switch (data.fetchType) {
        case "direct":
          consoleDebug("Using direct fetch");
          const imgObjs = genericImageExtractor(false);
          return new Feedback({
            listenerType: "furaffinity",
            images: imgObjs,
            sourceLink: document.location.href,
            // expectedResolutions: [getExpectedRes()],
            authors: getArtists(),
            description: getDescription(),
          }).resolvePromise();
        case "general":
          consoleDebug("Using general server fetch");
          return new Feedback({
            listenerType: "furaffinity",
            images: [genericImageExtractor(true)[0]],
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
