import { DocumentMetadata, DocumentParser } from "./@types";

export class PMatParser implements DocumentParser {
    kategorieMapper: Record<string, string>;
    constructor(public uloha: string) {
        this.kategorie = ['5', '6', '7', '8', '9', 'Pri', 'Sek', 'Ter', 'Kva'];
        this.kategorieMapper = {
            'c5': '5',
            'c6': '6',
            'c7': '7',
            'c8': '8',
            'c9': '9',
            'cp': 'Pri',
            'cs': 'Sek',
            'ct': 'Ter',
            'ck': 'Kva'
        };
    }
    kategorie: string[];
    parse(name: string): DocumentMetadata {
        let fileName: string[]
        try {
            fileName = name.split('/')[1].split('-');
        }
        catch (err) {
            fileName = name.split('-')
        }
        return {
            id: parseInt(fileName[fileName.length - 1].substring(0, fileName[fileName.length - 1].length - 3)),
            kategoria: this.kategorieMapper[fileName[1]],
            riesitel: fileName.slice(2, fileName.length - 1).map(e => e[0].toUpperCase() + e.slice(1)).join(' '),
            originalName: name.split('/')[1] || name,
        }
    }

}