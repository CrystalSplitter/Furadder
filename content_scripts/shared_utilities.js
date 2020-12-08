"use strict";

function newImageObject(props) {
  return {
    // Define defaults
    src: null,
    width: 0,
    height: 0,
    fetchSrc: props.src,
    lazyLoad: false,

    // Overloads
    ...props,
  };
}

/**
 * Compare sizes of images.
 */
function sizeCompare(img1, img2) {
  const pixCount1 = img1.naturalWidth * img1.naturalHeight;
  const pixCount2 = img2.naturalWidth * img2.naturalHeight;
  if (pixCount1 < pixCount2) {
    return -1;
  }
  if (pixCount1 > pixCount2) {
    return 1;
  }
  return 0;
}
