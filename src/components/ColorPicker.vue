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
        <p class="d-flex align-items-center transparency-text">Nepriehľadnosť</p>
        <!-- percentage input -->
        <div class="form-control transparency-num">
          <input
              type="number"
              class="transparency-num"
              min="6"
              max="100"
              v-model.number="transparency"
              @input="submit"
          /></div>
        <b-form-input
            min="7"
            style="width: 80px"
            type="range"
            max="100"
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
    this.transparency = Math.round((parseInt(this.value.substring(7, 9), 16)/255)*100) || 100;
  },
  methods: {
    submit() {
      this.$emit("input", this.color + Math.floor((this.transparency*255)/100).toString(16));
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

p.transparency-text {
  margin-right: 10px;
}

div.transparency-num {
  width: 75px;
  position: relative;
  padding-top: 4px;
  padding-bottom: 4px;
  padding-left: 4px;
  margin-right: 10px;
}

div.transparency-num::after {
  content: "%";
  display: inline;
  position: absolute;
  right: 5px;
  top: 5px;
}

input.transparency-num::-webkit-outer-spin-button,
input.transparency-num::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type=number].transparency-num {
  -moz-appearance: textfield;
}
input.transparency-num {
  width: 30px;
  margin-right: 10px;
  display: inline;
}

input.transparency-num,
input.transparency-num:focus,
input.transparency-num:active {
  border: none;
}


</style>