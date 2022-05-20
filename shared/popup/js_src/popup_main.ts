import { authorAlias } from "./aliasing.js";
import {
  getTagsFromPreset,
  stringToPresetId,
  presetIdToString,
  BUILT_IN_TAG_PRESETS,
} from "../../universal_utils/tag_presets.js";
import { load } from "../../universal_utils/storage.js";
import {
  getPotentialRepost,
  getImagesByArtists,
  IMAGES_URL,
} from "./repost_check.js";

const SUBMISSION_URL = "https://furbooru.org/images/new";
const POST_FIRST_ELEMENT = document.getElementById("post-first") as HTMLElement;
const NEXT_IMAGE_BUTTON = document.getElementById(
  "next-image-button"
) as HTMLButtonElement;
const PREV_IMAGE_BUTTON = document.getElementById(
  "prev-image-button"
) as HTMLButtonElement;
const RESOLUTION_ELEM = document.getElementById("resolution") as HTMLElement;
const THUMB_CONTAINER_ELEM = document.getElementById(
  "thumb-container"
) as HTMLElement;
const TAG_PRESETS_ELEM = document.getElementById(
  "tag-presets"
) as HTMLSelectElement;
const RATINGS_ELEM = document.getElementById("ratings") as HTMLSelectElement;
const FURBOORU_FETCH_ELEM = document.getElementById(
  "furbooru-fetch-input"
) as HTMLInputElement;
const ARTIST_IMAGES_INFO_ELEM = document.getElementById(
  "artist-images-info"
) as HTMLElement;
const SETTINGS_COG_BUTTON = document.getElementById(
  "settings-cog"
) as HTMLButtonElement;

const DIRECT_FETCH_TYPE = "direct";
const GENERAL_FETCH_TYPE = "general";

/**
 * Pull data from the tab.
 * @param tabId Tab Id to send the request to.
 * @param data Data to send to the tab's extractor.
 * @returns Feedback info from the requested tab.
 */
function extractData(
  tabId: number,
  data: ExtractorRequestData
): Promise<Feedback> {
  return browser.tabs.sendMessage(tabId, {
    command: "contentExtractData",
    data: data,
  });
}

function displayURL(urlStr: string) {
  const urlObj = new URL(urlStr);
  const elem = document.getElementById(
    "site-detector-container"
  ) as HTMLElement;
  elem.textContent = "";
  elem.appendChild(document.createTextNode(urlObj.host));
}

/**
 * Enable/disable the previous and next buttons.
 * @param {number} idx Current index
 * @param {number} length Total number of images.
 */
function resetNextPrev(idx: number, length: number) {
  if (idx === 0) {
    PREV_IMAGE_BUTTON.disabled = true;
  } else {
    PREV_IMAGE_BUTTON.disabled = false;
  }
  if (idx >= length - 1) {
    NEXT_IMAGE_BUTTON.disabled = true;
  } else {
    NEXT_IMAGE_BUTTON.disabled = false;
  }
}

function displaySelectedImg(imgItem: ImageObj) {
  if (imgItem.src != null) {
    const img = new Image();
    img.src = imgItem.src;
    clearImgDisplay();
    THUMB_CONTAINER_ELEM.appendChild(img);
  } else {
    console.log("Unable to display selected img, src is nullish");
  }
}

/**
 * Remove the pop-up main image display.
 */
function clearImgDisplay() {
  while (THUMB_CONTAINER_ELEM.firstChild) {
    THUMB_CONTAINER_ELEM.removeChild(THUMB_CONTAINER_ELEM.firstChild);
  }
}

/**
 * set the pop-up's resolution field.
 * @param {number} width Image width.
 * @param {number} height Image height.
 */
function displayRes(width: number, height: number) {
  RESOLUTION_ELEM.textContent = `${width}px \u00D7 ${height}px`;
}

function displayUnknownRes() {
  RESOLUTION_ELEM.textContent = "???px \u00D7 ???px";
}

function updateImageDisplay(imgItem: ImageObj) {
  displaySelectedImg(imgItem);
  if (imgItem.lazyLoad) {
    displayUnknownRes();
  } else {
    displayRes(imgItem.width, imgItem.height);
  }
}

function clearRes() {
  RESOLUTION_ELEM.textContent = "";
}

