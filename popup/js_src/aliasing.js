"use strict";

const TWITTER_TABLE = {
  dawnf1re: "dawnfire",
  itssugarmorning: "sugar morning",
  margony7: "margony",
};
const ALIAS_TABLES = {
  "twitter": TWITTER_TABLE,
};

/**
 * Return the reduced alias author name.
 */
export function authorAlias(aliasTableName, authorName) {
  const mapping = ALIAS_TABLES[aliasTableName][authorName.toLowerCase()];
  if (mapping) {
    return mapping;
  }
  return authorName;
}

/**
 * Slice the front of an author tag off, so it just returns the author name.
 */
export function authorTagToName(authorTag) {
  const reg = /^author:(.*)/g;
  const match = authorTag.match(reg);
  if (match && match[1]) {
    return match.groups;
  }
}
