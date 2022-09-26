import { Document, ITemplate } from '@/@types';

class DB {

    private IndxDb: IDBFactory;
    public db: IDBDatabase | null;
    constructor() {
        this.IndxDb = window.indexedDB;
        this.db = null;
        this.initDb();
    }

    initDb(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            var req = this.IndxDb.open("riesenia", 2);
            var md = this;
            req.onupgradeneeded = function (e: any) {
                md.db = e.target.result;
                var riesenia = md.db?.createObjectStore('riesenia', { keyPath: 'id' })
                riesenia?.createIndex('id', 'id', { unique: true });
                riesenia?.createIndex('riesitel', 'riesitel', { unique: false });
                var templates = md.db?.createObjectStore('templates', { keyPath: 'id' });
                templates?.createIndex('id', 'id', { unique: true });
                resolve();
            }
            req.onsuccess = function (e: any) {
                md.db = e.target.result;
                md.db?.transaction('riesenia', 'readwrite').objectStore('riesenia');
                resolve();
            }
            req.onerror = function (event: any) {
                // Generic error handler for all errors targeted at this database's
                // requests!
                reject("Database error: " + event.target.errorCode);
            };
        })
    }

    async addDocument(doc: Document): Promise<void> {
        return new Promise((resolve, reject) => {
            const riesenia = this.db?.transaction('riesenia', 'readwrite').objectStore('riesenia');
            const res = riesenia?.add(doc);
            if (res) {
                res.onerror = (e) => {
                    reject(e); console.log(doc.id);
                };
                res.onsuccess = () => resolve();
            }
            else reject();
        })
    }
    async getDocument(id: number): Promise<Document> {
        var req = this.db?.transaction('riesenia', 'readonly').objectStore('riesenia');
        return new Promise<Document>((resolve, reject) => {
            var doc = req?.get(id);
            if (doc == null) {
                reject('no docs found');
                return;
            }
            else {
                doc.onsuccess = () => {
                    resolve(doc?.result as Document);
                }
            }
        });
    }

    async removeDocument(id: number): Promise<void> {
        var req = this.db?.transaction('riesenia', 'readwrite').objectStore('riesenia');
        return new Promise<void>((resolve, reject) => {
            var doc = req?.delete(id);
            if (doc == null) {
                reject('no docs found');
                return;
            }
            else {
                doc.onsuccess = () => {
                    resolve();
                }
            }
        });
    }

    async updateDocument(id: number, doc: Document, updatePDFchanges: boolean = true): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const req = this.db?.transaction('riesenia', 'readwrite').objectStore('riesenia');
            if (req?.get(id) == null) {
                reject('modifying nonexistent document');
            }
            if (!updatePDFchanges) {
                this.getDocument(id).then(curr => {
                    doc.changes = curr.changes;
                    doc.pdfData = curr.pdfData;
                    doc.initialPdf = curr.initialPdf;
                    const req = this.db?.transaction('riesenia', 'readwrite').objectStore('riesenia');
                    const result = req?.put(doc);
                    if (result) {
                        result.onsuccess = () => resolve();
                        result.onerror = (e) => reject(e);
                    }
                });
            }
            else {
                const result = req?.put(doc);
                if (result) {
                    result.onsuccess = () => resolve();
                    result.onerror = (e) => reject(e);
                }
            }
        });
    }

    async getAllDocuments(): Promise<Document[]> {
        if (this.db == null) {
            await this.initDb();
        }
        var req = this.db?.transaction('riesenia', 'readonly').objectStore('riesenia');

        return new Promise<Document[]>((resolve, reject) => {
            var docs = req?.getAll();
            if (docs == null) {
                reject('no docs found');
                return;
            }
            else {
                docs.onsuccess = () => {
                    resolve(docs?.result as Document[]);
                }
            }
        });
    }

    async getTemplate(id: string): Promise<ITemplate> {
        const req = this.db?.transaction('templates', 'readonly').objectStore('templates');
        return new Promise<ITemplate>((resolve, reject) => {
            const doc = req?.get(id);
            if (doc == null) {
                reject('no template found');
                return;
            }
            else {
                doc.onsuccess = () => {
                    resolve(doc?.result as ITemplate);
                }
            }
        });
    }

    async getAllTemplates(): Promise<ITemplate[]> {
        if (this.db == null) {
            await this.initDb();
        }

        const req = this.db?.transaction('templates', 'readonly').objectStore('templates');

        return new Promise<ITemplate[]>((resolve, reject) => {
            const docs = req?.getAll();
            if (docs == null) {
                reject('no docs found');
                return;
            }
            else {
                docs.onsuccess = () => {
                    resolve(docs?.result as ITemplate[]);
                }
            }
        });
    }

    async removetemplate(id: string): Promise<void> {
        const req = this.db?.transaction('templates', 'readwrite').objectStore('templates');
        return new Promise<void>((resolve, reject) => {
            const operation = req?.delete(id);
            if (operation == undefined) {
                reject('no Template found');
                return;
            }
            operation.onsuccess = () => {
                resolve();
            }
            operation.onerror = () => {
                reject(operation.error);
            }
        });
    }

    async updateTemplate(data: ITemplate): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const req = this.db?.transaction('templates', 'readwrite').objectStore('templates');
            const result = req?.put(data);
            if (result) {
                result.onsuccess = () => resolve();
                result.onerror = (e) => reject(e);
            }
        });
    }

    async clearAllDocuments() {
        return new Promise<void>((resolve, reject) => {
            const req = this.db?.transaction('riesenia', 'readwrite').objectStore('riesenia');
            const res = req?.clear();
            if (res) {
                res.onerror = (e) => reject(e);
                res.onsuccess = () => resolve();
            }
        })
    }
}

export const Database: DB = new DB();