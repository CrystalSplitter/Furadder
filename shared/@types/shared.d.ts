interface ExtractorRequest {
  readonly command: string;
  readonly data: ExtractorRequestData;
}

interface ExtractorRequestData {
  readonly fetchType: "direct" | "general";
  readonly urlStr: string;
}

interface BackgroundRequest {
  readonly command: string;
  readonly data: any;
}

interface SubmissionRequest {
  readonly command: string;
  readonly data: PostDataProperty;
}

interface ImageObj {
  readonly src: string | null;
  readonly fetchSrc?: string | null;
  readonly width: number;
  readonly height: number;
  readonly lazyLoad: boolean;
}

interface Year {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

/**
 * Holds information meant to be sent to submission page
 */
interface PostDataProperty {
  autoquote: boolean;
  description: string;
  fetchURLStr: string;
  sourceURLStrs: string[];
  tags: string[];
}

/**
 * Holds current state of the PopUp Page.
 */
interface MetaProperty {
  currentImgIdx: number;
  fetchType: "direct" | "general";
  imgItems: ImageObj[];
  manualIdx: boolean;
  tagPreset: string[];
  readonly defaultRating: string;
  readonly defaultPreset: PresetId;
  readonly allPresets: Preset[];
}

/**
 * Image resolution.
 */
interface Resolution {
  readonly width: number;
  readonly height: number;
}

type PresetId = number & { __compileTime: any };
type Preset = { name: string; presetId: PresetId; tags: string[] };
type OptionsData = { [key: string]: any };
type PresetEntry = { furadder_custom_presets: Preset[] };
