class Feedback {
  constructor(args) {
    this.listenerType = args.listenerType;
    this.images = args.images || [];
    this.authors = args.authors || [args.author] || null;
    this.description = args.description || null;
    this.sourceLink = args.sourceLink || null;
    this.expectedIdx = args.expectedIdx || 0;
    this.extractedTags = args.extractedTags || [];
    this.expectedResolutions = args.expectedResolutions || [];
  }

  toObject() {
    return Object.assign(this);
  }

  resolvePromise() {
    return Promise.resolve(this.toObject())
  }
};

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
