<template>
  <div class="toolbar d-flex flex-row justify-content-start align-items-center">
    <div :key="tool.name" v-for="tool in tools">
      <button
        :id="tool.name"
        class="btn"
        :class="{
          'btn-primary': selectedTool.name == tool.name,
          'btn-outline-primary': selectedTool.name != tool.name,
        }"
        @click="select(tool)"
        v-shortkey="[`${tool.shortcut}`]"
        @shortkey="select(tool)"
      >
        <span class="material-icons">{{ tool.icon }}</span>
      </button>
      <b-tooltip :target="tool.name" triggers="hover">
        {{ tool.tooltip }} ({{ tool.shortcut }})
      </b-tooltip>
    </div>
    <div class="btn" v-if="selectedOptions.hasText">
      <b-dropdown text="Font">
        <b-dropdown-item
          v-for="font in fonts"
          :key="font.viewport"
          :style="{ 'font-family': font.viewport }"
          @click.native="selectedTool.defaultOptions.fontFamily = font.viewport"
          >{{ font.viewport }}</b-dropdown-item
        >
      </b-dropdown>
    </div>
    <div class="form-inline" v-if="selectedOptions.hasText">
      <p class="d-flex align-items-center">Font Size</p>
      <input
        class="form-control"
        min="0"
        style="width: 100px"
        type="number"
        v-model.number="selectedTool.defaultOptions.fontSize"
      />
    </div>
    <div class="form-inline" v-if="selectedOptions.hasStrokeWidth">
      <p class="d-flex align-items-center">Stroke Width</p>
      <input
        class="form-control"
        min="1"
        style="width: 100px"
        type="range"
        max="20"
        v-model.number="selectedTool.defaultOptions.strokeWidth"
      />
      {{ selectedTool.defaultOptions.strokeWidth }}
    </div>
    <div v-if="selectedOptions.hasFill" class="d-flex align-items-center">
      <p style="margin: 5px">Fill</p>
      <v-swatches v-model="selectedTool.defaultOptions.fill"></v-swatches>
    </div>
    <div v-if="selectedOptions.hasStroke" class="d-flex align-items-center">
      <p style="margin: 5px">Stroke</p>
      <v-swatches v-model="selectedTool.defaultOptions.stroke"></v-swatches>
    </div>
    <div v-if="selectedTool.name == 'Photo'">
      <b-button variant="primary" @click="openImageModal"
        >Open Image Menu</b-button
      >
    </div>
    <div v-if="selectedTool.name == 'Sign'">
      <b-button variant="primary" @click="openSignModal"
        >Open Sign Menu</b-button
      >
      <b-dropdown text="Select signature">
        <b-dropdown-item
          v-for="sign in signatures"
          :key="sign.id"
          @click.native="selectedTool.defaultOptions.sign = sign.id"
          >{{ sign.name }}</b-dropdown-item
        >
      </b-dropdown>
    </div>
    <b-modal ref="imageMenu" centered title="Organize Images" size="lg">
      <image-modal></image-modal>
    </b-modal>
    <b-modal
      ref="signMenu"
      centered
      title="Organize signatures"
      size="lg"
      @ok="signModalAccepted"
    >
      <sign-modal :signs="getSigns" ref="signModal"></sign-modal>
    </b-modal>
    <hr />
    <div class="right-controls">
      <!-- TODO: zooming canvas & document -->
      <button id="zoomInButton" class="btn btn-outline-primary">
        <span class="material-icons">add</span>
      </button>
      <button id="zoomOutButton" class="btn btn-outline-primary">
        <span class="material-icons">remove</span>
      </button>
      <b-tooltip target="zoomOutButton" triggers="hover"> Oddialit </b-tooltip>
      <b-tooltip target="zoomInButton" triggers="hover"> Priblizit </b-tooltip>
    </div>
  </div>
</template>

<script>
import { eventHub as ToolEvents, tools } from "./Tool";
import { PDFdocument } from "../PDFdocument";
import { FontsAvailable } from "../Fonts";
import { Canvas } from "../../Canvas";
import { getViewedDocument } from "@/DocumentManager";

import VSwatches from "vue-swatches";
import SignModal from "./SignModal.vue";
import ImageModal from "./ImageModal.vue";

// Import the styles too, globally
import "vue-swatches/dist/vue-swatches.css";
import { Database } from "@/Db";

export default {
  components: {
    VSwatches,
    SignModal,
    ImageModal,
  },
  data() {
    return {
      tools: tools,
      selectedTool: tools[0],
      selectedOptions: tools[0].options,
      fill: "#ffffff",
      stroke: "#000000",
      fonts: FontsAvailable,
      signatures: [],
    };
  },
  mounted() {
    ToolEvents.$emit("init", this);
    Canvas.toolbarRef = this;
    this.getSigns().then((signs) => {
      this.$data.signatures = signs;
    });
  },
  methods: {
    select(tool) {
      this.$data.selectedTool = tool;
      ToolEvents.$emit("tool:select", tool);
    },
    openSignModal() {
      this.$refs.signMenu.show();
    },
    openImageModal() {
      this.$refs.imageMenu.show();
    },
    getSigns() {
      return new Promise((resolve, reject) => {
        Database.getAllTemplates()
          .then((templates) => {
            resolve(templates.filter((e) => e.type === "Sign"));
          })
          .catch((err) => reject(err));
      });
    },
    signModalAccepted() {
      this.$refs.signModal.signModalAccepted();
    },
  },
  created() {
    this.$watch(
      "selectedTool.defaultOptions",
      () => {
        if (this.$data.selectedTool.name == "Select") {
          this.$data.selectedTool.defaultOptions.width =
            PDFdocument.activeObject?.width;
          this.$data.selectedTool.defaultOptions.height =
            PDFdocument.activeObject?.height;
          this.$data.selectedTool.defaultOptions.top =
            PDFdocument.activeObject?.top;
          this.$data.selectedTool.defaultOptions.left =
            PDFdocument.activeObject?.left;
          if (PDFdocument.activeObject != null) {
            PDFdocument.activeObject.set(
              this.$data.selectedTool.defaultOptions
            );
            PDFdocument.activeObject.canvas?.renderAll();
          }
        } else if (this.$data.selectedTool.name == "Draw") {
          getViewedDocument()?.pageCanvases.forEach((e) => {
            e.freeDrawingBrush.color =
              this.$data.selectedTool.defaultOptions.stroke || "#000000";
            e.freeDrawingBrush.width =
              this.$data.selectedTool.defaultOptions.strokeWidth || 10;
          });
        }
      },
      { deep: true }
    );
  },
};
</script>

<style scoped>
.toolbar {
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  height: 6vh;
  padding: 5px;
}
.btn {
  margin: 0 2px;
}
b-dropdown {
  margin: 0 2px;
}
.right-controls {
  margin-right: 10px;
}
</style>