const JSON_API_BASE = "https://furbooru.org/api/v1/json";
export const IMAGES_URL = "https://furbooru.org/images/";

/**
 * @param {string} queryContent Generic, unescaped query string
 * @returns {Promise<Response>} Fetch promise of the query.
 */
export async function queryBooru(queryContent) {
  return fetch(JSON_API_BASE + `/search?q=${queryContent}`);
}

/**
 * @param {string} artist Artist name
 * @returns {Promise<any[]>} Promise of every image by the artist.
 */
export async function getImagesByArtist(artist) {
  return queryBooru(`artist:${artist}`)
    .then((reps) => resp.json())
    .then((json) => {
      if (json.images.length > 0) {
        return json.images;
      }
      return [];
    });
}

async function getPotentialRepostFromHash(hash) {
  return queryBooru(`orig_sha512_hash:${hash}+||+sha512_hash:${hash}`)
    .then((resp) => resp.json())
    .then((json) => {
      if (json.images.length > 0) {
        return json.images[0];
      }
      return null;
    });
}

/**
 * Return the Booru URL if this is a repost, otherwise return null.
 * @param {string} url Target of a potential repost
 * @returns {Promise<any | null>} Promise which contains the first
 * matching repost image, or null.
 */
export async function getPotentialRepost(url) {
  return sha512FromUrl(url)
    .catch((e) => {
      console.error(`Failed to make sha512sum for ${url}`, e);
      return Promise.reject(e);
    })
    .then((sha) => getPotentialRepostFromHash(sha));
}

/**
 * @param {string} url URL to get a blob from.
 * @returns {Promise<string>} Promise of sha512 string of the blob response.
 */
async function sha512FromUrl(url) {
  return fetch(url)
    .then((x) => x.blob())
    .then((x) => x.arrayBuffer())
    .then((x) => sha512SumAsStr(x));
}

/**
 *
 * @param {ArrayBuffer} arrayBuffer
 * @returns {Promise<string>}
 */
async function sha512SumAsStr(arrayBuffer) {
  return crypto.subtle.digest("SHA-512", arrayBuffer).then((buf) => {
    return Array.prototype.map
      .call(new Uint8Array(buf), (x) => ("00" + x.toString(16)).slice(-2))
      .join("");
  });
}
