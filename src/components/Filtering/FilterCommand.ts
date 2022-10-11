import {Document} from '@/@types'
import store from '@/Store';

interface FilterCommand {
    name: string;
    args: string[];
    matches(doc: Document): boolean;
}

class FilterCommandParser {
    commands: FilterCommand[] = [];
    query: string = ''

    constructor(){
        
    }

    updateQuery(){

    }

    getVisibility(doc: Document):boolean {
        for (const command of this.commands) {
            if(!command.matches(doc)){
                return false;
            }
        }
        return true;
    }
}