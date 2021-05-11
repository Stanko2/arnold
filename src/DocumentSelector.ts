import { PDFdocument } from "./components/PDFdocument";

export var pdf: null | PDFdocument = null;
export function setPdf(newPdf: PDFdocument) {
    pdf = newPdf;
    console.log(pdf);
    
}  
