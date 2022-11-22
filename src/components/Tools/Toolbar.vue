<template>
  <div class="toolbar">
    <div
      cols="3"
      class="d-flex p-0"
    >
      <div
        v-for="tool in tools"
        :key="tool.name"
      >
        <tool-button
          :id="tool.name"
          :icon="tool.icon"
          :outline="selectedTool.name != tool.name"
          :tooltip="tool.tooltip + '(' + tool.shortcut + ')'"
          variant="primary"
          @click="select(tool)"
        />
      </div>
    </div>
    <tool-settings
      :selected-options="selectedOptions"
      :selected-tool="selectedTool"
      class="d-xl-flex d-none"
    />
    <div
      cols="2"
      class="right-controls"
    >
      <div
        v-for="util in utils"
        :key="util.name"
      >
        <tool-button
          :id="util.name"
          class="btn"
          :variant="util.style"
          :icon="util.icon"
          :outline="true"
          :tooltip="util.tooltip + '(' + util.shortcut + ')'"
          @click="useUtil(util)"
        />
      </div>
      <tool-button
        id="zoomInButton"
        icon="add"
        :outline="true"
        tooltip="Priblížiť"
        @click="eventHub.$emit('viewport:scale', 0.1)"
      />
      <tool-button
        id="zoomOutButton"
        icon="remove"
        :outline="true"
        tooltip="Oddialiť"
        @click="eventHub.$emit('viewport:scale', -0.1)"
      />
      <tool-button
        id="repairButton"
        icon="build"
        variant="secondary"
        :outline="false"
        tooltip="Opraviť zle nahraté PDFko (pridať prázdnu stranu a otočiť obrázky)"
        @click="$refs.repairTool.Open()"
      />
      <pdf-repairer ref="repairTool" />
      
      <tool-button
        id="collapseButton"
        class="d-xl-none"
        :icon="optionsMenuExpanded ? 'expand_less' : 'expand_more'"
        variant="secondary"
        @click="optionsMenuExpanded = !optionsMenuExpanded"
      >
        <span class="material-icons d-block">{{ optionsMenuExpanded ? 'expand_less' : 'expand_more' }}</span>
      </tool-button>
    </div>
    <div
      v-if="optionsMenuExpanded"
      class="toolSettingsSm"
    >
      <tool-settings
        :selected-options="selectedOptions"
        :selected-tool="selectedTool"
      />
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
    console.log(this.tools[0].name);
    
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
  align-items: center;
  // overflow-x: auto;
  height: $toolbar-height;
}
.right-controls {
  display: flex;
  flex-direction: row;
  margin-left:auto;
  justify-content: flex-end;
  padding: 0;
  align-items: center;
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
