import { Document } from './DocumentManager'

class DB{

    private IndxDb: IDBFactory;
    public db: IDBDatabase | null;
    constructor(){
        this.IndxDb = window.indexedDB;
        this.db = null;
        this.initDb();  
    }

    initDb(): Promise<void>{
        return new Promise<void>((resolve, reject) =>{
            var req = this.IndxDb.open("riesenia",1);
            var md = this;
            req.onupgradeneeded = function (e: any) {
                md.db = e.target.result;
                var riesenia = md.db?.createObjectStore('riesenia', {keyPath: 'id'})
                riesenia?.createIndex('id', 'id', {unique: true});
                riesenia?.createIndex('riesitel', 'riesitel');
                resolve();
            }
            req.onsuccess = function (e:any){
                md.db = e.target.result;
                md.db?.transaction('riesenia', 'readwrite').objectStore('riesenia');
                resolve();
            }
            req.onerror = function(event:any) {
            // Generic error handler for all errors targeted at this database's
            // requests!
                reject("Database error: " + event.target.errorCode);
            };
        })
    }

    addDocument(doc: Document){
        console.log(doc);
        var riesenia = this.db?.transaction('riesenia', 'readwrite').objectStore('riesenia');        
        riesenia?.add(doc);
    }
    async getDocument(id:number): Promise<Document>{
        var req = this.db?.transaction('riesenia', 'readonly').objectStore('riesenia');
        return new Promise<Document>((resolve, reject) =>{
            var doc = req?.get(id);
            if(doc == null) {
                reject('no docs found');
                return; 
            }
            else{ 
                doc.onsuccess = () =>{
                    resolve(doc?.result as Document);
                }
            }
        });
    }

    async updateDocument(id: number, doc: Document): Promise<void>{
        return new Promise<void>((resolve, reject) =>{
            var req = this.db?.transaction('riesenia', 'readwrite').objectStore('riesenia');
            if(req?.get(id) == null) {
                reject('modifying nonexistent document');
            }
            var result = req?.put(doc);
            if(result){ 
                result.onsuccess = ()=>resolve();
                result.onerror = (e)=>reject(e);
            }
        });
    }

    async getAllDocuments(): Promise<Document[]>{
        if(this.db == null){
            await this.initDb();
        }
        var req = this.db?.transaction('riesenia', 'readonly').objectStore('riesenia');

        return new Promise<Document[]>((resolve, reject) =>{
            var docs = req?.getAll();
            if(docs == null) {
                reject('no docs found');
                return; 
            }
            else{ 
                docs.onsuccess = () =>{
                    resolve(docs?.result as Document[]);
                }
            }
        });
    }
}

export const Database: DB = new DB();