/**
 * Handle any promise errors.
 */
function handleError(e: any) {
  console.error("Encountered a promise error:", e);
}

/**
 * Given the handler response, set any warnings which need to be set.
 */
function dispatchWarnings(resp: Feedback, promiseMetaProp: MetaProperty) {
  clearWarnings();
  let ok = true;
  if (resp.listenerType == "universal") {
    addTextWarning(
      "Universal Extractor",
      "Some info may be missing or incorrect."
    );
    ok = false;
  }

  let hasRes = false;
  resp.expectedResolutions.forEach((resObj) => {
    hasRes =
      resp.images[promiseMetaProp.currentImgIdx].width === resObj.width &&
      resp.images[promiseMetaProp.currentImgIdx].height === resObj.height;
  });
  if (resp.listenerType == "deviantart" && !hasRes) {
    addTextWarning("Not Expected Resolution", "Check for a download button?");
    ok = false;
  }
  const activeImage = getActiveImage(promiseMetaProp);
  if (activeImage != null && activeImage.fetchSrc != null) {
    getPotentialRepost(activeImage.fetchSrc)
      .then((maybeRepost) => {
        if (maybeRepost !== null) {
          addRepostWarning("Repost Detected", `${maybeRepost.id}`);
        } else if (ok) {
          clearWarnings();
        }
        return Promise.resolve();
      })
      .catch((error) => {
        console.error("Encountered an error looking up repost:", error);
      });
  }
}

/**
 * Add a generic warning.
 * @param header Warning header. String.
 * @param node HTML Node, contents to fill the body.
 */
function addWarning(header: string, node: Node) {
  const warnHeaderElem = document.createElement("p");
  warnHeaderElem.setAttribute("class", "warning-container-header");
  const warnHeaderText = document.createTextNode(header);
  warnHeaderElem.appendChild(warnHeaderText);

  const group = document.createElement("div");
  group.appendChild(warnHeaderElem);
  group.appendChild(node);
  const warnElemContainer = document.getElementById(
    "warning-container"
  ) as HTMLElement;
  warnElemContainer.appendChild(group);
}

function addTextWarning(header: string, body: string) {
  const warnBodyElem = document.createElement("p");
  warnBodyElem.setAttribute("class", "warning-container-body");
  warnBodyElem.appendChild(document.createTextNode(body));
  addWarning(header, warnBodyElem);
}

function addRepostWarning(header: string, imageId: string) {
  const warnBodyElem = document.createElement("a");
  warnBodyElem.setAttribute("href", IMAGES_URL + imageId.toString());
  warnBodyElem.setAttribute("target", "_blank");
  warnBodyElem.setAttribute(
    "class",
    "warning-container-url warning-container-body"
  );
  warnBodyElem.appendChild(document.createTextNode(`ID# ${imageId}`));
  addWarning(header, warnBodyElem);
}

/**
 * Remove all warnings in the warning container.
 */
function clearWarnings() {
  const warnElemHeader = document.getElementById(
    "warning-container"
  ) as HTMLElement;
  const children = warnElemHeader.childNodes;
  children.forEach((x) => warnElemHeader.removeChild(x));
}

/**
 *  Set properties based on the pop-up's form entry.
 *  @param promiseMetaProp Object reference to edit the properties of.
 */
function processPopUpForm(promiseMetaProp: MetaProperty) {
  if (FURBOORU_FETCH_ELEM.checked) {
    promiseMetaProp.fetchType = GENERAL_FETCH_TYPE;
  } else {
    promiseMetaProp.fetchType = DIRECT_FETCH_TYPE;
  }
  const setTags = getTagsFromPreset(
    stringToPresetId(TAG_PRESETS_ELEM.value),
    promiseMetaProp.allPresets
  );
  const ratingTag = RATINGS_ELEM.value;
  promiseMetaProp.tagPreset = [...setTags, ratingTag];
}

/**
 * Send a submission request to the background code.
 *
 * @param postDataProp Property which holds extracted data from the source.
 * @param promiseMetaProp Property which holds meta-data, usually form info.
 * @post Sends out a message to the background extension code.
 */
