import Vue from "*.vue";
import { Canvas } from "@/Canvas";
import { fabric } from "fabric";
import { PDFDocument, PDFFont, PDFPage, StandardFonts } from "pdf-lib";
import { Annotation, TextAnnotation } from "./Annotation";
import { selectedTool, Tool } from "./Tool";
var pdf = require('vue-pdf');

interface Point{
    x: number;
    y: number;
}

export class PDFdocument{
    static viewport: Vue;
    static toolbarRef: any;
    static initDocument: Function;
    static activeObject: fabric.Object;
    modifyRef: PDFDocument | undefined;
    viewref: any;
    pages: PDFPage[] = [];
    annotations: Annotation[] = [];
    pageCanvases: Canvas[] = [];
    font: PDFFont | undefined;
    get pageCount(): number {
        return this.pages.length;
    } 
    constructor(url: string | ArrayBuffer){
        this.init(url);
    }

    async init(data: string | ArrayBuffer){
        var pdfbytes = data as ArrayBuffer;
        if(data instanceof String){
            pdfbytes = await fetch(data as string).then(res => res.arrayBuffer());
        }
        
        this.LoadPdfToViewport(pdfbytes);
        
        this.modifyRef = await PDFDocument.load(pdfbytes);
        this.font = await this.modifyRef.embedFont(StandardFonts.Helvetica);
        TextAnnotation.font = this.font;
        this.pages = this.modifyRef.getPages();
    }

    private LoadPdfToViewport(pdfbytes: ArrayBuffer) {
        this.viewref = pdf.default.createLoadingTask(new Uint8Array(pdfbytes));
        var progressUpdated = false;
        this.viewref.onProgress = (progress: number) => {
            progressUpdated = true;
        };
        setTimeout(() => {
            if (!progressUpdated) {
                this.LoadPdfToViewport(pdfbytes);
                console.error('retry');
            }
            PDFdocument.initDocument.call(PDFdocument.viewport, this.viewref, this);
        }, 500);
    }

    write(annotation: Annotation){
        const page = this.pages[annotation.page];
        annotation.bake(page);
    }

    async save(){
        const previousPDF = await this.modifyRef?.save();
        for (const annotation of this.annotations) {
            this.write(annotation);
        }

        const pdfBytes = await this.modifyRef?.save();
        if(pdfBytes == null) return;
        var blob = new Blob([pdfBytes], {type: 'application/pdf'});
        var a = document.createElement("a");
        document.body.appendChild(a);
        var url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = 'opravene.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        if(previousPDF != null){
            this.modifyRef = await PDFDocument.load(previousPDF);
        }
        
    }
    initCanvases(){
        for (const canvas of this.pageCanvases) {
            canvas.initEvents();
        }
    }

    public Delete(object: Annotation) {
        var textbox = object as TextAnnotation;
        if (textbox.object.text === '') {
            textbox.delete();
            this.annotations.splice(this.annotations.indexOf(textbox), 1);
        }
    }

    addAnnotation(annotation: Annotation){
        this.annotations.push(annotation);
    }

    onToolSelect(tool: Tool){
        tool.onSelect(this);
    }   
}