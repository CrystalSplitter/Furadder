/**
 * The message to send back to the extension from a content script.
 */
class Feedback {
  constructor(args) {
    this.listenerType = args.listenerType;
    this.images = args.images === undefined ? [] : args.images;
    this.description = args.description === undefined ? null : args.description;
    this.sourceLink = args.sourceLink === undefined ? null : args.sourceLink;
    this.expectedIdx = args.expectedIdx === undefined ? 0 : args.expectedIdx;
    this.extractedTags =
      args.extractedTags === undefined ? [] : args.extractedTags;
    this.expectedResolutions =
      args.expectedResolutions == undefined ? [] : args.expectedResolutions;
    this.autoquote = args.autoquote === undefined ? true : args.autoquote;

    if (args.authors != undefined) {
      this.authors = args.authors;
    } else if (args.author != undefined) {
      this.authors = [args.author];
    } else {
      this.authors = [];
    }
  }

  toObject() {
    return Object.assign(this);
  }

  resolvePromise() {
    return Promise.resolve(this.toObject());
  }
}

function consoleDebug(...msg) {
  console.debug("[FUR]", ...msg);
}

function consoleError(...msg) {
  console.error("[FUR]", ...msg);
}

const MONTH_TO_NUM = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const enUSLangYearFunc = (s) => {
  const re = /([A-Z][a-z]+)\s+([0-9]?[0-9]),\s+([0-9]+)/;
  const found = s.match(re);
  if (found && MONTH_TO_NUM[found[1].toLowerCase()]) {
    return {
      day: parseInt(found[2]),
      month: parseInt(MONTH_TO_NUM[found[1].toLowerCase()]),
      year: parseInt(found[3]),
    };
  }
  return null;
};

const enGBLangYearFunc = (s) => {
  const re = /([0-9]?[0-9]),?\s+([A-Z][a-z]+),?\s+([0-9]+)/;
  const found = s.match(re);
  if (found && MONTH_TO_NUM[found[2].toLowerCase()]) {
    return {
      day: parseInt(found[1]),
      month: parseInt(MONTH_TO_NUM[found[2].toLowerCase()]),
      year: parseInt(found[3]),
    };
  }
  return null;
};

const isoYearFunc = (s) => {
  const re = /([0-9]+)-([0-9][0-9])-([0-9]+)/;
  const found = s.match(re);
  if (found) {
    return {
      day: parseInt(found[3]),
      month: parseInt(found[2]),
      year: parseInt(found[1]),
    };
  }
  return null;
};

const LANGUAGE_YEAR_MAPPINGS = {
  en: enUSLangYearFunc,
  "en-US": enUSLangYearFunc,
  "en-GB": enGBLangYearFunc,
};

function newImageObject(props) {
  return {
    // Define defaults
    src: null,
    width: 0,
    height: 0,
    fetchSrc: props.src,
    lazyLoad: false,

    // Overloads
    ...props,
  };
}

/**
 * Compare sizes of images.
 * @param {{naturalHeight, naturalWidth}} img1 Image object 1.
 * @param {{naturalHeight, naturalWidth}} img2 Image object 2.
 * @returns {number} Comparator number.
 */
function sizeCompare(img1, img2) {
  const pixCount1 = img1.naturalWidth * img1.naturalHeight;
  const pixCount2 = img2.naturalWidth * img2.naturalHeight;
  if (pixCount1 < pixCount2) {
    return -1;
  }
  if (pixCount1 > pixCount2) {
    return 1;
  }
  return 0;
}

/**
 *
 */
function parseDateString(s, lang) {
  if (LANGUAGE_YEAR_MAPPINGS[lang] === undefined) {
    return isoYearFunc(s);
  }
  return LANGUAGE_YEAR_MAPPINGS[lang](s);
}

/**
 * Retrieve a list of images from the page, sorted by size in
 * descending order.
 *
 * @param {boolean} general Use the general fetch option.
 */
function genericImageExtractor(general) {
  const arr = Array.from(document.images);
  arr.sort(sizeCompare).reverse();
  const imgObjs = arr.map((x) =>
    newImageObject({
      src: x.src,
      width: x.naturalWidth,
      height: x.naturalHeight,
      fetchSrc: general ? document.location.href : x.src,
    })
  );
  return imgObjs;
}

/**
 * Escape potential markdown text.
 * @param {string} s Input string.
 * @returns {string} Escaped string.
 */
function escapeMarkdown(s) {
  return s
    .replaceAll("*", "\\*")
    .replaceAll("-", "\\-")
    .replaceAll("_", "\\_")
    .replaceAll(">", "\\>")
    .replaceAll("#", "\\#")
    .replaceAll("[", "\\[")
    .replaceAll("`", "\\`")
    .replaceAll("]", "\\]");
}
