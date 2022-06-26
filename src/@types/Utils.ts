import {PDFdocument} from "@/components/PDFdocument";
import {Annotation} from "@/Annotation";

export interface Util {
    cursor: string,
    icon: string,
    name: string,
    tooltip: string,
    shortcut: string,
    style: string,
    use(pdf: PDFdocument, page: number): void|Annotation[],
}

export class ClipboardObject {
    public type: string;
    public page: number;
    public data: object;

    constructor(type: string, page: number, data: any) {
        this.type = type;
        this.page = page;
        this.data = data;
    }
}

export class Clipboard {

    static set(object: ClipboardObject[] | ClipboardObject): void {
        Clipboard.object = object;
    }

    static get(): ClipboardObject[] | ClipboardObject | null {
        return Clipboard.object;
    }

    static isSingle(): boolean {
        return Clipboard.object instanceof ClipboardObject;
    }

    static clear(): void {
        Clipboard.object = null;
    }

    static isNull(): boolean {
        return Clipboard.object === null;
    }

    private static object: ClipboardObject[] | ClipboardObject | null = null;
}
