import {
  makePresetId,
  stringToPresetId,
  presetIdToString,
  BUILT_IN_TAG_PRESETS,
} from "../universal_utils/tag_presets.js";
import { load, save } from "../universal_utils/storage.js";

const PRESET_TAGS_INPUT_ELEM =
  document.querySelector<HTMLTextAreaElement>("#preset-tags-input")!;
const PRESET_NAME_INPUT_ELEM =
  document.querySelector<HTMLInputElement>("#preset-name-input")!;
const SELECTED_PRESET_ELEM =
  document.querySelector<HTMLSelectElement>("#selected-preset")!;
const DEFAULT_PRESET_ELEM =
  document.querySelector<HTMLSelectElement>("#default-preset")!;
const DEFAULT_RATING_ELEM =
  document.querySelector<HTMLSelectElement>("#default-rating")!;

function saveNewPresetWrapper() {
  const tags = PRESET_TAGS_INPUT_ELEM.value
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t !== "" && t !== ",");
  const name = PRESET_NAME_INPUT_ELEM.value;
  saveNewPreset(name, tags).then(() => console.log("Saved preset!"));
}

async function saveNewPreset(name: string, tags: string[]): Promise<number> {
  if (name === "" || name == null) {
    return Promise.reject("Can't save new preset without name");
  }
  const customPresets = await load<PresetEntry>({
    furadder_custom_presets: [],
  });
  const dedupedTags = Array.from(new Set(tags));
  dedupedTags.sort();
  const newPreset: Preset = {
    name,
    presetId: makePresetId(),
    tags: dedupedTags,
  };
  customPresets.furadder_custom_presets.push(newPreset);
  await save(customPresets);
  await updateAllDisplayPresetLists();
  // Have to correct the selection so that the selected preset goes
  // to the new value.
  SELECTED_PRESET_ELEM.value = presetIdToString(newPreset.presetId);
  toggleSaveChangePresetButton(false);
  return Promise.resolve(customPresets.furadder_custom_presets.length - 1);
}

async function updatePresetWrapper() {
  const tags = PRESET_TAGS_INPUT_ELEM.value
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t !== "" && t !== ",");
  const name = PRESET_NAME_INPUT_ELEM.value;
  await updatePreset(getDisplaySelectedPreset(), name, tags);
  console.log("Saved preset!");
  toggleSaveChangePresetButton(false);
}

function deletePresetWrapper() {
  load<PresetEntry>({ furadder_custom_presets: [] })
    .then((presetEntry) => {
      const presetId = getDisplaySelectedPreset();
      const newPresets = presetEntry.furadder_custom_presets.filter(
        (p) => p.presetId != presetId
      );
      presetEntry.furadder_custom_presets = newPresets;
      return presetEntry;
    })
    .then((presetEntry) => save(presetEntry))
    .then(() => {
      updateAllDisplayPresetLists();
      setDisplayPresetInfo(null);
    });
}

async function updatePreset(
  presetId: PresetId,
  newName: string,
  tags: string[]
): Promise<void> {
  const customPresets = await load<PresetEntry>({
    furadder_custom_presets: [],
  });
  const existingPreset = customPresets.furadder_custom_presets.find(
    (p) => p.presetId == presetId
  );
  if (existingPreset == null) {
    return Promise.reject(
      `Could not find preset with ID ${presetIdToString(presetId)}`
    );
  }
  existingPreset.name = newName;
  const dedupedTags = Array.from(new Set(tags));
  dedupedTags.sort();
  existingPreset.tags = dedupedTags;
  await save(customPresets);
  toggleSaveChangePresetButton(false);
  await updateAllDisplayPresetLists();
}

function getDisplayDefaultRating(): string {
  return DEFAULT_RATING_ELEM.value ?? "safe";
}

function getDisplayDefaultPreset(): PresetId {
  return stringToPresetId(DEFAULT_PRESET_ELEM.value ?? "-1");
}

function getDisplaySelectedPreset(): PresetId {
  return stringToPresetId(SELECTED_PRESET_ELEM?.value ?? "-1");
}

function setDisplayPresetInfoFromEvent(event: Event) {
  setDisplayPresetInfo(stringToPresetId((event.target as any).value as string));
}

