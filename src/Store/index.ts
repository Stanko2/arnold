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
    loadedProblems: Set<string>;
    currentProblem: string;
}

Vue.use(Vuex)

const store = new Store<State>({
    state: {
        settings: defaultSettings,
        tags: [],
        documents: [],
        scoringCriteria: [],
        currentProblem: '',
        loadedProblems: new Set<string>()
    },
    mutations: {
        loadData: (state) => {
            const data = localStorage.getItem('preferences');
            if (data) {
                state.settings = JSON.parse(data) as Settings;
                state.tags = JSON.parse(localStorage.getItem('tags') || '[]');
                state.scoringCriteria = JSON.parse(localStorage.getItem('bodovanie') || "[]");
            }
            for (const problem of JSON.parse(localStorage.getItem('problems') || '[]')) {
                state.loadedProblems.add(problem);
            }
            console.log(state.loadedProblems);
            store.dispatch('setTheme');
        },
        applySettings(state, settings: Settings) {
            localStorage.setItem('preferences', JSON.stringify(settings));
            state.settings = settings;
            store.dispatch('setTheme');
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
        },
        addProblem(state, problemName){
            state.currentProblem = problemName;
            state.loadedProblems.add(problemName);
            store.dispatch('saveProblems');
        },
        setActiveProblem(state, problem){
            state.currentProblem = problem;
        }
    },
    modules: {
        Clipboard
    },
    actions: {
        setTheme(context){
            const theme = context.state.settings.other.settings.theme;
            document.body.classList.remove('light', 'dark')
            if (theme == 'dark')
                document.body.classList.add('dark')
            else if (theme == 'light')
                document.body.classList.add('light')
            else {
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.body.classList.add('dark')
                }
                else {
                    document.body.classList.add('light')
                }
            }
        },
        saveProblems(context){
            const arr = [];
            for (const problem of context.state.loadedProblems) {
                arr.push(problem);
            }
            localStorage.setItem('problems', JSON.stringify(arr));
        }
    }
});

export default store;
declare module 'vue' {
    interface Vue {
        $store: Store<State>;
    }
}
