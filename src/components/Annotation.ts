
class Annotation{

    constructor(type: string, options: any) {
        this.options = options;
    }
    x: number;
    y: number;
    page: number;
    options: any;
    save: Function;
    load: Function;
    bake: Function;
}

export class TextAnnotation extends Annotation{
    constructor(options: any){
        super('Text', options);
        
    }
}