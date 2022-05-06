interface ExtractorRequest {
  command: string;
  data: any;
}

interface BackgroundRequest {
  command: string;
  data: any;
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
