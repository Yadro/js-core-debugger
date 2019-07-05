import {Node} from "acorn";

export type N<T> = Node & T;

export type StringMap<T> = { [key: string]: T };

export type PureType =
    null | undefined | number | string | boolean |
    (null | undefined | number | string | boolean)[];