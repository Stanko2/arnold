import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import { Settings, Tag, Document, ScoringCriteria } from '@/@types';
import Clipboard from './clipboard';

import defaultSettings from '@/components/Preferences/DefaultSettings';
export interface State {
    settings: Settings;
    tags: Tag[];
    documents: Document[];
    scoringCriteria: ScoringCriteria[];
}

Vue.use(Vuex)

const store = new Store<State>({
    state: {
        settings: defaultSettings,
        tags: [],
        documents: [],
        scoringCriteria: [],
    },
    mutations: {
        loadData: (state) => {
            const data = localStorage.getItem('preferences');
            if (data) {
                state.settings = JSON.parse(data);
                state.tags = JSON.parse(localStorage.getItem('tags') || '[]');
                state.scoringCriteria = JSON.parse(localStorage.getItem('bodovanie') || "[]");
            }
        },
        applySettings(state, settings: Settings) {
            localStorage.setItem('preferences', JSON.stringify(settings));
            state.settings = settings;
        },
        loadDocuments(state, documents: Document[]) {
            state.documents = documents;
        },
        updateDocument(state, payload) {
            const idx = state.documents.findIndex(doc => doc.id === payload.id);
            state.documents[idx] = payload;
        },
        setCriteria(state, payload) {
            localStorage.setItem('bodovanie', JSON.stringify(payload));
            state.scoringCriteria = payload;
        },
        setTags(state, payload) {
            localStorage.setItem('tags', JSON.stringify(payload));
            state.tags = payload;
        }
    },
    modules: {
        Clipboard
    },
});

export default store;
declare module 'vue' {
    interface Vue {
        $store: Store<State>;
    }
}
