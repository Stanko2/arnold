import Vue from "vue";
import { Canvas } from "@/Canvas";
import { Database } from "@/Db";
import { fabric } from "fabric";
import { degrees, PageSizes, PDFDocument, PDFFont, PDFPage, StandardFonts } from "pdf-lib";
import { Annotation, EllipseAnnotation, ImageAnnotation, LineAnnotation, PathAnnotation, RectAnnotation, SignAnnotation, TextAnnotation } from "@/Annotation";
import type { Tool, Document } from "@/@types";
import fontKit from '@pdf-lib/fontkit';

export class PDFdocument {

    static viewport: Vue;
    static toolbarRef: any;
    static initDocument: Function;
    static activeObject: fabric.Object | undefined;
    modifyRef: PDFDocument | undefined;
    // viewref: any;
    initialized = false;
    pages: PDFPage[] = [];
    annotations: Annotation[] = [];
    pageCanvases: Canvas[] = [];
    font: PDFFont | undefined;
    get pageCount(): number {
        return this.pages.length;
    }
    pdfbytes: ArrayBuffer | null = null;
    embeddedResources: Record<string, any> = {};
    constructor(url: string | ArrayBuffer, public id: number) {
        this.init(url).then(pdf => {
            this.pdfbytes = pdf;
            console.log('PDF loaded');

            this.InitModifyRef();
        });
        this.pdfbytes = null;
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
        if (this.pdfbytes == null || this.pdfbytes.byteLength == 0) {
            console.error('PDF not loaded')
            return;
        }

        console.log(this.pdfbytes);
        this.modifyRef = await PDFDocument.load(this.pdfbytes);
        this.modifyRef.registerFontkit(fontKit)
        this.font = await this.modifyRef.embedFont(StandardFonts.Helvetica);
        TextAnnotation.font = this.font;
        this.pages = this.modifyRef.getPages();
    }

    private LoadPdfToViewport(pdfbytes: ArrayBuffer) {
        const src = new ArrayBuffer(pdfbytes.byteLength);
        new Uint8Array(src).set(new Uint8Array(pdfbytes));

        setTimeout(() => {
            PDFdocument.initDocument.call(PDFdocument.viewport, src, this);
        }, 30);
    }

    async write(annotation: Annotation) {
        const page = this.pages[annotation.page];
        await annotation.bake(page);
    }

    async save(): Promise<Document> {
        await this.InitModifyRef();
        this.embeddedResources = {};
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
        if (pdfBytes == null) throw new Error('Document not loaded');
        var currDoc = await Database.getDocument(this.id);
        const changes = currDoc.changes;
        currDoc.changes = [];
        currDoc.pdfData = pdfBytes;
        for (let i = 0; i < this.annotations.length; i++) {
            const annot = this.annotations[i];
            currDoc.changes.push(annot.serializeToJSON());
        }
        Database.updateDocument(this.id, currDoc);
        if (currDoc.changes.length == 0) {
            currDoc.changes = changes;
        }
        await this.InitModifyRef();
        return currDoc;
    }


    initCanvases() {
        for (const canvas of this.pageCanvases) {
            canvas.initEvents();
        }
        Database.getDocument(this.id).then((doc) => {
            for (let i = 0; i < doc.changes.length; i++) {
                const data = doc.changes[i];
                this.createAnotation(data.type, data.page, data);
            }
        });
        this.pageCanvases.forEach(c => {
            c.discardActiveObject();
            c.renderAll();
        });
        this.initialized = true;
    }

    createAnotation(type: string, page: number, data: any): Annotation {
        let annotation = null;
        switch (type) {
            case 'Text':
                annotation = new TextAnnotation(page, data.data, this.pageCanvases[page]);
                break;
            case 'Rect':
                annotation = new RectAnnotation(page, data.data, this.pageCanvases[page]);
                break;
            case 'Line':
                annotation = new LineAnnotation(page, data.data, this.pageCanvases[page]);
                break;
            case 'Path':
                annotation = new PathAnnotation(page, data.data, this.pageCanvases[page]);
                break;
            case 'Sign':
                annotation = new SignAnnotation(page, data.data, this.pageCanvases[page]);
                break;
            case 'Ellipse':
                annotation = new EllipseAnnotation(page, data.data, this.pageCanvases[page]);
                break;
            case 'Image':
                annotation = new ImageAnnotation(page, data.data, this.pageCanvases[page]);
                break;
            default:
                throw new Error("Unknown annotation type");

        }
        this.addAnnotation(annotation);
        return annotation;
    }

    addAnnotation(annotation: Annotation) {
        if (this.annotations.some(e => e.object.name == annotation.object.name)) {
            console.trace('trying to add duplicate annotation');
            return;
        }
        this.annotations.push(annotation);
    }

    onToolSelect(tool: Tool<fabric.IObjectOptions>) {
        tool.onSelect();
    }
    async rotatePage(i: number) {
        if (!this.pdfbytes) return;
        const currData = await Database.getDocument(this.id);
        const pdf = await PDFDocument.load(this.pdfbytes);
        const pages = pdf.getPages();
        pages[i].setRotation(degrees(pages[i].getRotation().angle + 90));
        this.pdfbytes = (await pdf.save()).buffer;
        currData.initialPdf = this.pdfbytes;
        await Database.updateDocument(this.id, currData, true);
    }

    async addPage() {
        if (!this.pdfbytes) return;
        const currData = await Database.getDocument(this.id);
        const pdf = await PDFDocument.load(this.pdfbytes);
        pdf.addPage(PageSizes.A4);
        this.pdfbytes = (await pdf.save()).buffer;
        currData.initialPdf = this.pdfbytes;
        await Database.updateDocument(this.id, currData, true);
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