function submit(postDataProp: PostDataProperty, promiseMetaProp: MetaProperty) {
  const submissionData = {
    ...postDataProp,
  };
  const lowerTags = postDataProp.tags
    .concat(promiseMetaProp.tagPreset)
    .map((x) => x.toLowerCase());
  const uniqueTags = Array.from(new Set(lowerTags));
  submissionData.tags = uniqueTags;
  const request = {
    command: "createSubmissionTab",
    data: {
      urlStr: SUBMISSION_URL,
      postData: submissionData,
    },
  };
  browser.runtime.sendMessage(request);
}

/**
 * Update everything about the postDataProp based on the promiseMetaProp,
 * in the event that promiseMetaProp changes.
 */
function updatePostDataPropFromMeta(
  postDataProp: PostDataProperty,
  promiseMetaProp: MetaProperty
) {
  resetNextPrev(promiseMetaProp.currentImgIdx, promiseMetaProp.imgItems.length);
  const selectedImg = getActiveImage(promiseMetaProp);
  if (selectedImg == null) {
    displayUnknownRes();
    clearImgDisplay();
    return;
  }
  if (promiseMetaProp.fetchType === DIRECT_FETCH_TYPE) {
    displayRes(selectedImg.width, selectedImg.height);
  } else {
    displayUnknownRes();
  }
  postDataProp.fetchURLStr = selectedImg.fetchSrc ?? "";
  updateImageDisplay(selectedImg);
}

function updateArtistCount(artists: string[]) {
  getImagesByArtists(artists)
    .catch((e) => {
      consoleError("Could not get images by artists", e);
      throw e;
    })
    .then((images) => {
      ARTIST_IMAGES_INFO_ELEM.textContent = `Uploaded images from artists: ${images.length}`;
    });
}

function updatePresetSelectOptions(defaultPreset: PresetId, presets: Preset[]) {
  // Add the custom presets
  presets.forEach((preset) => {
    const newOption = document.createElement("option");
    newOption.setAttribute("value", presetIdToString(preset.presetId));
    newOption.text = preset.name;
    TAG_PRESETS_ELEM.appendChild(newOption);
  });
  TAG_PRESETS_ELEM.value = presetIdToString(defaultPreset);
}

/**
 * Set up form buttons to bind to message sending functions and property
 * updates.
 */
function generalButtonSetup(
  promiseMetaProp: MetaProperty,
  postDataProp: PostDataProperty
) {
  SETTINGS_COG_BUTTON.addEventListener("click", () =>
    browser.runtime.openOptionsPage()
  );
  updatePresetSelectOptions(
    promiseMetaProp.defaultPreset,
    promiseMetaProp.allPresets
  );
  RATINGS_ELEM.value = promiseMetaProp.defaultRating;
  POST_FIRST_ELEMENT.addEventListener("click", () =>
    submit(postDataProp, promiseMetaProp)
  );
  NEXT_IMAGE_BUTTON.addEventListener("click", () => {
    promiseMetaProp.manualIdx = true;
    if (
      promiseMetaProp.imgItems.length > 0 &&
      promiseMetaProp.currentImgIdx < promiseMetaProp.imgItems.length - 1
    ) {
      promiseMetaProp.currentImgIdx++;
      resetNextPrev(
        promiseMetaProp.currentImgIdx,
        promiseMetaProp.imgItems.length
      );
      updatePostDataPropFromMeta(postDataProp, promiseMetaProp);
    }
  });
  PREV_IMAGE_BUTTON.addEventListener("click", () => {
    promiseMetaProp.manualIdx = true;
    if (promiseMetaProp.imgItems && promiseMetaProp.currentImgIdx > 0) {
      promiseMetaProp.currentImgIdx--;
      resetNextPrev(
        promiseMetaProp.currentImgIdx,
        promiseMetaProp.imgItems.length
      );
      updatePostDataPropFromMeta(postDataProp, promiseMetaProp);
    }
  });

  FURBOORU_FETCH_ELEM.addEventListener("change", () => {
    processPopUpForm(promiseMetaProp);
    resetPopUp(promiseMetaProp, postDataProp);
  });
  TAG_PRESETS_ELEM.addEventListener("change", () => {
    processPopUpForm(promiseMetaProp);
  });
  RATINGS_ELEM.addEventListener("change", () => {
    processPopUpForm(promiseMetaProp);
  });
}

/**
 * Handle cleanup from a failed extraction.
 */
