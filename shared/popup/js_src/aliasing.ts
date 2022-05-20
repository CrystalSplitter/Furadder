const TWITTER_TABLE: { [key: string]: string } = {
  alumx_mlp: "alumx",
  dawnf1re: "dawnfire",
  itssugarmorning: "sugar morning",
  lolliponyart: "lollipony",
  margony7: "margony",
  selenophilensfw: "selenophile",
  selenophilesfw: "selenophile",
  southpauzart: "southpauz",
  twiren_arts: "twiren",
};
const ALIAS_TABLES: { [key: string]: { [k: string]: string } } = {
  twitter: TWITTER_TABLE,
};

/**
 * Return the reduced alias author name.
 */
export function authorAlias(aliasTableName: string, authorName: string) {
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
