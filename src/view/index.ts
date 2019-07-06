import { editor, KeyCode } from 'monaco-editor/esm/vs/editor/editor.api';

const codeEditor = editor.create(document.getElementById("editor"), {
    value: "function hello() {\n\talert('Hello world!');\n}",
    language: "javascript",
    minimap: {
        enabled: false,
    },
});

codeEditor.addCommand(KeyCode.US_BACKTICK, () => {
    debugView.setValue(codeEditor.getValue());
});

const debugView = editor.create(document.getElementById("debug-view"), {
    value: "function hello() {\n\talert('Hello world!');\n}",
    language: "text",
    minimap: {
        enabled: false,
    },
});
