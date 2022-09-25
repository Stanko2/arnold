import { PDFdocument } from "../components/PDFdocument";
import { Database } from "../Db";
import FileSaver from "file-saver";
import { PMatParser } from "./DocumentParser";
import eventHub from "../Mixins/EventHub";
import type { Document, DocumentParser, DocumentBackup } from "../@types";
import store from "../Store";
import router from '@/router';

eventHub.$on('editor:setDocument', setPdf);
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
    if (pdf && !pdf?.initialized) throw new Error("trying to load new document while current isn't initialized");

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

export function clearDocument() {
    pdf = null;
}

export async function AddDocument(fileName: string, data: ArrayBuffer | Promise<ArrayBuffer>, index: number = Documents.length, parser: DocumentParser = activeParser, changes: Record<string, DocumentBackup> | undefined = undefined) {
    const metaData = parser.parse(fileName);
    const change = changes?.[metaData.id];
    const pdf = await data;
    const doc: Document = {
        ...metaData,
        pdfData: pdf,
        initialPdf: pdf,
        index: index,
        changes: change?.changes || [],
        tags: change?.tags || [],
        opened: change?.opened || false,
        timeOpened: change?.timeOpened || 0,
        problem: store.state.currentProblem
    };
    if (change?.scoring) {
        doc.scoring = change.scoring;
    }
    await Database.addDocument(doc).catch(() => {
        throw new Error('Document Already Added');
    });
    return doc;
}

export async function loadFromDatabase(problem: string | undefined = undefined) {
    const metaDatas: Document[] = []
    let docs = await Database.getAllDocuments();
    if(problem)
        docs = docs.filter(doc => doc.problem === problem);
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

export function setActiveParser(parser: DocumentParser) {
    activeParser = parser;
}