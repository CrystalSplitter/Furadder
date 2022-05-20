export const BUILT_IN_TAG_PRESETS: Preset[] = [
  { name: "None", presetId: 0 as PresetId, tags: [] },
  {
    name: "Friendship is Magic",
    presetId: 1 as PresetId,
    tags: ["feral", "pony", "my little pony", "friendship is magic"],
  },
  { name: "Pokemon", presetId: 2 as PresetId, tags: ["pokemon"] },
  { name: "Anthro OC", presetId: 3 as PresetId, tags: ["anthro", "oc only"] },
  { name: "Feral OC", presetId: 4 as PresetId, tags: ["feral", "oc only"] },
];

/**
 * @returns A new PresetId
 */
export function makePresetId(): PresetId {
  return Math.floor(Math.random() * (1 << 30) + 100) as PresetId;
}

/**
 * @param presetId A presetId
 * @returns A string representing that presetId.
 */
export function presetIdToString(presetId: PresetId): string {
  return (presetId as number).toString();
}

/**
 * @param str Input string
 * @returns A new PresetId
 */
export function stringToPresetId(str: string): PresetId {
  return Number.parseInt(str) as PresetId;
}

/**
 * @returns An array of strings representing appendable booru tags.
 */
export function getTagsFromPreset(
  presetId: PresetId,
  allPresets: Preset[]
): string[] {
  const findFunc = (p: Preset) => p.presetId === presetId;
  const preset = allPresets.find(findFunc);
  if (preset != null) {
    return preset.tags;
  }
  console.error("[FUR]", "Could not find tags for preset", presetId);
  return [];
}
