import {FilterCommand} from '../Filter';
import {Document} from '@/@types';

export class ScoreFilter implements FilterCommand {
    matches(doc: Document): boolean {
        if(this.args.length == 0)
            return doc.scoring?.points != undefined;
        if(!doc.scoring) return false;
        return doc.scoring.points >= parseFloat(this.args[0]) && doc.scoring.points <= parseFloat(this.args[1]);
    }
    name = 'score';
    args = [];
    inversed = false;

    valid(): boolean {
        return this.args.length == 0 || (this.args.length == 2 && !isNaN(this.args[0]) && !isNaN(this.args[1]));
    }
}
