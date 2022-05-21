import { PDFdocument } from "./components/PDFdocument";
import JSZip from "jszip";
import { Database } from "./Db";
import FileSaver from "file-saver";
import { PMatParser } from "./DocumentParser";
import eventHub from "./Mixins/EventHub";
import type { IScoring, Document, DocumentParser, Tag, ScoringCriteria } from "./@types";
import store from "./Store";
import { Packr } from "msgpackr";

eventHub.$on('editor:setDocument', setPdf);
eventHub.$on('editor:downloadZip', createZip);
eventHub.$on('editor:download', download);
eventHub.$on('editor:backup', createBackup);

async function download(id: number) {
    const curr = await Database.getDocument(id);
    FileSaver.saveAs(new Blob([curr.pdfData]), curr.originalName);
}
export let activeParser: DocumentParser;
export let Documents: Document[] = []
let pdf: null | PDFdocument = null;
let selectedDocumentIndex = -1;
const packr = new Packr();
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


interface BackupFile {
    changes: Record<string, DocumentBackup>;
    tags: Tag[];
    scoringCriteria: ScoringCriteria[];
}

export async function readZip(file: File): Promise<any> {
    const buffer = await file.arrayBuffer();
    const zipReader = new JSZip();
    const zipFile = await zipReader.loadAsync(buffer);
    const changesBuff = zipFile.file('changes.arn');
    const backupData: BackupFile | null = changesBuff == null ? null : packr.decode(await changesBuff.async("uint8array"));
    let changes: Record<string, DocumentBackup> = {};
    if (backupData) {
        changes = backupData.changes;
        localStorage.setItem('tags', JSON.stringify(backupData.tags));
        localStorage.setItem('bodovanie', JSON.stringify(backupData.scoringCriteria));
    }
    store.commit('loadData');

    let index = 0;
    let parser: DocumentParser | undefined = undefined;
    const promises: Promise<any>[] = [];
    zipFile.forEach((_path, entry) => {
        if (!entry.name.endsWith('.pdf')) return;
        if (backupData && entry.name.endsWith('_graded.pdf')) return;
        if (parser == undefined) {
            localStorage.setItem('uloha', entry.name.split('/')[0])
            parser = new PMatParser(entry.name.split('/')[0]);
            activeParser = parser;
        }
        const data = entry.async('arraybuffer');
        index++;
        promises.push(AddDocument(entry.name, data, index, parser, changes).then((doc) => {
            Documents.push(doc);
        }));
    });
    await Promise.all(promises);
    if (backupData) {
        promises.splice(0, promises.length);
        zipFile.forEach((_path, entry) => {
            if (!entry.name.endsWith('_graded.pdf')) return;
            const id = parseInt(entry.name.split('/')[1].split('_')[0]);
            const operation = new Promise((resolve, reject) => {
                entry.async('arraybuffer').then(pdf => {
                    updateGradedPdf(id, pdf).then(resolve).catch(reject);
                }).catch(reject);
            })
            promises.push(operation);
        });
        await Promise.all(promises);
    }
    Documents.sort((a, b) => a.riesitel.localeCompare(b.riesitel));
    Documents.forEach((d, i) => d.index = i);
    return {
        parser: activeParser,
        docs: Documents
    }
}

async function updateGradedPdf(id: number, PDFdata: ArrayBuffer) {
    const doc = await Database.getDocument(id);
    console.log(id);
    if (doc) {
        doc.pdfData = PDFdata;
        await Database.updateDocument(id, doc, true);
    }
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
        timeOpened: change?.timeOpened || 0
    };
    if (change?.scoring) {
        doc.scoring = change.scoring;
    }
    await Database.addDocument(doc).catch(() => {
        throw new Error('Document Already Added');
    });
    return doc;
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


interface DocumentBackup {
    changes: any[];
    scoring?: IScoring;
    tags: Tag[];
    opened: boolean;
    timeOpened: number;
}

async function createBackup(): Promise<Buffer> {
    let data: BackupFile = {
        tags: store.state.tags,
        changes: {},
        scoringCriteria: store.state.scoringCriteria,
    };
    Documents.forEach(e => {
        data.changes[e.id] = e as DocumentBackup;
    });
    return packr.pack(data);
}

async function createZip(forArnold: boolean) {
    const documents = await Database.getAllDocuments();
    const zip = new JSZip();
    if (forArnold) {
        const backup = await createBackup();
        zip.file('changes.arn', backup);
        const task = localStorage.getItem('uloha');
        for (const doc of documents) {
            const name = doc.originalName.substring(0, doc.originalName.lastIndexOf('.pdf'));
            zip.file(`${task}/${name}.pdf`, doc.initialPdf);
            if (doc.changes.length > 0) {
                zip.file(`${task}/${doc.id}_graded.pdf`, doc.pdfData);
            }
        }
    }
    else {
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
    }

    const data = await zip.generateAsync({ type: "blob" }, (progress) => {
        eventHub.$emit('download:progress', progress.percent, progress.currentFile);
    });
    const file = new File([data], localStorage.getItem('uloha') + '_opravene.zip' || 'Opravene.zip');
    FileSaver.saveAs(file);
    eventHub.$emit('download:done');
}
