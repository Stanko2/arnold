<template>
    <div class="d-flex justify-content-between w-100">
        <div style="width:90%" class="d-flex align-items-center">
            <b-progress  max="100" show-value class="top-progress">
                <b-progress-bar value="50" variant="success"></b-progress-bar>
                <b-progress-bar value="25" variant="info"></b-progress-bar>
                <b-progress-bar value="10" variant="danger"></b-progress-bar>
                <b-progress-bar value="10" variant="warning"></b-progress-bar>
            </b-progress>
        </div>
        <div>
            <button class="btn btn-success" @click="save">Save</button>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
    data() {
        var element = this;
        return {
            save(){
                element.$emit('save');
            },
            select(dir: number){
                element.$emit('select', dir);
            }
        }
    }    
})
</script>

<style>
.top-progress{
    margin: 0;
    width: 100%;
    height: 1.5vw;
}
</style>