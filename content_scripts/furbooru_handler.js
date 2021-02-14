"use strict";

(() => {
  /**
   * Set the 'Fetch' field URL entry on the submission page.
   * @param urlStr The URL string to set.
   * @returns true if successful.
   */
  function setFetchURL(urlStr) {
    const elem = document.getElementById("image_scraper_url");
    if (elem) {
      elem.value = urlStr;
      elem.dispatchEvent(new Event("input"));
      return true;
    }
    return false;
  }

  /**
   * Set the source string on the submission page.
   * @param urlStr The source string to set.
   */
  function setSourceURL(urlStr) {
    const elem = document.getElementById("image_source_url");
    if (elem) {
      elem.value = urlStr;
      return true;
    }
    return false;
  }

  /**
   * Set the description field on the submission page.
   */
  function setDescription(desc, autoquote=true) {
    const elem = document.getElementById("image_description");
    if (!elem) {
      return false;
    }

    if (desc && desc !== "") {
      if (autoquote) {
        elem.value = `[bq][==${desc}==][/bq]`;
      } else {
        elem.value = desc;
      }
    }
    return true;
  }

  /**
   * Add an array of tags to the submission list.
   */
  function appendTags(tagArray) {
    const elem = document.getElementById("image_tag_input");
    if (elem) {
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
    return false;
  }

  /**
   * Fetch the actual image via Furbooru's fetch button.
   */
  function callFetch() {
    const elem = document.getElementById("js-scraper-preview");
    if (elem) {
      elem.click();
      return true;
    }
    return false;
  }

  /**
   * Local listener injected into the page.
   */
  function listener(request) {
    if (request.command === "contentFurbooruFetch") {
      const success =
        setFetchURL(request.data.fetchURLStr) &&
        setSourceURL(request.data.sourceURLStr) &&
        setDescription(request.data.description, request.data.autoquote) &&
        callFetch() &&
        appendTags(request.data.tags ? request.data.tags : []);
      return Promise.resolve({ success });
    }
    return Promise.reject({ isError: true, message: "Unsupported command" });
  }

  browser.runtime.onMessage.addListener(listener);
  consoleDebug("Furadder Successfully Loaded");
})();
