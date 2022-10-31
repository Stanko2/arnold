import eventHub from '@/Mixins/EventHub';
import { Document } from '@/@types'
import { PDFdocument } from './PDFdocument';
import { Database } from '@/Db';

export class Stopwatch {
    private startTime = 0;
    private selectedTimeOpened = 0;
    private currentSelected: Document | null = null;
    constructor() {
        eventHub.$on("editor:documentChanged", (pdf: PDFdocument, data: Document) => {
            if (this.currentSelected != null) {
                this.currentSelected.timeOpened = this.time;
                Database.updateDocument(this.currentSelected.id, this.currentSelected, false);
            }
            this.currentSelected = data;
            this.selectedTimeOpened = data.timeOpened;
            this.startTime = Date.now();
        });
    }

    public get time(): number {
        return Date.now() - this.startTime + this.selectedTimeOpened;
    }
}