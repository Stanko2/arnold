<template>
  <div class="toolbar">
    <div cols="3" class="d-flex p-0">
      <div :key="tool.name" v-for="tool in tools">
        <button
          :id="tool.name"
          class="btn"
          :class="{
            'btn-primary': selectedTool.name == tool.name,
            'btn-outline-primary': selectedTool.name != tool.name,
          }"
          @click="select(tool)"
        >
          <span class="material-icons d-block">{{ tool.icon }}</span>
        </button>
        <b-tooltip :target="tool.name" triggers="hover">
          {{ tool.tooltip }} ({{ tool.shortcut }})
        </b-tooltip>
      </div>
    </div>
    <tool-settings :selectedOptions="selectedOptions" :selectedTool="selectedTool" class="d-xl-flex d-none" />
    <div cols="2" class="right-controls">
      <div :key="util.name" v-for="util in utils">
        <button
            :id="util.name"
            class="btn"
            :class="util.style"
            @click="useUtil(util)"
        >
          <span class="material-icons d-block">{{ util.icon }}</span>
        </button>
        <b-tooltip :target="util.name" triggers="hover">
          {{ util.tooltip }} ({{ util.shortcut }})
        </b-tooltip>
      </div>
      <button
        id="zoomInButton"
        class="btn btn-outline-primary"
        @click="eventHub.$emit('viewport:scale', 0.1)"
      >
        <span class="material-icons d-block">add</span>
      </button>
      <button
        id="zoomOutButton"
        class="btn btn-outline-primary"
        @click="eventHub.$emit('viewport:scale', -0.1)"
      >
        <span class="material-icons d-block">remove</span>
      </button>
      <b-button id="repairButton" @click="$refs.repairTool.Open()">
        <span class="material-icons d-block">build</span>
      </b-button>
      <pdf-repairer ref="repairTool" />
      <b-tooltip target="zoomOutButton" triggers="hover"> Oddialiť </b-tooltip>
      <b-tooltip target="zoomInButton" triggers="hover"> Priblížiť </b-tooltip>
      <b-tooltip target="repairButton" triggers="hover">
        Otočiť obrázky alebo pridať prázdnu stranu
      </b-tooltip>
      <!-- <b-tooltip target="rotateButton" triggers="hover"> Otocit </b-tooltip> -->
      <b-button class="d-xl-none" @click="optionsMenuExpanded = !optionsMenuExpanded">
        <span class="material-icons d-block">{{ optionsMenuExpanded ? 'expand_less' : 'expand_more' }}</span>
      </b-button>
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

@Component({
  components: {
    PdfRepairer,
    ToolSettings
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
        autoHideDelay: 3000,
        title: 'Skopírované',
        appendToast: true,
        toaster: 'b-toaster-top-left'
      })
  }

  select(tool: Tool) {
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
.btn {
  margin: 0 2px;
  width: 2.8rem;
  height: 2.8rem;
  padding: 0;
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
