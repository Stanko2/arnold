import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import { Document, ScoringCriteria, Settings, Tag } from '@/@types';
import Clipboard from './clipboard';

import defaultSettings from '@/components/Preferences/DefaultSettings';

export interface State {
    settings: Settings;
    scoringEntries: { id: string, points: number }[];
    tags: Tag[];
    documents: Document[];
    scoringCriteria: Record<string, ScoringCriteria[]>;
    loadedProblems: Set<string>;
    currentProblem: string;
}

Vue.use(Vuex)

const store = new Store<State>({
    state: {
        settings: defaultSettings,
        tags: [],
        documents: [],
        scoringCriteria: {},
        currentProblem: '',
        loadedProblems: new Set<string>(),
        scoringEntries: []
    },
    mutations: {
        loadData: (state) => {
            const data = localStorage.getItem('preferences');

            if (data) {
                state.settings = JSON.parse(data) as Settings;
                state.tags = JSON.parse(localStorage.getItem('tags') || '[]');
                state.scoringCriteria = JSON.parse(localStorage.getItem('bodovanie') || "{}");
                state.scoringEntries = JSON.parse(localStorage.getItem('scoringEntries') || '[]');
            }
            for (const problem of JSON.parse(localStorage.getItem('problems') || '[]')) {
                state.loadedProblems.add(problem);
            }
            state.currentProblem = localStorage.getItem('currentProblem') || '';
            if (state.currentProblem == "")
                state.currentProblem = state.loadedProblems.values().next().value;
            if (Array.isArray(state.scoringCriteria)) {
                // @ts-ignore
                const criteria: ScoringCriteria[] = [...state.scoringCriteria];
                state.scoringCriteria = {}
                state.scoringCriteria[state.currentProblem] = criteria;
            }
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
            state.scoringCriteria[state.currentProblem] = payload;
            localStorage.setItem('bodovanie', JSON.stringify(state.scoringCriteria));
        },
        setScoringEntries(state, payload) {
            localStorage.setItem('scoringEntries', JSON.stringify(payload));
            state.scoringEntries = payload;
        },
        setTags(state, payload) {
            localStorage.setItem('tags', JSON.stringify(payload));
            state.tags = payload;
        },
        addProblem(state, payload) {
            state.currentProblem = payload.name;
            state.loadedProblems.add(payload.name);
            state.scoringCriteria[payload.name] = payload.scoring;
            store.dispatch('saveProblems');
        },
        setActiveProblem(state, problem) {
            state.currentProblem = problem;
            localStorage.setItem('currentProblem', state.currentProblem);
        },
        unloadCurrentProblem(state) {
            if (state.currentProblem == '') throw new Error('No problem loaded');
            state.loadedProblems.delete(state.currentProblem);
            store.dispatch('saveProblems');
            delete state.scoringCriteria[state.currentProblem];
            localStorage.setItem('bodovanie', JSON.stringify(state.scoringCriteria));
            state.currentProblem = state.loadedProblems.values().next().value;
            localStorage.setItem('currentProblem', state.currentProblem);
        }
    },
    getters: {
        scoringCriteria(state) {
            return state.scoringCriteria[state.currentProblem] || []
        }
    },
    modules: {
        Clipboard
    },
    actions: {
        setTheme(context) {
            const theme = context.state.settings.other?.settings.theme || 'system';
            document.body.classList.remove('light')
            document.body.classList.remove('dark')
            if (theme === 'dark')
                document.body.classList.add('dark')
            else if (theme === 'light')
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
        saveProblems(context) {
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
