"use strict";

const TWITTER_TABLE = {
  alumx_mlp: "alumx",
  dawnf1re: "dawnfire",
  itssugarmorning: "sugar morning",
  lolliponyart: "lollipony",
  margony7: "margony",
  selenophilensfw: "selenophile",
  selenophilesfw: "selenophile",
  southpauzart: "southpauz",
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
