import { Module } from 'vuex';
import { ClipboardObject } from '@/@types';
import { Annotation } from '@/Annotation';
import { PDFdocument } from '@/components/PDFdocument';

interface ClipboardState {
    object: ClipboardObject | null;
    mousePos?: {
        x: number;
        y: number;
    };
    page: number;
}

const Clipboard: Module<ClipboardState, any> = {
    namespaced: true,
    state: {
        object: null,
        mousePos: undefined,
        page: -1,
    },
    mutations: {
        set(state: ClipboardState, data: Annotation[]) {
            const mid = {x: 0, y: 0};
            for (const obj of data) {
                const json = obj.serializeToJSON();
                mid.x += json.data.left || 0;
                mid.y += json.data.top || 0;
            }
            mid.x /= data.length;
            mid.y /= data.length;
            console.log(mid);
            
            state.object = {
                type: typeof data,
                page: state.page,
                data: data.map(a => {
                    let json = a.serializeToJSON();
                    delete json.data.name;
                    json.offset = {
                        x: json.data.left - mid.x,
                        y: json.data.top - mid.y,
                    }
                    return json;
                }),
            };
        },
        clear(state: ClipboardState) {
            state.object = null;
        },
        setMousePos(state: ClipboardState, payload) {
            const pos = payload.pos;
            state.mousePos = pos;
            state.page = payload.page;
        }
    },
    actions: {
        paste(store, payload: {pdf: PDFdocument, useMouse: boolean, page: number}) {
            if(store.state.object == null) return;
            const pdf = payload.pdf;
            if(payload.page === -1){
                payload.page = store.state.page;
            }
            const page = payload.useMouse ? store.state.page : payload.page;
            for (const object of store.state.object.data) {
                if (payload.useMouse) {
                    const pos = store.state.mousePos || {x: 0, y: 0};
                    object.data.left = pos.x + object.offset.x;
                    object.data.top = pos.y + object.offset.y;
                }
                pdf.createAnotation(object.type, page, object)
            }
        }
    }
}

export default Clipboard;