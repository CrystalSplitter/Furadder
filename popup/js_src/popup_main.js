"use strict";

document.addEventListener("DOMContentLoaded", main);
const EXTENSION_ID = "furadder";
const SUBMISSION_URL = "https://furbooru.org/images/new";
const POST_FIRST_ELEMENT = document.getElementById("post-first");
const NEXT_IMAGE_BUTTON = document.getElementById("next-image-button");
const PREV_IMAGE_BUTTON = document.getElementById("prev-image-button");
const RESOLUTION_ELEM = document.getElementById("resolution");

async function extractData(tabId, options) {
  return browser.tabs.sendMessage(tabId, {
    command: "extractData",
    urlStr: options ? options.urlStr : null,
  });
}

function changeImage(metaDataProp, amount) {}

async function extractAuthor(tabId) {
  return browser.tabs.sendMessage(tabId, { command: "extractAuthor" });
}

/**
 * Wrap a promise call with a timeout.
 * @param ms Milliseconds to timeout on.
 * @param promise Promise to wrap and return.
 */
function promiseTimeout(ms, promise) {
  return Promise.race([
    promise,
    new Promise((resolve, reject) => {
      const id = setTimeout(() => {
        clearTimeout(id);
        reject({ isTimeout: true });
      });
    }),
  ]);
}

function booruFill(tabId, postData) {
  const timeout = 2000;
  const msg = {
    command: "furbooruFetch",
    data: postData,
  };
  const caller = () => {
    console.log("calling again");
    setTimeout(() => {
      console.log("in timeout");
      promiseTimeout(timeout, browser.tabs.sendMessage(tabId, msg))
        .then((resp) => {
          if (!resp.success) {
            caller();
          } else {
            outputPromise.resolve();
          }
        })
        .catch((e) => {
          console.log("cought error in booruFill", e);
          caller();
        });
    }, timeout);
  };
  caller();
}

function createSubmissionTab(url, postData) {
  let tabId = null;
  browser.tabs
    .create({ url })
    .then((resp) => {
      tabId = resp.id;
      console.log("tab created, in then...");
      booruFill(tabId, postData);
    })
    //.then(() => {
    //  console.log("Executing script", tabId);
    //  return browser.tabs.executeScript(tabId, {file: "/popup/js_src/furbooru_inject.js"});
    //})
    .catch((err) => {
      console.error("Unable to send submission message.", err);
    });
}

function displayURL(urlObj) {
  const elem = document.getElementById("site-detector-container");
  elem.appendChild(document.createTextNode(urlObj.host));
}

/**
 * Reset the previous and next buttons.
 */
function resetNextPrev(idx, length) {
  if (idx === 0) {
    PREV_IMAGE_BUTTON.disabled = true;
  } else {
    PREV_IMAGE_BUTTON.disabled = false;
  }
  if (idx === length - 1) {
    NEXT_IMAGE_BUTTON.disabled = true;
  } else {
    NEXT_IMAGE_BUTTON.disabled = false;
  }
}

function displaySelectedImg(imgItem) {
  const img = new Image();
  img.src = imgItem.src;
  img.style = "max-width: 200px";
  const elem = document.getElementById("thumb-container");
  while (elem.firstChild) {
    elem.removeChild(elem.firstChild);
  }
  elem.appendChild(img);
}

function displayRes(width, height) {
  RESOLUTION_ELEM.innerHTML = `${width}px &#215 ${height}px`;
}

function clearRes(width, height) {
  RESOLUTION_ELEM.innerHTML = "";
}

function handleError(e) {
  console.error(e);
}

function main() {
  // Create references to passed around properties. While they aren't global,
  // We do use them in callback captures.
  const postDataProp = {};
  const promiseMetaProp = {
    currentImgIdx: null,
    imgItems: null,
  };

  POST_FIRST_ELEMENT.addEventListener("click", () => {
    createSubmissionTab(SUBMISSION_URL, postDataProp);
  });

  NEXT_IMAGE_BUTTON.addEventListener("click", () => {
    if (
      promiseMetaProp.imgItems &&
      promiseMetaProp.currentImgIdx < promiseMetaProp.imgItems.length - 1
    ) {
      if (promiseMetaProp.currentImgIdx !== null) {
        promiseMetaProp.currentImgIdx++;
        resetNextPrev(
          promiseMetaProp.currentImgIdx,
          promiseMetaProp.imgItems.length
        );
      }
      const selectedImg =
        promiseMetaProp.imgItems[promiseMetaProp.currentImgIdx];
      displaySelectedImg(selectedImg);
      displayRes(selectedImg.width, selectedImg.height);
    }
  });
  PREV_IMAGE_BUTTON.addEventListener("click", () => {
    if (promiseMetaProp.imgItems && promiseMetaProp.currentImgIdx > 0) {
      if (promiseMetaProp.currentImgIdx !== null) {
        promiseMetaProp.currentImgIdx--;
        resetNextPrev(
          promiseMetaProp.currentImgIdx,
          promiseMetaProp.imgItems.length
        );
      }
      const selectedImg =
        promiseMetaProp.imgItems[promiseMetaProp.currentImgIdx];
      displaySelectedImg(selectedImg);
      displayRes(selectedImg.width, selectedImg.height);
    }
  });

  const tabsCurrent = browser.tabs.query({ active: true, currentWindow: true });
  tabsCurrent
    .then((tabs) => {
      // Display the URL
      const tabURL = new URL(tabs[0].url);
      displayURL(tabURL);

      // Extract the tab data and enable buttons.
      extractData(tabs[0].id, { urlStr: tabs[0].url }).then((resp) => {
        const expectedIdx = resp.expectedIdx !== null ? resp.expectedIdx : 0;
        promiseMetaProp.currentImgIdx = expectedIdx;
        promiseMetaProp.imgItems = resp.images;
        if (expectedIdx >= promiseMetaProp.imgItems.length) {
          return Promise.reject();
        }

        postDataProp.author = resp.author;
        postDataProp.description = resp.description;
        postDataProp.sourceURLStr = resp.sourceLink;

        if (
          promiseMetaProp.imgItems &&
          promiseMetaProp.currentImgIdx !== null
        ) {
          // We've successfully loaded images!
          resetNextPrev(
            promiseMetaProp.currentImgIdx,
            promiseMetaProp.imgItems.length
          );
          const selectedImg =
            promiseMetaProp.imgItems[promiseMetaProp.currentImgIdx];
          displayRes(selectedImg.width, selectedImg.height);
          console.log("selectedImg", selectedImg);
          postDataProp.fetchURLStr = selectedImg.src;
          displaySelectedImg(selectedImg);
          return Promise.resolve(selectedImg);
        } else {
          // Clean up if images did not load.
          resetNextPrev(0, 0);
          clearRes();
        }
        return Promise.reject();
      });
    })
    .catch(handleError);
}
