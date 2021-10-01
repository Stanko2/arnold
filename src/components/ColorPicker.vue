<template>
  <div>
    <b-button
      :id="name"
      class="colorInputButton"
      :style="{
        'background-color': color,
      }"
    ></b-button>
    <b-popover :target="name" triggers="click" placement="bottom">
      <template #title>{{ label }}</template>
      <v-swatches v-model="color" inline @input="submit"></v-swatches>
      <div class="d-flex align-items-center justify-content-between">
        <p class="d-flex align-items-center">Transparency</p>
        <b-form-input
          min="30"
          style="width: 100px"
          type="range"
          max="255"
          step="1"
          v-model.number="transparency"
          @input="submit"
        />
      </div>
    </b-popover>
  </div>
</template>

<script lang="ts">
const VSwatches = require("vue-swatches");

import "vue-swatches/dist/vue-swatches.css";
import Vue from "vue";
export default Vue.extend({
  components: {
    VSwatches,
  },
  props: {
    name: {
      type: String,
      default: "name",
      required: true,
    },
    value: {
      type: String,
      default: "#ff000000",
    },
    label: {
      type: String,
      default: "Vyber farbu",
    },
  },
  data() {
    return {
      color: "#000000",
      transparency: 0,
    };
  },
  mounted() {
    this.color = this.value.substring(0, 7);
    this.transparency = parseInt(this.value.substring(7, 9), 16) || 255;
  },
  methods: {
    submit() {
      this.$emit("input", this.color + this.transparency.toString(16));
    },
  },
});
</script>

<style scoped>
.colorInputButton {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  border: none;
}
</style>