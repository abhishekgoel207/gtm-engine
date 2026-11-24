import { createAvatar } from "@dicebear/core";
import * as shapes from "@dicebear/shapes";

/** Abstract artwork, made locally. It never guesses what a person looks like. */
export const artFor = (seed: string): string =>
  createAvatar(shapes, {
    seed,
    backgroundColor: ["12343f", "17303b", "1b3a33"],
    shape1Color: ["1fa58c", "2c7d9a"], shape2Color: ["c9822b", "7cc7f2"], shape3Color: ["e8f4f3", "f2b24c"],
  }).toDataUri();
