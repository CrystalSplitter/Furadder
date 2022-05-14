declare var chrome: any;

export async function load<T>(d: OptionsData): Promise<T> {
  if (browser != null) {
    return browser.storage.local.get(d) as Promise<T>;
  }
  if (chrome != null) {
    return new Promise((resolve, reject) =>
      chrome.storage.local.get(d, (data: T) => {
        resolve(data), reject(`could not load ${d}`);
      })
    );
  }
  return Promise.reject(
    "Could not load. Neither 'browser' nor 'chrome' were defined"
  );
}
export async function save(d: OptionsData): Promise<void> {
  if (browser != null) {
    return browser.storage.local.set(d);
  }
  if (chrome != null) {
    return new Promise((resolve, reject) =>
      chrome.storage.local.set(d, () => {
        resolve(), reject(`could not load ${d}`);
      })
    );
  }
  return Promise.reject(
    "Could not save. Neither 'browser' nor 'chrome' were defined"
  );
}
