import { editor, Range } from "monaco-editor/esm/vs/editor/editor.api";

export function createRunFnDecorator(line: number): editor.IModelDeltaDecoration {
    return {
        range: new Range(line, 1, line, 1),
        options: {
            isWholeLine: true,
            glyphMarginClassName: "glyph-run-fn",
        }
    }
}
