<template>
  <div>
    <b-button
      :id="name"
      class="colorInputButton"
      :style="{
        'background-color': color,
      }"
    ><slot />

    </b-button>
    <b-popover
      :show.sync="show"
      :target="name"
      triggers="click"
      placement="bottom"
      ref="popover"
    >
      <template #title>{{ label }}</template>
      <v-swatches class="color-picker" v-model="color" inline @input="submit" backgroundColor="transparent" show-fallback fallback-input-type="color"></v-swatches>
      <div class="d-flex align-items-center justify-content-between">
        <p class="d-flex align-items-center transparency-text">
          Nepriehľadnosť
        </p>
        <div class="form-control transparency-num">
          <input
            type="number"
            class="transparency-num"
            min="7"
            max="100"
            v-model.number="opacity"
            @input="submit"
          />
        </div>
        <b-form-input
          min="7"
          style="width: 80px"
          type="range"
          max="100"
          step="1"
          v-model.number="opacity"
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
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";
import { BPopover } from "bootstrap-vue";

@Component({
  components: { VSwatches }
})
export default class ColorPicker extends Vue {
  @Prop({ required: true, default: "name" })
  name!: string;
  @Prop({ default: "#ff0000ff" })
  value!: string;
  @Prop({ default: "Vyber farbu" })
  label!: string;
  color = "#000000"
  opacity = 100
  show = false
  clickListener!: (e: MouseEvent) => void;

  $refs!: {
    popover: BPopover;
  }

  mounted() {
    if (this.value === undefined || this.value === null || this.value.startsWith("rgb")) {
      this.color = "#000000";
      this.opacity = 100;
      this.submit();
      return;
    }
    this.color = this.value.substring(0, 7);
    this.opacity = Math.round((parseInt(this.value.substring(7, 9), 16) / 255) * 100) || 100;
    this.clickListener = (event) => {
      if (this.show) {
        let a: any = this.$refs.popover;
        if (!a) return;
        let pop = a.$children[0].$children[0].$el;
        if (!pop.contains(event.target)) {
          this.show = false;
        }
      }
    }
    document.addEventListener("click", this.clickListener);
  }

  submit() {
    if (this.color.startsWith("rgb")) {
      this.color = "#000000";
    }
    this.$emit("input", this.color + Math.floor((this.opacity * 255) / 100).toString(16));
  }

  unmounted() {
    document.removeEventListener("click", this.clickListener);
  }
}
</script>

<style scoped lang="scss">
.colorInputButton {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  border: none;
}

p.transparency-text {
  margin-right: 10px;
}

.transparency-num {
  width: 75px;
  position: relative;
  padding-top: 4px;
  padding-bottom: 4px;
  padding-left: 4px;
  margin-right: 10px;
  background-color: var(--bg-500);

  &::after {
    content: "%";
    display: inline;
    position: absolute;
    right: 5px;
    top: 5px;
  }

  &:focus {
    outline: none;
  }
}


input.transparency-num::-webkit-outer-spin-button,
input.transparency-num::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"].transparency-num {
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

<style lang="scss">

.color-picker {

  .vue-swatches__fallback__wrapper {
    display: flex !important;
  }
  
  .vue-swatches__fallback__input {
    border: none !important;
    background: transparent !important;
  }

}

</style>
