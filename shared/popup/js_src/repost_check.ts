const JSON_API_BASE = "https://furbooru.org/api/v1/json";
export const IMAGES_URL = "https://furbooru.org/images/";

/**
 * @param {string} queryContent Generic, unescaped query string
 * @returns {Promise<Response>} Fetch promise of the query.
 */
export async function queryBooru(queryContent: string): Promise<Response> {
  return fetch(JSON_API_BASE + `/search?q=${queryContent}`);
}

/**
 * @param {string} artist Artist name
 * @returns {Promise<any[]>} Promise of every image by the artist.
 */
export async function getImagesByArtist(artist: string): Promise<any[]> {
  return queryBooru(`artist:${artist}`)
    .then((resp) => resp.json())
    .then((json) => {
      if (json.images.length > 0) {
        return json.images;
      }
      return [];
    });
}

/**
 * Return the Booru URL if this is a repost, otherwise return null.
 * @param {string} url Target of a potential repost
 * @returns {Promise<any | null>} Promise which contains the first
 * matching repost image, or null.
 */
export async function getPotentialRepost(url: string) {
  return sha512FromUrl(url)
    .catch((e: any) => {
      console.error(`Failed to make sha512sum for ${url}`, e);
      return Promise.reject(e);
    })
    .then((sha: Sha512Hash) => getPotentialRepostFromHash(sha));
}

// --------------------------------------------------------------------
// Private funcs
// --------------------------------------------------------------------

type Sha512Hash = string & { __compileTime: any };

/**
 * @param {string} url URL to get a blob from.
 * @returns {Promise<Sha512Hash>} Promise of sha512 string of the blob response.
 */
async function sha512FromUrl(url: string): Promise<Sha512Hash> {
  return fetch(url)
    .then((x) => x.blob())
    .then((x) => x.arrayBuffer())
    .then((x) => sha512Sum(x));
}

/**
 *
 * @param {ArrayBuffer} arrayBuffer
 * @returns {Promise<Sha512Hash>}
 */
async function sha512Sum(arrayBuffer: ArrayBuffer): Promise<Sha512Hash> {
  return crypto.subtle.digest("SHA-512", arrayBuffer).then((buf) => {
    return Array.prototype.map
      .call(new Uint8Array(buf), (x) => ("00" + x.toString(16)).slice(-2))
      .join("") as Sha512Hash;
  });
}

async function getPotentialRepostFromHash(hash: Sha512Hash): Promise<any> {
  return queryBooru(`orig_sha512_hash:${hash}+||+sha512_hash:${hash}`)
    .then((resp) => resp.json())
    .then((json) => {
      if (json.images.length > 0) {
        return json.images[0];
      }
      return null;
    });
}
