import { ILineOptions, IObjectOptions, ITextboxOptions } from "fabric/fabric-impl";
import { Annotation, LineAnnotation, RectAnnotation, TextAnnotation } from "./Annotation";
import { PDFdocument } from "./PDFdocument";
import { getViewedDocument } from '@/DocumentManager';
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
    options: any,
    shortcut: string,
}
var vue: Vue | null = null;

export function init(VueRef: Vue){
    vue = VueRef;
    TextAnnotation.toolOptions = tools[0];
    LineAnnotation.toolOptions = tools[3];
    RectAnnotation.toolOptions = tools[5];
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
            console.log(pdf.pageCanvases);
            
            var annot = new TextAnnotation(page, selectedTool.defaultOptions, pdf.pageCanvases[page]);
            pdf.addAnnotation(annot);
            selectTool(tools[7]);
            return annot.object;
        },
        icon: 'A',
        tooltip: 'Text',
        defaultOptions: <fabric.ITextboxOptions>{
            width: 0,
            height: 0,
            fontFamily: 'Helvetica',
            fill: '#000000',
            fontSize: 12
        },
        onSelect: () => {
            getViewedDocument()?.pageCanvases.forEach((e)=>{
                e.selection = false;
            });
        },
        options: {
            hasFill: true,
            hasStroke: false,
            hasText: true,
            hasStrokeWidth: false,
        },
        shortcut: 'T',
    },
    <Tool><unknown>{
        name: 'Draw',
        cursor: 'pointer',
        icon: 'draw',
        tooltip: 'Kreslit',
        defaultOptions: {
            stroke: '#000000',
            strokeWidth: 10,
        },
        onSelect: () => {
            getViewedDocument()?.pageCanvases.forEach((e) => {
                e.isDrawingMode = true;
                console.log(e);
                
                var ref = tools.find(e=>e.name == 'Draw');
                e.freeDrawingBrush.color = ref?.defaultOptions.stroke || '#000000';
                e.freeDrawingBrush.width = ref?.defaultOptions.strokeWidth || 10;
            });
        },
        onDeselect: () => {
            getViewedDocument()?.pageCanvases.forEach((e) => {
                e.isDrawingMode = false;
                console.log('draw mode exited');
                
            });
        },
        options: {
            hasFill: false,
            hasStroke: true,
            hasStrokeWidth: true,
            hasText: false,
        },
        shortcut: 'D'
    },
    <Tool>{
        name: 'Photo',
        cursor: 'pointer',
        icon: 'add_photo_alternate',
        tooltip: 'Pridat peciatku',
        options: {
            hasFill: false,
            hasStroke: false,
            hasText: false,
            hasStrokeWidth: false,
        }
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
        options: {
            hasFill: false,
            hasStroke: true,
            hasStrokeWidth: true,
            hasText: false,
        }
    },
    <Tool>{
        name: 'Circle',
        cursor: 'pointer',
        icon: 'circle',
        tooltip: 'Pridat kruh / elipsu',
        options: {
            hasFill: false,
            hasStroke: false,
            hasText: false,
            hasStrokeWidth: false,
        }
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
        options: {
            hasFill: true,
            hasStroke: true,
            hasStrokeWidth: true,
            hasText: false,
        },
        shortcut: 'R',
    },
    <Tool>{
        name: 'Sign',
        cursor: 'pointer',
        icon: 'edit',
        tooltip: 'Pridat podpis',
        options: {
            hasFill: false,
            hasStroke: false,
            hasText: false,
            hasStrokeWidth: false,
        }
    },
    <Tool><unknown>{
        name: 'Select',
        cursor: 'pointer',
        icon: 'select_all',
        tooltip: 'Vybrat objekty',
        defaultOptions: {},
        onSelect: () => {
            getViewedDocument()?.pageCanvases.forEach((e)=>{
                e.selection = true;
            })
        },
        options: {
            hasFill: false,
            hasStroke: false,
            hasStrokeWidth: false,
            hasText: false,
        },
        shortcut: 'S',
    },
]

export var selectedTool: Tool = tools[1];

export function selectTool(tool: Tool){
    selectedTool?.onDeselect?.();
    selectedTool = tool;
    if(tool.onSelect){
        tool.onSelect();
    }
    if(vue!= null) {
        vue.$data.selectedTool = selectedTool;
        vue.$data.selectedOptions = selectedTool.options;
    }
}
