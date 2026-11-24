import { rescoreAll } from "./scoring";

/** One place to rescore. P22 adds warm-intro and displacement bonuses here. */
export const rescore = (): number => rescoreAll();
