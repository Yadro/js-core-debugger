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

const debugView = editor.create(document.getElementById("debug-view"), {
    language: "text",
    minimap: {
        enabled: false,
    },
    readOnly: true,
});

const debugBtn = document.getElementById("debug");

debugBtn.addEventListener("click", viewDebug);

codeEditor.addCommand(KeyCode.US_BACKTICK, viewDebug);

function viewDebug() {
    const coreDebugger = new CoreDebugger();
    try {
        coreDebugger.codeGenerate(codeEditor.getValue());
        console.log(coreDebugger._input);
    } catch (e) {
        debugView.setValue("Something went wrong with code generate. Check console F12");
        return;
    }
    try {
        const debugObject = coreDebugger.execute();
        console.log(debugObject);
        debugView.setValue(viewResult.process(debugObject));
    } catch (e) {
        debugView.setValue("Something went wrong with code execute. Check console F12");
    }
}