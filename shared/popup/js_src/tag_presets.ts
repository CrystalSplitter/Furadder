const BUILT_IN_TAG_PRESETS: { [key: string]: string[] } = {
  none: [],
  "friendship-is-magic": [
    "feral",
    "pony",
    "my little pony",
    "friendship is magic",
  ],
  pokemon: ["pokemon"],
  "anthro-oc": ["anthro", "oc only"],
  "feral-oc": ["feral", "oc only"],
};

/**
 * @returns An array of strings representing appendable booru tags.
 */
export function getTagsFromPreset(tagPresetName: string) {
  // TODO: Have profile-based tag presets.
  const preset = BUILT_IN_TAG_PRESETS[tagPresetName];
  if (preset) {
    return preset;
  } else {
    return [];
  }
}
