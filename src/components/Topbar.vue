<template>
    <div class="d-flex justify-content-between w-100">
        <div>
            <button class="btn btn-primary" @click="select(-1)">prev</button>
            <button class="btn btn-primary" @click="select(1)">next</button>
        </div>
        <div class="btn-group" role="group">
            <button class="btn btn-secondary">Text</button>
            <button class="btn btn-secondary">Select</button>
            <button class="btn btn-secondary">Move</button>
        </div>
        <div>
            <button class="btn btn-success" v-shortkey.once="['ctrl', 's']" @shortkey="save" @click="save">Save</button>
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