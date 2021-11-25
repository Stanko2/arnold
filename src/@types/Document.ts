export interface Document {
    riesitel: string;
    kategoria: string;
    index: number;
    id: number;
    timeOpened: number;
    scoring?: IScoring;
    pdfData: ArrayBuffer;
    initialPdf: ArrayBuffer;
    changes: any[];
    tags: any[];
    originalName: string;
    opened: boolean;
}

export interface IScoring {
    points: number;
    acceptedCriteria: string[];
    final: boolean;
    annotName?: string;
    comments?: string[];
}

export interface Tag {
    id: string;
    meno: string;
    color: string;
}

export interface DocumentParser {
    kategorie: string[];
    uloha: string;
    parse: (name: string) => DocumentMetadata;
}

export interface DocumentMetadata {
    riesitel: string;
    kategoria: string;
    id: number;
    originalName: string;
}

export interface ITemplate {
    id: string;
    type: string;
    templateOptions: fabric.IObjectOptions;
    data: any;
    name: string;
}