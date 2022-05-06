interface ExtractorRequest {
  command: string;
  data: any;
}

interface BackgroundRequest {
  command: string;
  data: any;
}

interface SubmissionRequest {
  command: string;
  data: PostDataProperty;
}

interface ExtractorResponse {
  expectedIdx: number;
}

interface ImageObj {
  src: string | null;
  fetchSrc?: string | null;
  width: number;
  height: number;
  lazyLoad: boolean;
}

interface Year {
  year: number;
  month: number;
  day: number;
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
 * Image resolution.
 */
interface Resolution {
  width: number;
  height: number;
}
