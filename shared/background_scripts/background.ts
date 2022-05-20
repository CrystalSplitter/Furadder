declare var importScripts: (arg: string) => void;

try {
  if (importScripts) {
    importScripts("background_scripts/third_party/browser-polyfill.min.js");
  }
} catch (e) {
  console.log("Could not load Polyfill: ", e);
}

const SUBMISSION_TAB_TIMEOUT = 1000;
const MAX_FILL_RETRIES = 5;
const BOORU_FILL_COMMAND = "contentFurbooruFetch";

/**
 * Wrap a promise call with a timeout.
 * @param {number} ms Milliseconds to timeout on.
 * @param {Promise<T>} promise Promise to wrap and return.
 * @returns {Promise<any>} New promise, but with a timeout
 */
function promiseTimeout<T>(ms: number, promise: Promise<T>): Promise<unknown> {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
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
function booruFill<T>(tabId: number, postData: T) {
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
        .then((resp: any) => {
          if (!resp.success) {
            caller();
          }
        })
        .catch((e: any) => {
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
 * @param {string} urlStr String URL to create a new tab at.
 * @param postData Metadata to attach to the booru post.
 */
function createSubmissionTab<T>(urlStr: string, postData: T) {
  browser.tabs
    .create({ url: urlStr })
    .then((resp: browser.tabs.Tab) => {
      const tabId = resp.id;
      if (tabId !== undefined) {
        booruFill(tabId, postData);
      }
    })
    .catch((err: any) => {
      console.error("Unable to send submission message.", err);
    });
}

/**
 * Listener for all background operations.
 * Generally will expect an object with two properties:
 *    command: Unique string identifier for the type of message we're
 *      receiving.
 *    data: Data to send over to the command handler.
 * @param request Object described as above.
 * @returns A resolved promise, carrying an Object with boolean
 *  field "success".
 */
function listener(request: BackgroundRequest): Promise<{ success: boolean }> {
  if (request.command === "createSubmissionTab") {
    createSubmissionTab(request.data.urlStr, request.data.postData);
    return Promise.resolve({ success: true });
  }
  return Promise.resolve({ success: false });
}

browser.runtime.onMessage.addListener(listener);

/**
 * Handle Keyboard Shortcut Commands.
 *
 * The valid commands can be found in the manifest files.
 * @param {string} command Command name to call.
 */
function commandListener(command: string) {
  if (command === "open-popup") {
    if (browser == null) {
      console.error("[FUR]", "'browser' object is null. Did polyfill load?");
      return;
    }
    if (browser.browserAction != null) {
      browser.browserAction.openPopup();
    } else if (browser.action != null) {
      browser.action.openPopup();
    } else {
      console.error("[FUR]", "'browser' is non-null, but has no actions.");
    }
  }
}

browser.commands.onCommand.addListener(commandListener);
