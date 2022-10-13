import {Document} from '@/@types'
import store from '@/Store';
import Commands from './Commands';
import eventHub from '@/Mixins/EventHub';

interface FilterCommandMeta{
    name: string;
    args: string[];
    inversed: boolean;
}

export interface FilterCommand extends FilterCommandMeta {
    matches(doc: Document): boolean;
    valid(): boolean;
}

class FilterCommandParser {
    commands: FilterCommand[] = [];
    private query: string = '';
    

    
    parse() : FilterCommand[]{
        let curr: FilterCommandMeta = {
            name: '',
            args: [],
            inversed: false
        };
        let mode: 'name' | 'args' = 'name';
        const commands: FilterCommandMeta[] = []
        for (const char of this.query) 
        {
            if(char == ' ') continue;
            if(char == '('){
                if(mode == 'name')
                    mode = 'args';
                else
                    throw new Error('Unexpected character (');
                curr.args.push('');
                continue;
            }
            else if (char == ')') {
                if(mode == 'args')
                    mode = 'name';
                else
                    throw new Error('Unexpected character )');
                commands.push(curr);
                curr = {
                    name: '',
                    args: [],
                    inversed: false
                }
                continue;
            }
            if(mode == 'name'){
                if(char == '-'){
                    if(curr.name == '')
                        curr.inversed = true;
                    else 
                        throw new Error('Unexpected character -');
                    continue;
                }
                curr.name += char;
            }
            else {
                if(char == ','){
                    curr.args.push('');
                    continue;
                }
                curr.args[curr.args.length - 1] += char;
            }
        }

        const out: FilterCommand[] = []
        for (const command of commands) {
            const parsed = Commands.find(c=>c.name == command.name);
            if(parsed == undefined)
                throw new Error('Invalid query');
            out.push({
                ...command,
                matches: parsed.matches,
                valid: parsed.valid,
            });
        }

        return out;
    }

    updateQuery(query: string){
        this.query = query;
        this.commands = this.parse();
        console.log(this.commands);
        eventHub.$emit('filter:queryUpdated');
    }

    queryValid(): boolean{
        try { 
            this.parse();
            return true;
        }
        catch (e){
            return false;
        }
    }

    getVisibility(doc: Document):boolean {
        for (const command of this.commands) {
            if(command.inversed){
                if(command.matches(doc)){
                    return false;
                }
            }
            else {
                if(!command.matches(doc)){
                    return false;
                }
            }
        }
        return true;
    }
}

const filter = new FilterCommandParser();

export default filter;