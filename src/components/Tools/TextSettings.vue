<template>
  <div class="d-flex">
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
    <b-input-group
      id="fontSize" 
      class="ml-2"
      style="max-width: 100px"
    >
      <template #prepend>
        <b-input-group-text class="material-icons bg-secondary">
          format_size
        </b-input-group-text>
      </template>
      <b-form-input
        v-model.number="selectedTool.defaultOptions.fontSize"
        type="number"
        class="form-control"
        min="0"    
      />
    </b-input-group>
    <b-tooltip target="fontSize">
      Veľkosť písma
    </b-tooltip>
    <tool-button
      v-if="activeFont.bold !== undefined && isEditingTextbox"
      id="bold"
      icon="format_bold"
      variant="secondary"
      :outline="fontWeight == 400"
      tooltip="Bold"
      @click="toggleBold()"
    />
    <tool-button
      v-if="activeFont.italic !== undefined && isEditingTextbox"
      id="italic"
      variant="secondary"
      icon="format_italic"
      :outline="!italic"
      tooltip="italic"
      @click="toggleItalic()"
    />
    <tool-button
      v-if="isEditingTextbox"
      id="subscript"
      variant="secondary"
      icon="subscript"
      :outline="!subscript"
      tooltip="dolny index"
      @click="toggleScript(true)"
    />
    <tool-button
      v-if="isEditingTextbox"
      id="superscript"
      variant="secondary"
      icon="superscript"
      :outline="!superscript"
      tooltip="horny index"
      @click="toggleScript(false)"
    />
    <emoji-picker
      v-if="isEditingTextbox"
      @emoji_click="addEmoji"
    />
  </div>
</template>

<script lang="ts">
import { Font, Tool } from '@/@types';
import {fabric} from 'fabric';
import Vue from 'vue'
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { FontsAvailable } from '../Fonts';
import { PDFdocument } from '../PDFdocument';
import ToolButton from './Toolbutton.vue';
import EmojiPicker from './Emoji/EmojiPicker.vue'
import { Canvas } from '@/Canvas';
import { emojiRegex } from './Util';

@Component({
  components: {
    ToolButton,
    EmojiPicker
  }
})
export default class TextSettings extends Vue {
  @Prop({ required: true })
  selectedTool!: Tool<fabric.ITextboxOptions>;
  activeFont = FontsAvailable['Open Sans'];
  fontWeight = 400;
  italic = false;
  subscript = false;
  superscript = false;
  editingActiveTextbox = false
  updateInterval!: NodeJS.Timer;

  get isEditingTextbox(): boolean {
    return this.selectedTool.name == 'Select' && this.editingActiveTextbox
  }

  get fonts(): Record<string, Font> {
    const names = Object.keys(FontsAvailable);
    const ret: Record<string, Font> = {}
    for (const font of names) {
      if(FontsAvailable[font].hidden) continue;
      ret[font] = FontsAvailable[font];
    }
    return ret;
  }

  mounted(){
    this.eventHub.$on('shortcut:bold', this.toggleBold);
    this.eventHub.$on('shortcut:italic', this.toggleItalic);
    this.eventHub.$on('shortcut:superscript', ()=> this.toggleScript(false));
    this.eventHub.$on('shortcut:subscript', ()=> this.toggleScript(true));
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

  toggleScript(subscript: boolean){
    if(subscript)
      this.subscript = !this.subscript;
    else 
      this.superscript = !this.superscript;
    const obj = PDFdocument.activeObject as fabric.Textbox;
    if(obj.getSelectionStyles().some(x=>(Object as any).hasOwn(x, 'fontSize')))
      obj.setSelectionStyles({
        fontSize: obj.fontSize,
        deltaY: 0
      });
    else{
      if(obj.selectionStart == 0 && obj.selectionEnd == obj.text?.length)
        return;
      if(subscript){
        obj.setSubscript(obj.selectionStart || 0, obj.selectionEnd || 0);
      }
      else {
        obj.setSuperscript(obj.selectionStart || 0, obj.selectionEnd || 0);
      }
    }
    obj.cleanStyle('fontSize');
    obj.cleanStyle('deltaY');
    obj.canvas?.requestRenderAll();
  }

  updateFont(font: string){
    this.activeFont = this.fonts[font];
    if(this.selectedTool.name == 'Select'){
      const obj = PDFdocument.activeObject as fabric.Textbox;
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
    this.editingActiveTextbox = obj.isEditing || false
    const styles = obj.getSelectionStyles(obj.selectionStart, obj.selectionEnd)
    const isBold = styles.some(x => {
      return (Object as any).hasOwn(x, 'fontWeight') && x.fontWeight === 600;
    });
    const isItalic = styles.some(x => {
      return (Object as any).hasOwn(x, 'fontStyle') && x.fontStyle === 'italic';
    });
    this.subscript = styles.some(x=>this.isSubscript(x,obj));
    this.superscript = styles.some(x=>this.isSuperscript(x,obj));
    this.fontWeight = isBold ? 600 : 400;
    this.italic = isItalic;
  }

  isSubscript(x:any, obj: fabric.Textbox): boolean {
    const keys = Object.keys(x);
    if(!keys.includes('fontSize') || !keys.includes('deltaY'))
      return false;
    return x['fontSize'] < (obj.fontSize || 0) && x['deltaY'] > 0;
  }

  isSuperscript(x:any, obj: fabric.Textbox): boolean {
    const keys = Object.keys(x);
    if(!keys.includes('fontSize') || !keys.includes('deltaY'))
      return false;
    return x['fontSize'] < (obj.fontSize || 0) && x['deltaY'] < 0;
  }

  addEmoji(emoji: string) {
    const textbox = PDFdocument.activeObject as fabric.Textbox;
    if(!textbox.selectionStart) return;
    textbox.exitEditing();
    const text = Array.from(textbox.text || '');
    const newText = text.slice(0, textbox.selectionStart).join('') + emoji + text.slice(textbox.selectionStart).join('');
    console.log(newText);
    
    textbox.set({
      text: newText,
    });
    textbox.setSelectionStart(textbox.selectionStart + 1);
    textbox.setSelectionEnd(textbox.selectionStart);
    (textbox.canvas as Canvas).setFontForEmojis(textbox);
    textbox.enterEditing();
    textbox.canvas?.requestRenderAll();
  }
}
</script>