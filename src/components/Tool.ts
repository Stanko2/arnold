import { IObjectOptions, ITextboxOptions } from "fabric/fabric-impl";
import { Annotation, TextAnnotation } from "./Annotation";
import { PDFdocument } from "./PDFdocument";

export interface Tool {
    defaultOptions: IObjectOptions,
    click: Function,
    cursor: string,
    onSelect: Function
}

export var selectedTool: Tool = {
    defaultOptions: <ITextboxOptions>{
        fontSize: 14,
        fontFamily: 'Helvetica',
        text: '',
        lockRotation: true,
        width: 100,
        height: 20,
        borderColor: 'red',
        hasBorders: true,
        hasRotatingPoint: false,
    },
    click: (pdf: PDFdocument, page: number) => pdf.addAnnotation(new TextAnnotation(page, selectedTool.defaultOptions, pdf.pageCanvases[page])),
    cursor: 'pointer',
    onSelect: (pdf: PDFdocument) => {
        for (const page of pdf.pageCanvases) {
            page.selection = false;
        }
    }
};