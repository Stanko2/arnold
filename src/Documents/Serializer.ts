import JSZip from "jszip";
import { Database } from '@/Db';
import { BackupFile, Document, DocumentBackup, DocumentParser, IScoring, ITemplate } from '@/@types';
import eventHub from '@/Mixins/EventHub';
import FileSaver from 'file-saver';
import { activeParser, AddDocument, setActiveParser } from './DocumentManager';
import store from '@/Store';
import { Packr } from 'msgpackr';
import { PMatParser } from './DocumentParser';
import { app } from "@/main";


eventHub.$on('editor:backup', createBackup);
eventHub.$on('editor:downloadZip', createZip);
const packr = new Packr();


async function createBackup(documents: Document[]): Promise<Buffer> {
    let data: BackupFile = {
        tags: store.state.tags,
        changes: {},
        scoringCriteria: store.getters.scoringCriteria,
    };
    documents.forEach(e => {
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

async function packTemplates(): Promise<Buffer> {
    const templates = await Database.getAllTemplates();
    return packr.pack(templates);
}

async function createZip(forArnold: boolean) {
    const documents = (await Database.getAllDocuments()).filter(doc => doc.problem == store.state.currentProblem);
    const zip = new JSZip();
    if (forArnold) {
        const backup = await createBackup(documents);
        const backuptemplates = await packTemplates();
        zip.file('changes.arn', backup);
        zip.file('templates.arn', backuptemplates);
        console.log('templates packing');

        const task = store.state.currentProblem.replace(/(\d)\. /, '$1-').replaceAll(' ', '-');
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
            criteria: store.getters.scoringCriteria,
            scores: pts,
        };
        zip.file('/points.json', JSON.stringify(scoring, null, '\t'));
    }

    const data = await zip.generateAsync({ type: "blob" }, (progress) => {
        eventHub.$emit('download:progress', progress.percent, progress.currentFile);
    });
    const file = new File([data], store.state.currentProblem + '_opravene.zip' || 'Opravene.zip');
    FileSaver.saveAs(file);
    eventHub.$emit('download:done');
}

async function loadTemplates(file: JSZip.JSZipObject): Promise<void> {
    const unzipped = await file.async('uint8array');
    const decoded: ITemplate[] = packr.decode(unzipped);
    for (const template of decoded) {
        await Database.updateTemplate(template)
    }
}

export async function readZip(file: File): Promise<{ docs: Document[], parser: DocumentParser }> {
    const buffer = await file.arrayBuffer();
    const zipReader = new JSZip();
    const zipFile = await zipReader.loadAsync(buffer);
    const changesBuff = zipFile.file('changes.arn');
    const backupData: BackupFile | null = changesBuff == null ? null : packr.decode(await changesBuff.async("uint8array"));
    const Documents: Document[] = [];
    let changes: Record<string, DocumentBackup> = {};
    if (backupData) {
        changes = backupData.changes;
        localStorage.setItem('tags', JSON.stringify(backupData.tags));
        store.commit('loadData');
        const templates = zipFile.file('templates.arn')
        if (templates)
            await loadTemplates(templates);
    }

    let index = 0;
    let parser: DocumentParser | undefined = undefined;
    const promises: Promise<any>[] = [];
    let failCount = 0;
    zipFile.forEach((_path, entry) => {
        if (!entry.name.endsWith('.pdf')) return;
        if (backupData && entry.name.endsWith('_graded.pdf')) return;
        if (parser == undefined) {
            var problem = entry.name.split('/')[0];
            parser = new PMatParser(problem);
            store.commit('addProblem', { name: parser.problemName, scoring: backupData?.scoringCriteria || [] });
            setActiveParser(parser);
        }
        const data = entry.async('arraybuffer');
        index++;
        promises.push(AddDocument(entry.name, data, index, parser, changes).then((doc) => {
            Documents.push(doc);
        }).catch((e) => {
            if (e.message === 'Document Already Added') {
                failCount++;

                let id: any = entry.name.split('/')[1].split('-');
                id = parseInt(id[id.length - 1].split('.')[0]);

                promises.push((async () => {
                    Documents.push(await Database.getDocument(id));
                })());
            } else {
                console.error(`Failed to load ${entry.name}`, e);
                app.$bvToast.toast(`Nepodarilo sa načítať súbor ${entry.name}`, {
                    title: 'Chyba pri načítavaní',
                    variant: 'danger',
                    solid: true,
                    autoHideDelay: 5000,
                });
            }
        }));
    });
    await Promise.all(promises);
    await Promise.all(promises); // second await to make sure all duplicates are loaded in the array
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
    app.$bvToast.toast(`${Documents.length} riešení bolo úspešne načítaných.${failCount > 0 ? ` Z nich bolo ${failCount} preskočených ako duplicitné` : ''}`, {
        title: 'Načítanie dokončené',
        variant: 'success',
        solid: true,
        autoHideDelay: 5000,
    });
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
