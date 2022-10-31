import { FilterCommand } from '../Filter';
import { Document } from '@/@types';
import store from '@/Store';

export class TagFilter implements FilterCommand {
    name = 'tags';
    args = [];
    inversed = false;
    matches(doc: Document): boolean {
        return this.args.some(arg=>{
            const id = store.state.tags.find(t=> t.meno == arg)?.id || 'invalid';
            return doc.tags.some(tag => tag == id);
        })   
    }

    valid(): boolean {
        return this.args.every(t => store.state.tags.find(tag => tag.meno === t) != undefined);
    }
}