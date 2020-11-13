(() => {
  const IMAGE_SCRAPER_ID = "image_scraper_url";

  function setFetchURL(urlStr) {
    const elem = document.getElementById("image_scraper_url");
    if (elem) {
      elem.value = urlStr;
      elem.dispatchEvent(new Event('input'));
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
      let success = setFetchURL(request.data.fetchURLStr) &&
        setSourceURL(request.data.sourceURLStr)
        && callFetch();
      return Promise.resolve({success});
    }
    return Promise.reject();
  }

  browser.runtime.onMessage.addListener(listener);
  console.debug("Furadder Successfully Loaded");
})();
