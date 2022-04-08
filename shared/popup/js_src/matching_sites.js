import twitterHandler from 'twitter_handler';

export const MATCHING_TABLE = [
  [/twitter/, {name: 'Twitter',
               handler: twitterHandler}],
  [/derpibooru/, {name: 'Derpibooru',
                  handler: null}],
  [/deviantart/, {name: 'DeviantArt',
                  handler: null}],
];
