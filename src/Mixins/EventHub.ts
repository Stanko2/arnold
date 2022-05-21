import Vue from "vue";


const eventHub = new Vue();
export default eventHub;

Vue.mixin({
    data: function () {
        return {
            eventHub: eventHub,
        }
    }
});

declare module 'vue/types/vue' {
    interface Vue {
        eventHub: Vue;
    }
}