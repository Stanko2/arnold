import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import { Settings, Tag } from './@types';

import defaultSettings from './components/Preferences/DefaultSettings';
interface State {
    settings: Settings;
    tags: Tag[];
    documents: Document[];
}

Vue.use(Vuex)

export const store = new Store<State>({
    state: {
        settings: defaultSettings,
        tags: [],
        documents: []
    },
    mutations: {
        loadData: (state) => {
            const data = localStorage.getItem('preferences');
            if (data) {
                state.settings = JSON.parse(data);
                state.tags = JSON.parse(localStorage.getItem('tags') || '[]');
            }
        },
        applySettings(state, settings: Settings) {
            state.settings = settings;
        },
        loadDocuments(state, documents: Document[]) {
            state.documents = documents;
        }
    }
});

declare module 'vue' {
    interface Vue {
        $store: Store<State>;
    }
}
