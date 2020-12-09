(() => {
  const IMAGE_SCRAPER_ID = "image_scraper_url";

  function setFetchURL(urlStr) {
    const elem = document.getElementById("image_scraper_url");
    if (elem) {
      elem.value = urlStr;
      elem.dispatchEvent(new Event("input"));
      return true;
    }
    return false;
  }

  function setSourceURL(urlStr) {
    const elem = document.getElementById("image_source_url");
    if (elem) {
      elem.value = urlStr;
      return true;
    }
    return false;
  }

  function setDescription(desc) {
    const elem = document.getElementById("image_description");
    if (!elem) {
      return false;
    }
    if (desc !== "") {
      elem.value = `[bq][==${desc}==][/bq]`;
    }
    return true;
  }

  function appendTags(tagArray) {
    const elem = document.getElementById("image_tag_input");
    if (elem) {
      if (tagArray.length > 0) {
        // Keep the existing value there, otherwise start empty.
        elem.value = tagArray.reduce(
          (acc, x) => acc + "," + x.toLowerCase(),
          elem.value ? elem.value : ""
        );
        elem.dispatchEvent(new Event("reload"));
      }
      return true;
    }
    return false;
  }

  function callFetch() {
    const elem = document.getElementById("js-scraper-preview");
    if (elem) {
      elem.click();
      return true;
    }
    return false;
  }

  function listener(request) {
    if (request.command === "furbooruFetch") {
      const success =
        setFetchURL(request.data.fetchURLStr) &&
        setSourceURL(request.data.sourceURLStr) &&
        setDescription(request.data.description) &&
        callFetch() &&
        appendTags(request.data.tags ? request.data.tags : []);
      return Promise.resolve({ success });
    }
    return Promise.reject({ isError: true, message: "Unsupported command" });
  }

  browser.runtime.onMessage.addListener(listener);
  console.debug("Furadder Successfully Loaded");
})();
