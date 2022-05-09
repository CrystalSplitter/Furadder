(() => {
  /**
   * Return the expected resolution as an object, or null if it could
   * not be found.
   */
  function getExpectedRes(): Resolution[] {
    const infoElems = document.querySelectorAll<HTMLSpanElement>(
      ".info.text > div > span"
    );
    for (let i = 0; i < infoElems.length; i++) {
      const matches = infoElems[i].innerText.match(
        /^\s*([0-9]+)\s*x\s*([0-9]+)(px)?\s*$/
      );
      if (matches != null && matches.length >= 3) {
        return [
          {
            width: parseInt(matches[1]),
            height: parseInt(matches[2]),
          },
        ];
      }
    }
    return [];
  }

  function getArtists(): string[] {
    const elem = document.querySelector<HTMLLinkElement>(
      ".submission-id-sub-container > a"
    );
    if (elem == null || elem.textContent == null) {
      consoleError("Unable to find artist");
      return [];
    }
    return [elem.textContent];
  }

  function getDescription(): string {
    const elem = document.querySelector(
      ".section-body > .submission-description"
    );
    if (elem == null || elem.textContent == null) {
      consoleError("Unable to get description");
      return "";
    }
    return elem.textContent.trim();
  }

  function listener(request: ExtractorRequest): Promise<Feedback> {
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
            expectedResolutions: getExpectedRes(),
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
