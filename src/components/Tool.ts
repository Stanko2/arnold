import { IObjectOptions, ITextboxOptions } from "fabric/fabric-impl";
import { Annotation, TextAnnotation } from "./Annotation";
import { PDFdocument } from "./PDFdocument";

export interface Tool {
    defaultOptions: IObjectOptions,
    click: Function,
    cursor: string,
    icon: string,
    name: string, 
    tooltip: string,
    onSelect: Function,
}



// = {
//     defaultOptions: <ITextboxOptions>{
//         fontSize: 14,
//         fontFamily: 'Helvetica',
//         text: '',
//         lockRotation: true,
//         width: 100,
//         height: 20,
//         borderColor: 'red',
//         hasBorders: true,
//         hasRotatingPoint: false,
//     },
//     click: (pdf: PDFdocument, page: number) => pdf.addAnnotation(new TextAnnotation(page, selectedTool.defaultOptions, pdf.pageCanvases[page])),
//     cursor: 'pointer',
//     onSelect: (pdf: PDFdocument) => {
//         for (const page of pdf.pageCanvases) {
//             page.selection = false;
//         }
//     }
// };

export var tools: Tool[] = [
    <Tool>{
        name: 'Text',
        cursor: 'pointer',
        icon: 'A',
        tooltip: 'Text',
    },
    <Tool>{
        name: 'Draw',
        cursor: 'pointer',
        icon: 'draw',
        tooltip: 'Kreslit',
    },
    <Tool>{
        name: 'Photo',
        cursor: 'pointer',
        icon: 'add_photo_alternate',
        tooltip: 'Pridat peciatku',
    },
    <Tool>{
        name: 'Arrow',
        cursor: 'pointer',
        icon: 'north_east',
        tooltip: 'Pridat sipku',
    },
    <Tool>{
        name: 'Circle',
        cursor: 'pointer',
        icon: 'circle',
        tooltip: 'Pridat kruh / elipsu',
    },
    <Tool>{
        name: 'Rect',
        cursor: 'pointer',
        icon: 'crop_3_2',
        tooltip: 'Pridat obdlznik',
    },
    <Tool>{
        name: 'Sign',
        cursor: 'pointer',
        icon: 'edit',
        tooltip: 'Pridat podpis',
    },
    <Tool>{
        name: 'Select',
        cursor: 'pointer',
        icon: 'select_all',
        tooltip: 'Vybrat objekty',
    },
]

export var selectedTool: Tool = tools[1];

export function selectTool(tool: Tool){
    selectedTool = tool;
    if(tool.onSelect){
        tool.onSelect();
    }
}
