<template>
  <b-card
    class="stats"
    :style="{ 'background-color': color.hex() }"
    :text-variant="color.isLight() ? 'dark' : 'light'"
    @click="expanded = !expanded"
  >
    <div class="d-flex flex-row justify-content-between align-items-end">
      <h4>{{ label }}</h4>
      <h3>{{ ((value / max) * 100).toFixed(2) }}%</h3>
    </div>
    <b-progress
      class="mt-2"
      :max="max"
    >
      <b-progress-bar
        :value="value"
        :label="`${value} / ${max}`"
      />
    </b-progress>
    <transition name="content">
      <slot
        v-if="expanded"
        @click.prevent
      />
    </transition>
  </b-card>
</template>

<script lang="ts">
import Color from "color";
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";

@Component
export default class StatsEntry extends Vue {
  @Prop({required: true}) max!:number;
  @Prop({required: true}) value!:number;
  @Prop({required: true}) min!:number;
  @Prop({required: true}) label!:string;
  @Prop({required: false}) color!:Color;

  expanded: boolean = false;
  data() {
    return {
      expanded: false,
    };
  }
}
</script>

<style scoped>
.stats {
  user-select: none;
  display: inline;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  width: 100%;
  align-items: center;
}
.stats:hover {
  background-color: rgba(0, 0, 0, 0.3);
}
.stats p {
  display: block;
  margin-left: 1rem;
}
.stats h3 {
  font-size: 2.5rem;
  font-weight: bold;
}
.content-leave-active,
.content-enter-active {
  transition: 100ms;
}
.content-enter-to,
.content-leave {
  height: 100%;
  transform: translate(0, 0);
}
.content-leave-to,
.content-enter {
  height: 0;
  transform: translate(0, 100%);
}
</style>