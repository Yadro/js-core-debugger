import {Node} from "acorn";

export type N<T> = Node & T;

export type StringMap<T> = { [key: string]: T };

export type PureType = number | string | boolean;