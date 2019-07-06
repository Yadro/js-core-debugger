import {DebugObject, PureType} from "./types";


export class ViewResult {
    process(debugObject: DebugObject): string {
        const result: string[][] = [];
        for (let key in debugObject) {
            const [line, variableName] = key.split(':');
            const lineNum = +line - 1;
            if (!Array.isArray(result[lineNum])) {
                result[lineNum] = [];
            }
            const values = ViewResult.valueToString(debugObject[key]);
            result[lineNum].push(`${variableName} = ${values}`);
        }

        return result.map(line => line.join('; ').concat(';')).join('\n');
    }

    static valueToString(rawValues: PureType[] | string): string {
        if (typeof rawValues === "string") {
            return rawValues;
        }
        return rawValues.map((value: PureType) => {
            if (Array.isArray(value)) {
                return JSON.stringify(value);
            } else if (typeof value === "string") {
                return `'${value}'`;
            } else {
                return '' + value;
            }
        }).join(' | ');
    }

    static arrayToString(array: any[]): string {
        const arrValues = array.map(value => {
            if (typeof value === "string") {
                return `'${value}'`;
            }
            return '' + value;
        }).join(', ');
        return `[${arrValues}]`;
    }
}