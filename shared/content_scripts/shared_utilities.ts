/**
 * The message to send back to the extension from a content script.
 */
class Feedback {
  listenerType: string;
  images: ImageObj[];
  description: string;
  sourceLink: string;
  expectedIdx: number;
  extractedTags: string[];
  expectedResolutions: Resolution[];
  autoquote: boolean;
  authors: string[];

  constructor(args: Partial<Feedback>) {
    if (args.listenerType == null) {
      throw `listenerType cannot be ${args.listenerType}`;
    }
    this.listenerType = args.listenerType;
    this.images = args.images ?? [];
    this.description = args.description ?? "";
    this.sourceLink = args.sourceLink ?? "";
    this.expectedIdx = args.expectedIdx ?? 0;
    this.extractedTags = args.extractedTags ?? [];
    this.expectedResolutions = args.expectedResolutions ?? [];
    this.autoquote = args.autoquote ?? true;
    this.authors = args.authors ?? [];
  }

  toObject() {
    return Object.assign(this);
  }

  resolvePromise() {
    return Promise.resolve(this.toObject());
  }
}

function consoleDebug(...msg: any[]) {
  console.debug("[FUR]", ...msg);
}

function consoleError(...msg: any[]) {
  console.error("[FUR]", ...msg);
}

const MONTH_TO_NUM: { [key: string]: number } = {
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

function enUSLangYearFunc(s: string): Year | null {
  const re = /([A-Z][a-z]+)\s+([0-9]?[0-9]),\s+([0-9]+)/;
  const found = s.match(re);
  if (found && MONTH_TO_NUM[found[1].toLowerCase()] != null) {
    return {
      day: parseInt(found[2]),
      month: MONTH_TO_NUM[found[1].toLowerCase()],
      year: parseInt(found[3]),
    };
  }
  return null;
}

function enGBLangYearFunc(s: string): Year | null {
  const re = /([0-9]?[0-9]),?\s+([A-Z][a-z]+),?\s+([0-9]+)/;
  const found = s.match(re);
  if (found && MONTH_TO_NUM[found[2].toLowerCase()] != null) {
    return {
      day: parseInt(found[1]),
      month: MONTH_TO_NUM[found[2].toLowerCase()],
      year: parseInt(found[3]),
    };
  }
  return null;
}

function isoYearFunc(s: string): Year | null {
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
}

const LANGUAGE_YEAR_MAPPINGS = {
  en: enUSLangYearFunc,
  "en-US": enUSLangYearFunc,
  "en-GB": enGBLangYearFunc,
  iso8601: isoYearFunc,
};

function newImageObject(props: Partial<ImageObj>): ImageObj {
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
 * @param {HTMLImageElement} img1 Image object 1.
 * @param {HTMLImageElement} img2 Image object 2.
 * @returns {number} Comparator number.
 */
function sizeCompare(img1: HTMLImageElement, img2: HTMLImageElement): number {
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
 * Browser language types.
 */
type Lang = "en" | "en-US" | "en-GB" | "iso8601";

/**
 * Parse a date string using a region format.
 * @param {string} s Date string
 * @param {string} lang Language format (like en-US)
 * @returns {Year | null} The corresponding year object, or null.
 */
function parseDateString(s: string, lang: Lang): Year | null {
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
function genericImageExtractor(general: boolean): ImageObj[] {
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
function escapeMarkdown(s: string): string {
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
