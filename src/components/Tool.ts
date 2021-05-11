import { ILineOptions, IObjectOptions, ITextboxOptions } from "fabric/fabric-impl";
import { Annotation, LineAnnotation, RectAnnotation, TextAnnotation } from "./Annotation";
import { PDFdocument } from "./PDFdocument";
import { pdf } from '@/DocumentSelector';
import Vue from "*.vue";
export interface Tool {
    defaultOptions: IObjectOptions,
    click: Function,
    mouseMove: Function,
    mouseUp: Function,
    cursor: string,
    icon: string,
    name: string, 
    tooltip: string,
    onSelect: Function,
    onDeselect: Function,
}
var vue: Vue | null = null;

export function init(VueRef: Vue){
    vue = VueRef;
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
    
//     cursor: 'pointer',
//     onSelect: (pdf: PDFdocument) => {
//         for (const page of pdf.pageCanvases) {
//             page.selection = false;
//         }
//     }
// };

export var tools: Tool[] = [
    <Tool><unknown>{
        name: 'Text',
        cursor: 'pointer',
        click: (pdf: PDFdocument, page: number) => {
            var annot = new TextAnnotation(page, selectedTool.defaultOptions, pdf.pageCanvases[page]);
            pdf.addAnnotation(annot);
            selectTool(tools[7]);
            return annot.object;
        },
        icon: 'A',
        tooltip: 'Text',
        defaultOptions: <fabric.IObjectOptions>{
            width: 0,
            height: 0,
        },
        onSelect: () => {
            console.log(pdf);
            pdf?.pageCanvases.forEach((e)=>{
                e.selection = false;
            });
        }
    },
    <Tool><unknown>{
        name: 'Draw',
        cursor: 'pointer',
        icon: 'draw',
        tooltip: 'Kreslit',
        defaultOptions: {
            stroke: '#000000',
            width: 10,
        },
        onSelect: () => {
            pdf?.pageCanvases.forEach((e) => {
                e.isDrawingMode = true;
                var ref = tools.find(e=>e.name == 'Draw');
                e.freeDrawingBrush.color = ref?.defaultOptions.stroke || '#000000';
                e.freeDrawingBrush.width = ref?.defaultOptions.width || 10;
            });
        },
        onDeselect: () => {
            pdf?.pageCanvases.forEach((e) => {
                e.isDrawingMode = false;
            });
        }
    },
    <Tool>{
        name: 'Photo',
        cursor: 'pointer',
        icon: 'add_photo_alternate',
        tooltip: 'Pridat peciatku',
    },
    <Tool><unknown>{
        name: 'Arrow',
        cursor: 'pointer',
        icon: 'north_east',
        tooltip: 'Pridat sipku',
        defaultOptions: <ILineOptions>{
            stroke: '#000000',
            strokeWidth: 5,
        },
        click: (pdf: PDFdocument, page: number) => {
            var annot = new LineAnnotation(page, selectedTool.defaultOptions, pdf.pageCanvases[page]);
            pdf.addAnnotation(annot);
            selectTool(tools[7]);
            console.log(annot.object);
            return annot.object;
        },
    },
    <Tool>{
        name: 'Circle',
        cursor: 'pointer',
        icon: 'circle',
        tooltip: 'Pridat kruh / elipsu',
    },
    <Tool><unknown>{
        name: 'Rect',
        cursor: 'pointer',
        icon: 'crop_3_2',
        tooltip: 'Pridat obdlznik',
        defaultOptions: <fabric.IObjectOptions>{
            width: 0,
            height: 0,
        },
        click: (pdf: PDFdocument, page: number) => {
            var annot = new RectAnnotation(page, selectedTool.defaultOptions, pdf.pageCanvases[page]);
            pdf.addAnnotation(annot);
            selectTool(tools[7]);
            return annot.object;
        },
    },
    <Tool>{
        name: 'Sign',
        cursor: 'pointer',
        icon: 'edit',
        tooltip: 'Pridat podpis',
    },
    <Tool><unknown>{
        name: 'Select',
        cursor: 'pointer',
        icon: 'select_all',
        tooltip: 'Vybrat objekty',
        onSelect: () => {
            console.log(pdf);
            pdf?.pageCanvases.forEach((e)=>{
                e.selection = true;
                console.log(e.selection);
            });
        }
    },
]

export var selectedTool: Tool = tools[1];

export function selectTool(tool: Tool){
    selectedTool?.onDeselect?.();
    selectedTool = tool;
    if(tool.onSelect){
        tool.onSelect();
    }
    if(vue!= null) vue.$data.selectedTool = selectedTool;
}
