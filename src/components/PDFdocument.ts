import Vue from "vue";
import { Canvas } from "@/Canvas";
import { Database } from "@/Db";
import { fabric } from "fabric";
import { BlendMode, LineCapStyle, LineJoinStyle, PDFDocument, PDFFont, PDFPage, StandardFonts } from "pdf-lib";
import { Annotation, LineAnnotation, PathAnnotation, RectAnnotation, SignAnnotation, TextAnnotation } from "./Annotation";
import { Tool } from "./Tools/Tool";
import fontKit from '@pdf-lib/fontkit';

var pdf = require('pdfvuer');

export class PDFdocument {

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
    pdfbytes: ArrayBuffer | undefined;
    embeddedResources: Record<string, any> = {};
    constructor(url: string | ArrayBuffer, public id: number) {
        this.init(url).then(pdf => {
            this.pdfbytes = pdf;
            this.InitModifyRef();
        });
        this.pdfbytes = undefined;
    }

    async init(data: string | ArrayBuffer) {
        var pdfbytes = data as ArrayBuffer;

        if (data instanceof String) {
            pdfbytes = await fetch(data as string).then(res => res.arrayBuffer());
        }
        this.LoadPdfToViewport(pdfbytes);
        return pdfbytes
    }

    private async InitModifyRef() {
        if (this.pdfbytes == null) {
            console.error('PDF not loaded')
            return;
        }
        this.modifyRef = await PDFDocument.load(this.pdfbytes);
        this.modifyRef.registerFontkit(fontKit)
        this.font = await this.modifyRef.embedFont(StandardFonts.Helvetica);
        TextAnnotation.font = this.font;
        this.pages = this.modifyRef.getPages();
        this.embeddedResources = {
            'Courier New': await this.modifyRef.embedFont(StandardFonts.Courier),
            'Times New Roman': await this.modifyRef.embedFont(StandardFonts.TimesRoman),
            'Helvetica': await this.modifyRef.embedFont(StandardFonts.Helvetica),
        }
    }

    private LoadPdfToViewport(pdfbytes: ArrayBuffer) {
        this.viewref = pdf.createLoadingTask({ data: new Uint8Array(pdfbytes) });
        var progressUpdated = false;
        this.viewref.onProgress = (progress: number) => {
            progressUpdated = true;
        };
        setTimeout(() => {
            // if (!progressUpdated) {
            //     this.LoadPdfToViewport(pdfbytes);
            //     console.error('retry');
            //     return;
            // }
            PDFdocument.initDocument.call(PDFdocument.viewport, this.viewref, this);
        }, 500);
    }

    async write(annotation: Annotation) {
        const page = this.pages[annotation.page];
        await annotation.bake(page);
    }

    async save() {
        await this.InitModifyRef();

        for (const annotation of this.annotations) {
            await this.write(annotation);
        }
        // for (let i = 0; i < this.pageCanvases.length; i++) {
        //     const canvas = this.pageCanvases[i];
        //     const height = this.pages[i].getHeight();
        //     for (const shape of canvas.drawnShapes) {

        //     }
        // }
        const pdfBytes = await this.modifyRef?.save();
        if (pdfBytes == null) return;
        var currDoc = await Database.getDocument(this.id);
        currDoc.changes = [];
        currDoc.pdfData = pdfBytes;
        for (let i = 0; i < this.annotations.length; i++) {
            const annot = this.annotations[i];
            currDoc.changes.push(annot.serializeToJSON());
        }
        Database.updateDocument(this.id, currDoc);
        // var blob = new Blob([pdfBytes], {type: 'application/pdf'});
        // var a = document.createElement("a");
        // document.body.appendChild(a);
        // var url = window.URL.createObjectURL(blob);
        // a.href = url;
        // a.download = `opravene_${Math.random() * 1000000}.pdf`;
        // a.click();
        // window.URL.revokeObjectURL(url);
        // document.body.removeChild(a);

        await this.InitModifyRef();
    }


    initCanvases() {
        for (const canvas of this.pageCanvases) {
            canvas.initEvents();
        }
        Database.getDocument(this.id).then((doc) => {
            for (let i = 0; i < doc.changes.length; i++) {
                const data = doc.changes[i];
                var annotation = null;
                switch (data.type) {
                    case 'Text':
                        annotation = new TextAnnotation(data.page, data.data, this.pageCanvases[data.page]);
                        break;
                    case 'Rect':
                        annotation = new RectAnnotation(data.page, data.data, this.pageCanvases[data.page]);
                        break;
                    case 'Line':
                        annotation = new LineAnnotation(data.page, data.data, this.pageCanvases[data.page]);
                        break;
                    case 'Path':
                        annotation = new PathAnnotation(data.page, data.data, this.pageCanvases[data.page]);
                        break;
                    case 'Sign':
                        annotation = new SignAnnotation(data.page, data.data, this.pageCanvases[data.page]);
                        break;
                    default:
                        break;
                }
                if (annotation != null) this.addAnnotation(annotation);
            }
        });
        this.pageCanvases.forEach(c => c.discardActiveObject());
    }

    addAnnotation(annotation: Annotation) {
        if (this.annotations.some(e => e.object.name == annotation.object.name)) {
            console.trace('trying to add duplicate annotation');
            return;
        }
        this.annotations.push(annotation);
    }

    onToolSelect(tool: Tool) {
        tool.onSelect();
    }

    deleteAnnotation(name: string) {
        var annotation = this.annotations.find(e => e.object.name === name);
        if (annotation == null) {
            console.error('Annotation not found');
            return;
        }
        annotation.delete();
        this.annotations.splice(this.annotations.indexOf(annotation), 1);
    }
}