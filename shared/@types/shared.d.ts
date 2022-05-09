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
  sourceURLStr: string;
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
}

/**
 * Image resolution.
 */
interface Resolution {
  readonly width: number;
  readonly height: number;
}
