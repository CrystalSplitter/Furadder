"use strict";

const TWITTER_TABLE = {
  dawnf1re: "dawnfire",
  itssugarmorning: "sugar morning",
  margony7: "margony",
  southpauzart: "southpauz",
  lolliponyart: "lollipony",
  selenophilesfw: "selenophile",
  selenophilensfw: "selenophile",
};
const ALIAS_TABLES = {
  twitter: TWITTER_TABLE,
};

/**
 * Return the reduced alias author name.
 */
export function authorAlias(aliasTableName, authorName) {
  const table = ALIAS_TABLES[aliasTableName];
  if (!table) {
    return authorName;
  }
  const mapping = table[authorName.toLowerCase()];
  if (!mapping) {
    return authorName;
  }
  return mapping;
}
