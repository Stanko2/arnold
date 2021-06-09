import { PDFdocument } from "./components/PDFdocument";
import JSZip, { JSZipObject } from "jszip";
import { selectedTool, selectTool } from "./components/Tools/Tool";
import { Database } from "./Db";

export var functions = {
    updateUI: ()=>{},
};


var pdf: null | PDFdocument = null;
export async function setPdf(index: number) {
    if(index < 0 || index >= metaDatas.length) return;
    // TODO: dump current document to database

    selectedDocumentIndex = index;
    var data = metaDatas[index];
    if(pdf?.pageCanvases){
        pdf.pageCanvases.forEach((e)=>e.dispose());
    }
    pdf = new PDFdocument(data.initialPdf, data.id);
    selectTool(selectedTool);
    functions.updateUI();
}  

export function getViewedDocument(){ return pdf}

export var selectedDocumentIndex = 0;

export async function readZip(file: File){
    var buffer = await file.arrayBuffer();
    var zipReader = new JSZip();
    var zipFile = await zipReader.loadAsync(buffer);
    var index = 0;
    zipFile.forEach(async (path, entry) => {
        if(!entry.name.endsWith('.pdf')) return;
        var data = await entry.async('arraybuffer');
        index++;
        var splittedName = entry.name.split('/')[1].split('-');
        metaDatas.push({
            pdfData: data,
            initialPdf: data,
            index: index,
            kategoria: splittedName[1],
            riesitel: splittedName[2] + ' ' + splittedName[3],
            id: parseInt(splittedName[splittedName.length -1].substring(0,4)),
            changes: [],
        });
        Database.addDocument(metaDatas[metaDatas.length - 1]);
    })
}

export async function loadFromDatabase(){
    var docs = await Database.getAllDocuments();
    docs.forEach(e=>{
        metaDatas.push(e);
    })
}

export var metaDatas: Document[] = []

export interface Document{
    riesitel: string;
    kategoria: string;
    index: number;
    id: number;
    pdfData: ArrayBuffer;
    initialPdf: ArrayBuffer;
    changes: any[];
}