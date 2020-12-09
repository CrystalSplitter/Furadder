"use strict";

const SUBMISSION_URL = "https://furbooru.org/images/new";
const POST_FIRST_ELEMENT = document.getElementById("post-first");
const NEXT_IMAGE_BUTTON = document.getElementById("next-image-button");
const PREV_IMAGE_BUTTON = document.getElementById("prev-image-button");
const RESOLUTION_ELEM = document.getElementById("resolution");

const DIRECT_FETCH_TYPE = "direct";
const GENERAL_FETCH_TYPE = "general";

async function extractData(tabId, data) {
  return browser.tabs.sendMessage(tabId, {
    command: "contentExtractData",
    data: data,
  });
}

function changeImage(metaDataProp, amount) {}

async function extractAuthor(tabId) {
  return browser.tabs.sendMessage(tabId, { command: "extractAuthor" });
}

function displayURL(urlStr) {
  const urlObj = new URL(urlStr);
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

function displayUnknownRes() {
  RESOLUTION_ELEM.innerHTML = "???px &#215 ???px";
}

function updateImageDisplay(imgItem) {
  displaySelectedImg(imgItem);
  if (imgItem.lazyLoad || imgItem.width === null || imgItem.height === null) {
    displayUnknownRes();
  } else {
    displayRes(imgItem.width, imgItem.height);
  }
}

function clearRes(width, height) {
  RESOLUTION_ELEM.innerHTML = "";
}

function handleError(e) {
  console.error(e);
}

function generalButtonSetup(promiseMetaProp, postDataProp) {
  POST_FIRST_ELEMENT.addEventListener("click", () => {
    const request = {
      command: "createSubmissionTab",
      data: {
        urlStr: SUBMISSION_URL,
        postData: postDataProp,
      },
    };
    browser.runtime.sendMessage(request);
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
      updateImageDisplay(selectedImg);
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
      updateImageDisplay(selectedImg);
    }
  });
}

function main() {
  // Create references to passed around properties. While they aren't global,
  // We do use them in callback captures.
  const postDataProp = {
    fetchURLStr: "",
    sourceURLStr: "",
    description: "",
    tags: [],
  };
  const promiseMetaProp = {
    currentImgIdx: null,
    imgItems: null,
    fetchType: DIRECT_FETCH_TYPE,
  };

  // Set up buttons. -----------------------------------------------------------
  generalButtonSetup(promiseMetaProp, postDataProp);

  // Display current page content. ---------------------------------------------
  const tabsCurrent = browser.tabs.query({ active: true, currentWindow: true });
  tabsCurrent
    .then((tabs) => {
      const curTab = tabs[0];
      // Display the URL
      displayURL(curTab.url);

      // Extract the tab data and enable buttons.
      const requestData = {
        urlStr: curTab.url,
        fetchType: promiseMetaProp.fetchType,
      };
      extractData(curTab.id, requestData).then((resp) => {
        const expectedIdx = resp.expectedIdx !== null ? resp.expectedIdx : 0;
        promiseMetaProp.currentImgIdx = expectedIdx;
        promiseMetaProp.imgItems = resp.images;
        if (expectedIdx >= promiseMetaProp.imgItems.length) {
          return Promise.reject({
            isError: true,
            message: `expectedIdx ${expectedIdx} greater than num images`,
          });
        }
        if (resp.author != null && resp.author != "") {
          postDataProp.tags.push("artist:" + resp.author);
        }
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
          if (promiseMetaProp.fetchType === DIRECT_FETCH_TYPE) {
            displayRes(selectedImg.width, selectedImg.height);
          } else {
            displayUnknownRes();
          }
          postDataProp.fetchURLStr = selectedImg.fetchSrc;
          updateImageDisplay(selectedImg);
          return Promise.resolve(selectedImg);
        }

        // Clean up if images did not load.
        resetNextPrev(0, 0);
        clearRes();
        return Promise.reject({
          isError: true,
          message: "Failed to load images",
        });
      });
    })
    .catch(handleError);
}
document.addEventListener("DOMContentLoaded", main);
