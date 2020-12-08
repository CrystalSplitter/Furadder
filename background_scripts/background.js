const SUBMISSION_TAB_TIMEOUT = 1000;
const MAX_FILL_RETRIES = 5;
const BOORU_FILL_COMMAND = "contentFurbooruFetch";

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
      }, ms);
    }),
  ]);
}

/**
 * Fill the booru submission page with relevant info.
 * If it fails to fill the submission, it will try again
 * until it's tried MAX_FILL_RETRIES number of times.
 */
function booruFill(tabId, postData) {
  const contentMsg = {
    command: BOORU_FILL_COMMAND,
    data: postData,
  };
  let retryCount = 0;
  const caller = () => {
    if (retryCount >= MAX_FILL_RETRIES) {
      return;
    }
    retryCount++;
    setTimeout(() => {
      promiseTimeout(
        SUBMISSION_TAB_TIMEOUT,
        browser.tabs.sendMessage(tabId, contentMsg)
      )
        .then((resp) => {
          if (!resp.success) {
            caller();
          }
        })
        .catch((e) => {
          if (
            e.isTimeout ||
            (e.message && e.message.includes("Receiving end does not exist"))
          ) {
            // If we timeout or we don't have a receiving end, try again later.
            caller();
          } else {
            throw e;
          }
        });
    }, SUBMISSION_TAB_TIMEOUT);
  };
  caller();
}

/**
 * Open a new submission tab.
 * @param urlStr String URL to create a new tab at.
 * @param postData Metadata to attach to the booru post.
 */
function createSubmissionTab(urlStr, postData) {
  let tabId = null;
  browser.tabs
    .create({ url: urlStr })
    .then((resp) => {
      tabId = resp.id;
      booruFill(tabId, postData);
    })
    .catch((err) => {
      console.error("Unable to send submission message.", err);
    });
}

/**
 * Receiver for all background operations.
 * Generally will expect an object with two properties:
 *    command: Unique string identifier for the type of message we're
 *      receiving.
 *    data: Data to send over to the command handler.
 */
function listener(request) {
  if (request.command === "createSubmissionTab") {
    createSubmissionTab(request.data.urlStr, request.data.postData);
    return Promise.resolve({ success: true });
  }
  return Promise.resolve({ success: false });
}

browser.runtime.onMessage.addListener(listener);
