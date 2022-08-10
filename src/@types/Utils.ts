import {PDFdocument} from "@/components/PDFdocument";
import {Annotation} from "@/Annotation";

export interface Util {
    cursor: string,
    icon: string,
    name: string,
    tooltip: string,
    shortcut: string,
    style: string,
    use(pdf: PDFdocument, page: number, useMouse?: boolean): void|Annotation[],
}

export class ClipboardObject {
    public type: string;
    public page: number;
    public data: any[];

    constructor(type: string, page: number, data: any) {
        this.type = type;
        this.page = page;
        this.data = data;
    }
}

class Clipboard {

    constructor() {
        const object = localStorage.getItem('clipboard');
        if(object !== null) {
            this.object = JSON.parse(object);
            // convert object type
            if (this.object instanceof Array) {
                this.object = this.object.map(o => new ClipboardObject(o.type, o.page, o.data));
            } else {
                // @ts-ignore
                this.object = new ClipboardObject(this.object.type, this.object.page, this.object.data);
            }
        }
    }

    public set(object: ClipboardObject[] | ClipboardObject): void {
        this.object = object;
        localStorage.setItem('clipboard', JSON.stringify(object));
    }

    public get(): ClipboardObject[] | ClipboardObject | null {
        return this.object;
    }

    public isSingle(): boolean {
        return this.object instanceof ClipboardObject;
    }

    public clear(): void {
        this.object = null;
        localStorage.removeItem('clipboard');
    }

    public isNull(): boolean {
        return this.object === null;
    }

    private object: ClipboardObject[] | ClipboardObject | null = null;
}

export const clipboard: Clipboard = new Clipboard();
