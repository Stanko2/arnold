import { FilterCommand } from '../Filter';
import { Document } from '@/@types';
import store from '@/Store';

export class OpenFilter implements FilterCommand {
    name = 'open';
    args = [];
    inversed = false;
    matches(doc: Document): boolean {
        console.log(doc.opened);
        return doc.opened
    }

    valid(): boolean {
        return this.args.length == 0
    }
}