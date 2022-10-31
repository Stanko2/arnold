import { FilterCommand } from '../Filter';
import { Document } from '@/@types';
import store from '@/Store';

export class CommentFilter implements FilterCommand {
    name = 'comment';
    args = [];
    inversed = false;
    matches(doc: Document): boolean {
        return doc.changes.length > 0 && doc.changes.some(o => {
            return o.type == "Text" && (o.data.text as string).match(/^[0-9]*(\.[0-9]*)?B$/) == null
        })
    }

    valid(): boolean {
        return this.args.length == 0
    }
}