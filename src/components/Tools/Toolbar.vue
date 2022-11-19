<template>
  <div class="toolbar">
    <div cols="3" class="d-flex p-0">
      <div :key="tool.name" v-for="tool in tools">
        <tool-button
          :id="tool.name"
          :icon="tool.icon"
          :outline="selectedTool.name != tool.name"
          :tooltip="tool.tooltip + '(' + tool.shortcut + ')'"
          @click="select(tool)"
          variant='primary'
        />
      </div>
    </div>
    <tool-settings :selectedOptions="selectedOptions" :selectedTool="selectedTool" class="d-xl-flex d-none" />
    <div cols="2" class="right-controls">
      <div :key="util.name" v-for="util in utils">
        <tool-button
            :id="util.name"
            class="btn"
            :variant="util.style"
            @click="useUtil(util)"
            :icon="util.icon"
            :outline="true"
            :tooltip="util.tooltip + '(' + util.shortcut + ')'"
        />
      </div>
      <tool-button
        id="zoomInButton"
        @click="eventHub.$emit('viewport:scale', 0.1)"
        icon="add"
        :outline="true"
        tooltip="Priblížiť"
      />
      <tool-button
        id="zoomOutButton"
        @click="eventHub.$emit('viewport:scale', -0.1)"
        icon="remove"
        :outline="true"
        tooltip="Oddialiť"
      />
      <tool-button id="repairButton" @click="$refs.repairTool.Open()" icon="build" variant="secondary" :outline="false" tooltip="Opraviť zle nahraté PDFko (pridať prázdnu stranu a otočiť obrázky)"/>
      <pdf-repairer ref="repairTool" />
      
      <tool-button class="d-xl-none" @click="optionsMenuExpanded = !optionsMenuExpanded" :icon="optionsMenuExpanded ? 'expand_less' : 'expand_more'" variant="secondary">
        <span class="material-icons d-block">{{ optionsMenuExpanded ? 'expand_less' : 'expand_more' }}</span>
      </tool-button>
    </div>
    <div class="toolSettingsSm" v-if="optionsMenuExpanded">
      <tool-settings :selectedOptions="selectedOptions" :selectedTool="selectedTool"/>
    </div>
  </div>
</template>

<script lang="ts">
import {tools} from "./Tool";
import {utils} from "./Util";
import {Canvas} from "../../Canvas";
import {getViewedDocument} from "@/Documents/DocumentManager";
import PdfRepairer from "./PdfRepairer/PdfRepairer.vue";
import {Component} from "vue-property-decorator";
import Vue from "vue";
import {Tool, Util} from "@/@types";
import ToolSettings from "./ToolSettings.vue";
import ToolButton from "./Toolbutton.vue";

@Component({
  components: {
    PdfRepairer,
    ToolSettings,
    ToolButton
  },
})
export default class Toolbar extends Vue {
  tools = tools;
  utils = utils;
  selectedTool = tools[0];
  selectedOptions = tools[0].options;
  optionsMenuExpanded = false;
  $refs!: {
    repairTool: PdfRepairer;
  }

  mounted() {
    this.eventHub.$emit("tool:init", this);
    Canvas.toolbarRef = this;
   
    for (const tool of tools) {
      this.eventHub.$on(`shortcut:${tool.name}`, () => this.select(tool));
    }
    for (const util of utils) {
      this.eventHub.$on(`shortcut:${util.name}`, () => this.useUtil(util, true));
    }
  }

  useUtil(util: Util, mouse: boolean = false) {
    const doc = getViewedDocument();
    if(doc === null) throw new Error("No document is opened");

    let page = -1;
    for(let i=0; i<doc.pageCanvases.length; i++) {
      if(doc.pageCanvases[i].getActiveObject() !== null) {
        page = i;
        break;
      }
    }
    const objects = util.use(doc, page, mouse);
    if(util.name == 'copy' && objects)
      this.$bvToast.toast(`Skopírovaných ${objects.length} objektov`, {
        variant: 'success',
        autoHideDelay: 50000,
        title: 'Skopírované',
        appendToast: true,
        toaster: 'b-toaster-top-left'
      })
  }

  select(tool: Tool<fabric.IObjectOptions>) {
    this.selectedTool = tool;
    this.eventHub.$emit("tool:select", tool);
  }
}
</script>

<style scoped lang="scss">
$toolbar-height: 60px;
.toolbar {
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  max-width: 100%;
  padding: 5px;
  margin: 0;
  justify-content: space-between;
  background-color: var(--bg-700);
  display: flex;
  flex-wrap: wrap;
  justify-content: left;
  // overflow-x: auto;
  height: $toolbar-height;
}
.right-controls {
  display: flex;
  flex-direction: row;
  margin-left:auto;
  justify-content: flex-end;
  padding: 0;
}
.toolSettingsSm {
  position: absolute;
  top: $toolbar-height;
  background: var(--bg-700);
  height: $toolbar-height;
  width: 100%;
  z-index: 10;
  border-radius:  0 0 10px 10px;
  right:0
}
</style>
