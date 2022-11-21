<template>
  <div>
    <div>
      <b-dropdown :text="selectedTool.defaultOptions.fontFamily">
        <b-dropdown-item
          v-for="font in fonts"
          :key="font.viewport"
          :style="{ 'font-family': font.viewport }"
          @click.native="updateFont(font.viewport)"
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
      v-if="activeFont.bold !== undefined && selectedTool.name == 'Select'"
      id="bold"
      icon="format_bold"
      variant="secondary"
      :outline="fontWeight == 400"
      @click="toggleBold()"
    />
    <tool-button
      v-if="activeFont.italic !== undefined && selectedTool.name == 'Select'"
      id="italic"
      variant="secondary"
      icon="format_italic"
      :outline="!italic"
      @click="toggleItalic()"
    />
  </div>
</template>

<script lang="ts">
import { Tool } from '@/@types';
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
  activeFont = FontsAvailable['Open Sans'];
  fontWeight = 400;
  italic = false;
  updateInterval!: NodeJS.Timer;
  mounted(){
    this.updateInterval = setInterval(this.updateStatus, 300);
  }

  unmounted(){
    clearInterval(this.updateInterval);
  }

  toggleBold(){ 
    if(this.fontWeight == 600)
      this.fontWeight = 400;
    else
      this.fontWeight = 600;
    this.$forceUpdate();
    this.setStyle({fontWeight: this.fontWeight});
  }

  toggleItalic(){ 
    this.italic = !this.italic;
    this.$forceUpdate();
    this.setStyle({fontStyle: this.italic ? 'italic' : 'normal'});
  }

  updateFont(font: string){
    this.activeFont = this.fonts[font];
    if(this.selectedTool.name == 'Select'){
      const obj = PDFdocument.activeObject as fabric.Textbox;
      console.log('updating selection');
      if(obj.selectionStart == obj.selectionEnd){
        this.selectedTool.defaultOptions.fontFamily = font;
        return;
      }
      this.setStyle({fontFamily: font});
      if(this.activeFont.bold == undefined){
        this.fontWeight = 400;
        this.setStyle({fontWeight: this.fontWeight});
      }
      if(this.activeFont.italic == undefined){
        this.italic = false;
        this.setStyle({fontStyle: 'normal'});
      }
    }
    else{
      this.selectedTool.defaultOptions.fontFamily = font;
    }
  }

  setStyle(style: any){
    const obj = PDFdocument.activeObject as fabric.Textbox;
    if(this.selectedTool.name == 'Select' && obj && obj instanceof fabric.Textbox){
      if(obj.selectionEnd == obj.selectionStart){
        this.$bvToast.toast('Na štýlovanie textu najprv selectni časť, ktorú chceš meniť', {
          title: 'Chyba pri nastavovaní štýlu textu',
          variant: 'danger'
        })
        return;
      }
      console.log(obj.selectionStart);
      obj.setSelectionStyles(style, obj.selectionStart, obj.selectionEnd);
      obj.canvas?.requestRenderAll();
      obj.cleanStyle('fontFamily');
      this.updateStatus();
    }
  }

  updateStatus(){
    if(PDFdocument.activeObject == undefined || !(PDFdocument.activeObject instanceof fabric.Textbox)) return;
    const obj = PDFdocument.activeObject as fabric.Textbox;
    const isBold = obj.getSelectionStyles(obj.selectionStart, obj.selectionEnd).some(x => {
      return (Object as any).hasOwn(x, 'fontWeight') && x.fontWeight === 600;
    });
    const isItalic = obj.getSelectionStyles(obj.selectionStart, obj.selectionEnd).some(x => {
      return (Object as any).hasOwn(x, 'fontStyle') && x.fontStyle === 'italic';
    });
    this.fontWeight = isBold ? 600 : 400;
    this.italic = isItalic;
  }
}
</script>