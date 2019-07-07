import {CodeGenTemplates, CodeNode} from "./templates";
import {N, PureType, StringMap} from "../types";
import {FunctionDeclaration, Identifier} from "estree";

export class Generator {
    public input: string[];
    public overrideVariables: StringMap<PureType>;

    constructor(input: string, overrideVariables: StringMap<PureType> = {}) {
        this.input = input.split('\n');
        this.overrideVariables = overrideVariables;
    }

    /**
     * Insert function execution
     * @param node function
     * @param nodes arguments for function
     */
    public insertFunctionExecute(node: N<FunctionDeclaration>, nodes: N<Identifier>[]) {
        const defineArguments: PureType[] = [];

        nodes.forEach(p => {
            for (let v in this.overrideVariables) {
                const [line, name] = v.split(':');
                const value = this.overrideVariables[v];
                if (p.loc.start.line === +line && p.name === name) {
                    defineArguments.push(JSON.stringify(value));
                    break;
                }
            }
        });

        this.insert(CodeGenTemplates.runFuncForDebug(node, defineArguments));
    }

    /**
     * Insert generated code into end of line
     * @param node
     */
    public insert(node: CodeNode) {
        const line = node.line - 1;
        if (this.input[line].search(/[{;]$/) === -1) {
            this.input[line] += ";";
        }
        this.input[line] += node.code;
    }

    public getInput(): string {
        return this.input.join('\n')
    }
}
