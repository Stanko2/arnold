<template>
    <div>
        <div>
        <b-dropdown :text="selectedTool.defaultOptions.fontFamily">
          <b-dropdown-item
            v-for="font in fonts"
            :key="font.viewport"
            :style="{ 'font-family': font.viewport }"
            @click.native="
              selectedTool.defaultOptions.fontFamily = font.viewport
            "
            >{{ font.viewport }}</b-dropdown-item
          >
        </b-dropdown>
      </div>
      <div class="form-inline">
        <p class="d-flex align-items-center">Veľkosť Písma</p>
        <input
          type="number"
          class="form-control"
          min="0"
          style="width: 100px"
          v-model.number="selectedTool.defaultOptions.fontSize"
        />
      </div>
    </div>
</template>

<script lang="ts">
import { Tool, ToolOptions } from '@/@types';
import Vue from 'vue'
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { FontsAvailable } from '../Fonts';

@Component
export default class TextSettings extends Vue{
  @Prop({required: true})
  selectedTool!: Tool<fabric.ITextboxOptions>;
  fonts = FontsAvailable;
}
</script>