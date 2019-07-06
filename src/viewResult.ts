import {DebugObject} from "./types";


export class ViewResult {
    process(debugObject: DebugObject): string {
        const result: string[][] = [];
        for (let key in debugObject) {
            const [line, variableName] = key.split(':');
            const lineNum = +line - 1;
            const values = debugObject[key];
            if (!Array.isArray(result[lineNum])) {
                result[lineNum] = [];
            }
            result[lineNum].push(`${variableName} = ${values.join(' | ')}`);
        }

        return result.map(line => line.join(' ; ')).join('\n');
    }
}