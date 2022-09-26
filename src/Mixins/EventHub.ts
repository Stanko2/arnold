import Vue from "vue";
import { onEditorStart } from '@/Documents/DocumentManager';


const eventHub = new Vue();
export default eventHub;

Vue.mixin({
    data: function () {
        return {
            eventHub: eventHub,
        }
    }
});

// Vue.mixin({
//     beforeRouteEnter(to, from){
//         console.log(to);
//         if(to.name == "Editor") onEditorStart(to);
//         return {path: to.path, params: to.params, query: to.query}
//     }
// })

declare module 'vue/types/vue' {
    interface Vue {
        eventHub: Vue;
    }
}