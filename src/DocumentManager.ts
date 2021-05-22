import { PDFdocument } from "./components/PDFdocument";
import JSZip, { JSZipObject } from "jszip";

export var functions = {
    updateUI: ()=>{},
};

var pdf: null | PDFdocument = null;
export async function setPdf(index: number) {
    var data = metaDatas[index];
    pdf = new PDFdocument(await data.entry.async('arraybuffer'));
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
            entry: entry,
            index: index,
            kategoria: splittedName[1],
            riesitel: splittedName[2] + ' ' + splittedName[3]
        });
    })
}

export var metaDatas: DocumentMetadata[] = []

export interface DocumentMetadata{
    riesitel: string;
    kategoria: string;
    index: number;
    entry: JSZipObject;
}