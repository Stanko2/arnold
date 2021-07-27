export interface DocumentParser {
    kategorie: string[];
    uloha: string;
    parse: (name: string) => DocumentMetadata;
}

export interface DocumentMetadata {
    riesitel: string;
    kategoria: string;
    id: number;
}

export class PMatParser implements DocumentParser {
    kategorieMapper: Record<string, string>;
    constructor(public uloha: string) {
        this.kategorie = ['5', '6', '7', '8', '9', 'Prima', 'Sekunda', 'Tercia', 'Kvarta'];
        this.kategorieMapper = {
            'c5': '5',
            'c6': '6',
            'c7': '7',
            'c8': '8',
            'c9': '9',
            'cp': 'Prima',
            'cs': 'Sekunda',
            'ct': 'Tercia',
            'ck': 'Kvarta'
        };
    }
    kategorie: string[];
    parse(name: string): DocumentMetadata {
        const fileName = name.split('/')[1].split('-');
        return {
            id: parseInt(fileName[fileName.length - 1].substring(0, 4)),
            kategoria: this.kategorieMapper[fileName[1]],
            riesitel: fileName.slice(2, fileName.length - 1).join(' ')
        }
    }

}