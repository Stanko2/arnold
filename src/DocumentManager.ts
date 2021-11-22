import { PDFdocument } from "./components/PDFdocument";
import JSZip from "jszip";
import { Database } from "./Db";
import FileSaver from "file-saver";
import { PMatParser } from "./DocumentParser";
import eventHub from "./Mixins/EventHub";
import type { IScoring, Document, DocumentParser } from "./@types";
import { store } from "./Store";


eventHub.$on('editor:setDocument', setPdf);
eventHub.$on('editor:parseDocuments', readZip);
eventHub.$on('editor:downloadZip', createZip);
eventHub.$on('editor:download', download);

async function download(id: number) {
    const curr = await Database.getDocument(id);
    FileSaver.saveAs(new Blob([curr.pdfData]), curr.originalName);
}
export let activeParser: DocumentParser;
export let Documents: Document[] = []
let pdf: null | PDFdocument = null;
let selectedDocumentIndex = -1;
async function setPdf(id: number) {
    // if (!index) {
    //     setPdf(selectedDocumentIndex);
    //     return;
    // }
    const index = Documents.findIndex(e => e.id === id);

    if (index === -1) return;
    if (index === selectedDocumentIndex) return;

    document.title = 'Arnold | ' + Documents[index].riesitel;
    selectedDocumentIndex = index;
    const data = await Database.getDocument(id);
    if (!data.opened) {
        data.opened = true;
        await Database.updateDocument(data.id, data, false);
    }
    if (pdf?.pageCanvases) {
        pdf.pageCanvases.forEach((e) => {
            e.Clear();
        });
    }
    pdf = new PDFdocument(data.initialPdf, data.id);

    eventHub.$emit('editor:documentChanged', pdf, data);
}

export function getViewedDocument() { return pdf }


export async function readZip(file: File) {
    let metaDatas: Document[] = []
    const buffer = await file.arrayBuffer();
    const zipReader = new JSZip();
    const zipFile = await zipReader.loadAsync(buffer);
    let index = 0;
    let parser: DocumentParser | undefined = undefined;
    const promises: Promise<Document>[] = [];
    console.log("hello");
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
    metaDatas = await Promise.all(promises);
    Documents = metaDatas;
    eventHub.$emit('contentParsed', metaDatas, parser);
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
        opened: false,
        timeOpened: 0
    });
    await Database.addDocument(metaDatas[metaDatas.length - 1]).catch(() => {
        throw new Error('Document Already Added');
    });
    return metaDatas[metaDatas.length - 1];
}

export async function loadFromDatabase() {
    const metaDatas: Document[] = []
    const docs = await Database.getAllDocuments();
    const categoriesData = localStorage.getItem('categories');
    if (!categoriesData) throw new Error('No categories');
    const categories = JSON.parse(categoriesData);
    for (let i = 0; i < docs.length; i++) {
        const document = docs[i];
        document.initialPdf = new ArrayBuffer(0);
        document.pdfData = new ArrayBuffer(0);
        if (categories.includes(document.kategoria))
            metaDatas.push(document);
    }
    metaDatas.sort((a: Document, b: Document) => a.index - b.index);
    Documents = metaDatas;
    activeParser = new PMatParser(localStorage.getItem('uloha') || '');
    setTimeout(() => {
        eventHub.$emit('editor:loaded', activeParser, Documents);
    }, 50);
    store.commit('loadDocuments', metaDatas);
    return metaDatas;
}

async function createZip() {
    const documents = await Database.getAllDocuments();
    const zip = new JSZip();
    const pts: Record<string, IScoring> = {};
    for (const doc of documents) {
        if (doc.scoring) {
            zip.file(doc.originalName, doc.pdfData);
            doc.scoring.comments = doc.changes.filter(c => c.type === 'Text').map(c => c.data.text);
            pts[doc.id] = doc.scoring;
            delete pts[doc.id]?.annotName;
        }
    }

    const scoring = {
        criteria: JSON.parse(localStorage.getItem('bodovanie') || '{}'),
        scores: pts,
    };
    zip.file('/points.json', JSON.stringify(scoring, null, '\t'));
    const data = await zip.generateAsync({ type: "blob" }, (progress) => {
        eventHub.$emit('download:progress', progress.percent, progress.currentFile);
    });
    const file = new File([data], localStorage.getItem('uloha') + '_opravene.zip' || 'Opravene.zip');
    FileSaver.saveAs(file);
    eventHub.$emit('download:done');
}
