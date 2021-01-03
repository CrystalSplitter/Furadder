const BUILT_IN_TAG_PRESETS = {
  "Friendship is Magic": [
    "feral",
    "pony",
    "my little pony",
    "friendship is magic",
  ],
  Pokemon: ["pokemon"],
  "Anthro OC": ["anthro", "oc only"],
};

/**
 * @returns An array of strings representing appendable booru tags.
 */
export function getTagsFromPreset(tagPresetName) {
  // TODO: Have profile-based tag presets.
  return BUILT_IN_TAG_PRESETS[tagPresetName];
}
