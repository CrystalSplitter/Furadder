(() => {
  /**
   * Set the 'Fetch' field URL entry on the submission page.
   * @param urlStr The URL string to set.
   * @returns true if successful.
   */
  function setFetchURL(urlStr: string) {
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
   * Set the source string on the submission page.
   * @param urlStr The source string to set.
   */
  function setSourceURL(urlStr: string) {
    const elem = document.getElementById("image_source_url");
    if (elem == null || !(elem instanceof HTMLInputElement)) {
      consoleError("Unable to set image_source_url");
      return false;
    }
    elem.value = urlStr;
    return true;
  }

  /**
   * Set the description field on the submission page.
   */
  function setDescription(desc: string, autoquote = true) {
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
  function appendTags(tagArray: string[]) {
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
  function callFetch() {
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
  function listener(request: Request) {
    if (request.command === "contentFurbooruFetch") {
      const setFetchSuccess = setFetchURL(request.data.fetchURLStr);
      const setSourceSuccess = setSourceURL(request.data.sourceURLStr);
      const setDescSuccess = setDescription(
        request.data.description,
        request.data.autoquote
      );
      if (setFetchSuccess && setSourceSuccess && setDescSuccess) {
        const fetchSuccess = callFetch();
        const finalSuccess =
          fetchSuccess &&
          appendTags(request.data.tags ? request.data.tags : []);
        return Promise.resolve({ success: finalSuccess });
      }
      return Promise.resolve({ success: false });
    }
    return Promise.reject({ isError: true, message: "Unsupported command" });
  }

  browser.runtime.onMessage.addListener(listener);
  consoleDebug("Furadder Successfully Loaded");
})();