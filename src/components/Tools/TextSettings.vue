<template>
  <div>
    <div>
      <b-dropdown :text="selectedTool.defaultOptions.fontFamily">
        <b-dropdown-item
          v-for="font in fonts"
          :key="font.viewport"
          :style="{ 'font-family': font.viewport }"
          @click.native="selectedTool.defaultOptions.fontFamily = font.viewport"
        >
          {{ font.viewport }}
        </b-dropdown-item>
      </b-dropdown>
    </div>
    <div class="form-inline">
      <p class="d-flex align-items-center">
        Veľkosť Písma
      </p>
      <input
        v-model.number="selectedTool.defaultOptions.fontSize"
        type="number"
        class="form-control"
        min="0"
        style="width: 100px"
      >
    </div>
    <tool-button
      id="bold"
      icon="format_bold"
      :outline="fontWeight == 400"
      @click="toggleBold()"
    />
  </div>
</template>

<script lang="ts">
import { Tool, ToolOptions } from '@/@types';
import {fabric} from 'fabric';
import Vue from 'vue'
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { FontsAvailable } from '../Fonts';
import { PDFdocument } from '../PDFdocument';
import ToolButton from './Toolbutton.vue';

@Component({
  components: {
    ToolButton
  }
})
export default class TextSettings extends Vue {
  @Prop({ required: true })
  selectedTool!: Tool<fabric.ITextboxOptions>;
  fonts = FontsAvailable;
  fontWeight = 400

  toggleBold(){ 
    if(this.fontWeight == 600)
      this.fontWeight = 400;
    else
      this.fontWeight = 600;
    this.$forceUpdate();
    this.setStyle();
  }

  setStyle(){
    const obj = PDFdocument.activeObject as fabric.Textbox;
    if(this.selectedTool.name == 'Select' && obj && obj instanceof fabric.Textbox){
        const style:any = obj.styles;
        if(!obj.selectionStart) return;
        console.log(obj.selectionStart);
        
        for (let i = obj.selectionStart; i < (obj.selectionEnd || obj.selectionStart+1); i++) {
            const line = this.getLineByChar(i, obj.textLines);
            if(!style[line]) style[line] = {};
            style[line][i] = {
                fontWeight: this.fontWeight
            }
        }
        
        obj.set({styles: style});
        console.log(obj.styles);
        obj.canvas?.requestRenderAll();
    }
  }

  getLineByChar(charIndex: number, lines: string[]): number{
    let idx = 0;
    let line = 0;
    while(idx + lines[line].length < charIndex){
        idx += lines[line].length;
        line++;
    }
    return line;
  }
}
</script>