async function setDisplayPresetInfo(presetId: PresetId | null) {
  function setField(
    presetEntry: PresetEntry,
    elem: HTMLTextAreaElement | HTMLInputElement,
    f: (p: Preset) => string
  ) {
    const revisedPresetId = presetId ?? getDisplaySelectedPreset();
    if (revisedPresetId === (-1 as PresetId)) {
      elem.value = "";
      return;
    }
    const preset = presetEntry.furadder_custom_presets.find(
      (preset) => preset.presetId === revisedPresetId
    );
    if (preset == null) {
      elem.value = "";
      return;
    }
    elem.value = f(preset);
  }
  const presetEntry = await load<PresetEntry>({ furadder_custom_presets: [] });
  setField(presetEntry, PRESET_TAGS_INPUT_ELEM, (p) => p.tags.join(",\n"));
  setField(presetEntry, PRESET_NAME_INPUT_ELEM, (p) => p.name);
}

/**
 * Update the page preset lists to whatever is in the Storage Area.
 * @returns Empty promise.
 */
async function updateAllDisplayPresetLists() {
  const presetEntry = await load<PresetEntry>({
    furadder_custom_presets: [],
  });
  updateDisplayPresetList(DEFAULT_PRESET_ELEM, [
    ...BUILT_IN_TAG_PRESETS,
    ...presetEntry.furadder_custom_presets,
  ]);
  updateDisplayPresetList(
    SELECTED_PRESET_ELEM,
    presetEntry.furadder_custom_presets
  );
  toggleDeletePresetButton(true);
}

/**
 * Update an individual select element with new preset data.
 * @param elem Element to set the fields of.
 * @param presetEntry Preset data to fill the list with.
 * @returns boolean indicating whether the selector is enabled by the end.
 */
function updateDisplayPresetList(
  elem: HTMLSelectElement,
  presets: Preset[]
): boolean {
  const current = elem.value ? stringToPresetId(elem.value) : (-1 as PresetId);
  // Clear all children
  while (elem.firstChild) {
    elem.removeChild(elem.firstChild);
  }
  // Add the custom presets
  presets.forEach((preset) => {
    const newOption = document.createElement("option");
    newOption.setAttribute("value", presetIdToString(preset.presetId));
    newOption.text = preset.name;
    elem.appendChild(newOption);
  });
  if (presets.find((preset) => preset.presetId === current)) {
    elem.value = presetIdToString(current);
  }
  const selectorDisabled = presets.length === 0;
  elem.disabled = selectorDisabled;
  return !selectorDisabled;
}

function saveAllOptions() {
  const data: OptionsData = {
    furadder_default_rating: getDisplayDefaultRating(),
    furadder_default_preset: getDisplayDefaultPreset(),
  };
  save(data);
}

function dirtyPresetInputs() {
  toggleSaveChangePresetButton(true);
  toggleNewPresetButton(true);
  toggleDeletePresetButton(true);
}

function toggleSaveChangePresetButton(enabled: boolean) {
  const button = document.querySelector<HTMLButtonElement>("#save-changes")!;
  if (
    SELECTED_PRESET_ELEM.value &&
    PRESET_TAGS_INPUT_ELEM.value &&
    PRESET_NAME_INPUT_ELEM.value
  ) {
    button.disabled = !enabled;
  } else {
    button.disabled = true;
  }
}
function toggleNewPresetButton(enabled: boolean) {
  const button = document.querySelector<HTMLButtonElement>("#new-preset")!;
  if (PRESET_TAGS_INPUT_ELEM.value && PRESET_NAME_INPUT_ELEM.value) {
    button.disabled = !enabled;
  } else {
    button.disabled = true;
  }
}
function toggleDeletePresetButton(enabled: boolean) {
  const button = document.querySelector<HTMLButtonElement>("#delete-preset")!;
  if (SELECTED_PRESET_ELEM.value) {
    button.disabled = !enabled;
  } else {
    button.disabled = true;
  }
}

document
  .getElementById("new-preset")!
  .addEventListener("click", saveNewPresetWrapper);
document
  .getElementById("save-changes")!
  .addEventListener("click", updatePresetWrapper);
document
  .getElementById("delete-preset")!
  .addEventListener("click", deletePresetWrapper);
document
  .getElementById("save-options")!
  .addEventListener("click", saveAllOptions);
document
  .getElementById("selected-preset")!
  .addEventListener("change", setDisplayPresetInfoFromEvent);
document
  .getElementById("preset-name-input")!
  .addEventListener("input", dirtyPresetInputs);
document
  .getElementById("preset-tags-input")!
  .addEventListener("input", dirtyPresetInputs);

updateAllDisplayPresetLists()
  .then(() => setDisplayPresetInfo(null))
  .then(() => toggleNewPresetButton(true));
