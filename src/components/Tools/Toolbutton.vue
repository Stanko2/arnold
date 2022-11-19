<template>
  <b-button
    :id="id"
    class="btn"
    :variant="getVariant()"
    @click="$emit('click')"
  >
    <span class="material-icons d-block">{{ icon }}</span>
    <b-tooltip
      v-if="tooltip"
      triggers="hover"
      :target="id"
    >
      {{ tooltip }}
    </b-tooltip>
  </b-button>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'

@Component
export default class ToolButton extends Vue{
    @Prop({required: true}) icon!: string;
    @Prop({required: false}) tooltip!: string;
    @Prop({required:true}) id!: string;
    @Prop({required: false, default: 'primary'}) variant!: string;
    @Prop({required: false, default: false}) outline!: boolean;

    mounted(){
        this.getVariant();
    }

    getVariant(): string{
        if(this.outline)
            return `outline-${this.variant}`;
        return this.variant;
    }
}
</script>

<style scoped>
.btn {
  margin: 0 2px;
  width: 2.8rem;
  height: 2.8rem;
  padding: 0;
}
</style>