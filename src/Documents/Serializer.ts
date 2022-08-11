import JSZip from "jszip";
import { Database } from '@/Db';
import { IScoring, DocumentParser, BackupFile, DocumentBackup } from '@/@types';
import eventHub from '@/Mixins/EventHub';
import FileSaver from 'file-saver';
import { Documents, activeParser, AddDocument, setActiveParser } from './DocumentManager';
import store from '@/Store';
import { Packr } from 'msgpackr';
import { PMatParser } from './DocumentParser';


eventHub.$on('editor:backup', createBackup);
eventHub.$on('editor:downloadZip', createZip);
const packr = new Packr();


async function createBackup(): Promise<Buffer> {
    let data: BackupFile = {
        tags: store.state.tags,
        changes: {},
        scoringCriteria: store.state.scoringCriteria,
    };
    Documents.forEach(e => {
        data.changes[e.id] = {
            changes: e.changes,
            opened: e.opened,
            tags: e.tags,
            timeOpened: e.timeOpened,
            scoring: e.scoring
        };
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
            zip.file(`${task}/${doc.originalName}`, doc.initialPdf);
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
            setActiveParser(parser);
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
