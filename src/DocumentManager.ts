import { PDFdocument } from "./components/PDFdocument";
import JSZip, { JSZipObject } from "jszip";
import { Database } from "./Db";
import Vue from "vue";
import FileSaver from "file-saver";
import { DocumentParser, PMatParser } from "./DocumentParser";

export const eventHub = new Vue();

eventHub.$on('setDocument', setPdf);
eventHub.$on('parseDocuments', readZip);
eventHub.$on('downloadZip', createZip);
eventHub.$on('download', download);

async function download(id: number) {
    const curr = await Database.getDocument(id);
    FileSaver.saveAs(new Blob([curr.pdfData]), curr.originalName);
}
export let activeParser: DocumentParser;
export let Documents: Document[] = []
let pdf: null | PDFdocument = null;
let selectedDocumentIndex = -1;
async function setPdf(index: number) {
    if (index < 0 || index >= Documents.length) return;
    // if (index == selectedDocumentIndex) return;

    selectedDocumentIndex = index;
    var data = Documents[index];
    data.otvorene = true;
    if (pdf?.pageCanvases) {
        pdf.pageCanvases.forEach((e) => e.Clear());
    }
    pdf = new PDFdocument(data.initialPdf, data.id);

    eventHub.$emit('documentChanged', pdf, Documents[index]);
}

export function getViewedDocument() { return pdf }


export async function readZip(file: File) {
    const metaDatas: Document[] = []
    const buffer = await file.arrayBuffer();
    const zipReader = new JSZip();
    const zipFile = await zipReader.loadAsync(buffer);
    let index = 0;
    let parser: DocumentParser | undefined = undefined;
    const promises: Promise<void>[] = [];
    zipFile.forEach(async (_path, entry) => {
        if (parser == undefined) {
            localStorage.setItem('uloha', entry.name.split('/')[0])
            parser = new PMatParser(entry.name.split('/')[0]);
            activeParser = parser;
        }
        if (!entry.name.endsWith('.pdf')) return;
        const data = await entry.async('arraybuffer');
        index++;
        promises.push(AddDocument(entry.name, data, index, metaDatas, parser));
    });
    await Promise.all(promises);
    Documents = metaDatas;
}

export async function AddDocument(fileName: string, data: ArrayBuffer, index: number = Documents.length, metaDatas: Document[] = Documents, parser: DocumentParser = activeParser) {
    const metaData = parser.parse(fileName);
    metaDatas.push({
        ...metaData,
        pdfData: data,
        initialPdf: data,
        index: index,
        changes: [],
        tags: [],
        otvorene: false,
    });
    await Database.addDocument(metaDatas[metaDatas.length - 1]);
}

export async function loadFromDatabase() {
    const metaDatas: Document[] = []
    const docs = await Database.getAllDocuments();
    docs.forEach(e => {
        metaDatas.push(e);
    })
    metaDatas.sort((a: Document, b: Document) => a.index - b.index);
    Documents = metaDatas;
    activeParser = new PMatParser(localStorage.getItem('uloha') || '');
    return metaDatas;
}

async function createZip() {
    const documents = await loadFromDatabase();
    const zip = new JSZip();
    const pts: Record<string, Hodnotenie> = {};
    for (const doc of documents) {
        zip.file(doc.originalName, doc.pdfData);
        if (doc.hodnotenie) {
            doc.hodnotenie.komentare = doc.changes.filter(c => c.type === 'Text').map(c => c.data.text);
            pts[doc.id] = doc.hodnotenie;
            delete pts[doc.id]?.annotName;
        }
    }
    zip.file('/points.json', JSON.stringify(pts, null, '\t'));
    const data = await zip.generateAsync({ type: "blob" }, (progress) => {
        eventHub.$emit('zip-progress', progress.percent, progress.currentFile);
    });
    const file = new File([data], 'Opravene.zip');
    FileSaver.saveAs(file);
    eventHub.$emit('downloaded');
}


export interface Document {
    riesitel: string;
    kategoria: string;
    index: number;
    id: number;
    hodnotenie?: Hodnotenie
    pdfData: ArrayBuffer;
    initialPdf: ArrayBuffer;
    changes: any[];
    tags: any[];
    originalName: string;
    otvorene: boolean;
}

interface Hodnotenie {
    body: number;
    splnene: boolean[];
    final: boolean;
    annotName?: string;
    komentare?: string[];
}