function failureCleanup(promiseMetaProp: MetaProperty, _: any) {
  promiseMetaProp.imgItems = [];
  promiseMetaProp.currentImgIdx = 0;
  clearImgDisplay();
  resetNextPrev(0, 0);
  clearRes();
}

/*
 * Reload the popup display content.
 */
function resetPopUp(
  promiseMetaProp: MetaProperty,
  postDataProp: PostDataProperty
) {
  // Display current page content. ---------------------------------------------
  const tabsCurrent = browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  tabsCurrent
    .then((tabs) => {
      const curTab = tabs[0];
      if (curTab.url == null || curTab.id == null) {
        console.debug("curTab.url or curTab.id are nullish");
        return;
      }
      // Display the URL
      displayURL(curTab.url);

      // Extract the tab data and enable buttons.
      const requestData = {
        urlStr: curTab.url,
        fetchType: promiseMetaProp.fetchType,
      };
      extractData(curTab.id, requestData)
        .then((resp) => {
          // If we've been pressing the image selector buttons, we
          // should keep the current index.
          const expectedIdx = promiseMetaProp.manualIdx
            ? promiseMetaProp.currentImgIdx
            : resp.expectedIdx;
          promiseMetaProp.imgItems = resp.images;
          if (expectedIdx >= promiseMetaProp.imgItems.length) {
            return Promise.reject({
              isError: true,
              message: `expectedIdx ${expectedIdx} greater than num images`,
            });
          }
          promiseMetaProp.currentImgIdx = expectedIdx;

          // Handle post authors/artists ------------------------------
          const aliasedAuthors = (() => {
            if (resp.listenerType) {
              return resp.authors.map((a) => authorAlias(resp.listenerType, a));
            } else {
              return resp.authors;
            }
          })();
          aliasedAuthors.forEach((author) => {
            postDataProp.tags.push("artist:" + author);
          });

          // Handle post extracted data -------------------------------
          if (resp.extractedTags) {
            postDataProp.tags = postDataProp.tags.concat(resp.extractedTags);
          }
          postDataProp.description = resp.description;
          postDataProp.sourceURLStr = resp.sourceLink;
          postDataProp.autoquote = resp.autoquote;

          if (promiseMetaProp.imgItems.length > 0) {
            // We extracted some images! Update the display and what to
            // post.
            updatePostDataPropFromMeta(postDataProp, promiseMetaProp);
            updateArtistCount(aliasedAuthors); // ASYNC
            dispatchWarnings(resp, promiseMetaProp); // ASYNC
            return Promise.resolve({ isError: false });
          }

          // Clean up if images did not load.
          return Promise.reject({
            isError: true,
            message: "Failed to load images",
          });
        })
        .catch((e) => {
          handleError(e);
          failureCleanup(promiseMetaProp, postDataProp);
        });
    })
    .catch(handleError);
}

/**
 * @param {MetaProperty} promiseMetaProp
 * @returns The current image object.
 */
function getActiveImage(promiseMetaProp: MetaProperty): ImageObj | undefined {
  return promiseMetaProp.imgItems[promiseMetaProp.currentImgIdx];
}

function main() {
  load<any>({
    furadder_default_rating: "safe",
    furadder_default_preset: 0, // Maps to None
    furadder_custom_presets: [],
  }).then((options) => {
    // Create references to passed around properties. While they aren't global,
    // We do use them in callback captures.
    const postDataProp: PostDataProperty = {
      fetchURLStr: "",
      sourceURLStr: "",
      description: "",
      tags: [],
      autoquote: false,
    };
    const promiseMetaProp: MetaProperty = {
      currentImgIdx: 0,
      imgItems: [],
      fetchType: DIRECT_FETCH_TYPE,
      tagPreset: [],
      manualIdx: false,
      defaultRating: options.furadder_default_rating,
      defaultPreset: options.furadder_default_preset as PresetId,
      allPresets: [...BUILT_IN_TAG_PRESETS, ...options.furadder_custom_presets],
    };

    // Set up buttons. -----------------------------------------------------------
    generalButtonSetup(promiseMetaProp, postDataProp);
    processPopUpForm(promiseMetaProp);
    resetPopUp(promiseMetaProp, postDataProp);
  });
}
document.addEventListener("DOMContentLoaded", main);
