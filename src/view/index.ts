import { editor, KeyCode } from 'monaco-editor/esm/vs/editor/editor.api';
import {CoreDebugger} from "../index";
import {ViewResult} from "../viewResult";


const viewResult = new ViewResult();

const codeEditor = editor.create(document.getElementById("editor"), {
    value: "function hello(a, b) {\n\treturn a + b;\n}",
    language: "javascript",
    minimap: {
        enabled: false,
    },
});

codeEditor.addCommand(KeyCode.US_BACKTICK, () => {
    const coreDebugger = new CoreDebugger();
    coreDebugger.codeGenerate(codeEditor.getValue());
    console.log(coreDebugger._input);
    const debugObject = coreDebugger.execute();
    console.log(debugObject);
    debugView.setValue(viewResult.process(debugObject));
});

const debugView = editor.create(document.getElementById("debug-view"), {
    value: "function hello() {\n\talert('Hello world!');\n}",
    language: "text",
    minimap: {
        enabled: false,
    },
});
