(() => {
  /**
   * Set the 'Fetch' field URL entry on the submission page.
   * @param urlStr The URL string to set.
   * @returns true if successful.
   */
  function setFetchURL(urlStr: string): boolean {
    const elem = document.getElementById("image_scraper_url");
    if (elem == null || !(elem instanceof HTMLInputElement)) {
      consoleError("Unable to set image_scraper_url");
      return false;
    }
    elem.value = urlStr;
    elem.dispatchEvent(new Event("input"));
    return true;
  }

  /**
   * Add a new source field entry on the booru submission page.
   * @returns Whether or not a new source was added.
   */
  function addNewSourceField(): boolean {
    const button = document.querySelector(".js-image-add-source");
    if (button != null && button instanceof HTMLButtonElement) {
      button.click();
      return true;
    }
    consoleError("Unable to add new source");
    return false;
  }

  /**
   * Set the source string on the submission page.
   * @param urlStrs The source string to set.
   */
  function setSourceURLs(urlStrs: string[]): boolean {
    for (let i = 0; i < urlStrs.length - 1; i++) {
      if (!addNewSourceField()) {
        return false;
      }
    }
    const sourceInputs = document.querySelectorAll(
      ".js-image-source .js-source-url"
    );
    if (sourceInputs.length !== urlStrs.length) {
      consoleError(
        `sourceInputs had length ${sourceInputs.length}, but expected ${urlStrs.length}`
      );
      return false;
    }
    for (let i = 0; i < urlStrs.length; i++) {
      const urlStr = urlStrs[i];
      const inputField = sourceInputs[i];
      if (inputField instanceof HTMLInputElement) {
        inputField.value = urlStr;
      } else {
        consoleError("Expected ", inputField, " to be an HTMLInputElement");
      }
    }
    return true;
  }

  /**
   * Set the description field on the submission page.
   */
  function setDescription(desc: string, autoquote = true): boolean {
    const elem = document.getElementById("image_description");
    if (
      elem == null ||
      !(elem instanceof HTMLTextAreaElement || elem instanceof HTMLInputElement)
    ) {
      consoleError("Unable to set description");
      return false;
    }
    if (desc && desc !== "") {
      if (autoquote) {
        elem.value = "> " + desc.replaceAll("\n", "\n> ");
      } else {
        elem.value = desc;
      }
    }
    return true;
  }

  /**
   * Add an array of tags to the submission list.
   */
  function appendTags(tagArray: string[]): boolean {
    const elem = document.getElementById("image_tag_input");
    if (
      elem == null ||
      !(elem instanceof HTMLTextAreaElement || elem instanceof HTMLInputElement)
    ) {
      consoleError("Unable to append tags");
      return false;
    }
    if (tagArray.length > 0) {
      // Keep the existing value there, otherwise start empty.
      elem.value = tagArray.reduce(
        (acc, x) => acc + "," + x,
        elem.value ? elem.value : ""
      );
      elem.dispatchEvent(new Event("reload"));
    }
    return true;
  }

  /**
   * Fetch the actual image via Furbooru's fetch button.
   */
  function callFetch(): boolean {
    const elem = document.getElementById("js-scraper-preview");
    if (elem != null && elem instanceof HTMLButtonElement) {
      elem.click();
      return true;
    }
    consoleError("Unable to call fetch");
    return false;
  }

  /**
   * Local listener injected into the page.
   */
  function listener(
    request: SubmissionRequest
  ): Promise<{ success: boolean } | { isError: boolean; message: string }> {
    if (request.command === "contentFurbooruFetch") {
      const setFetchSuccess = setFetchURL(request.data.fetchURLStr);
      consoleDebug("Set fetch field?", setFetchSuccess);
      const setSourceSuccess = setSourceURLs(request.data.sourceURLStrs);
      consoleDebug("Set source field?", setSourceSuccess);
      const setDescSuccess = setDescription(
        request.data.description,
        request.data.autoquote
      );
      consoleDebug("Set description field?", setDescSuccess);
      if (setFetchSuccess && setSourceSuccess && setDescSuccess) {
        const fetchSuccess = callFetch();
        consoleDebug("Called fetch?", fetchSuccess);
        const finalSuccess =
          fetchSuccess &&
          appendTags(request.data.tags ? request.data.tags : []);
        consoleDebug("Submission completed successfully?", finalSuccess);
        return Promise.resolve({ success: finalSuccess });
      }
      consoleError("Setting fields failed; didn't bother fetching");
      return Promise.resolve({ success: false });
    }
    return Promise.reject({
      isError: true,
      message: "Unsupported command",
    });
  }

  browser.runtime.onMessage.addListener(listener);
  consoleDebug("Furadder Successfully Loaded");
})();
