import { fabric } from 'fabric';

// export abstract class Template implements ITemplate {
//     private _templateData: fabric.IObjectOptions;
//     public data: any;
//     public get templateOptions(): fabric.IObjectOptions { return this._templateData; }
//     public set templateOptions(val) {
//         delete val.left, val.top;
//         this._templateData = val;
//     }
//     constructor(data: fabric.IObjectOptions, public type: string) {
//         this._templateData = data;
//         this.name = ''
//         this.templateOptions = this._templateData;
//         this.id = Math.random().toString(36).substr(2, 9)
//     }
//     public name: string;
//     public id: string;
// }

export interface ITemplate {
    id: string;
    type: string;
    templateOptions: fabric.IObjectOptions;
    data: any;
    name: string;
}