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
      <b-dropdown :text="selectedTool.defaultOptions.fontFamily">
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
      <p class="d-flex align-items-center">Veľkosť Písma</p>
      <input
        class="form-control"
        min="0"
        style="width: 100px"
        type="number"
        v-model.number="selectedTool.defaultOptions.fontSize"
      />
    </div>
    <div class="form-inline" v-if="selectedOptions.hasStrokeWidth">
      <p class="d-flex">Hrúbka čiary</p>
      <input
        class=""
        min="1"
        style="width: 100px"
        type="range"
        max="20"
        v-model.number="selectedTool.defaultOptions.strokeWidth"
      />
      {{ selectedTool.defaultOptions.strokeWidth }}
    </div>
    <div v-if="selectedOptions.hasFill" class="d-flex align-items-center">
      <p style="margin: 5px">Výplň</p>
      <color-picker
        name="fill"
        v-model="selectedTool.defaultOptions.fill"
        :value="selectedTool.defaultOptions.fill"
      />
    </div>
    <div v-if="selectedOptions.hasStroke" class="d-flex align-items-center">
      <p style="margin: 5px">Farba čiary</p>
      <color-picker
        name="stroke"
        v-model="selectedTool.defaultOptions.stroke"
        :value="selectedTool.defaultOptions.stroke"
      />
    </div>
    <div v-if="selectedTool.name == 'Photo'">
      <b-button variant="primary" @click="openImageModal"
        >Otvoriť obrázkové menu</b-button
      >
      <b-dropdown :text="getImageDropdownText()">
        <b-dropdown-item
          v-for="image in images"
          :key="image.id"
          @click.native="selectedTool.defaultOptions.image = image.id"
          >{{ image.name }}</b-dropdown-item
        >
      </b-dropdown>
    </div>
    <div v-if="selectedTool.name == 'Sign'">
      <b-button variant="primary" @click="openSignModal"
        >Otvoriť menu s podpismi</b-button
      >
      <b-dropdown :text="getSignDropdownText()">
        <b-dropdown-item
          v-for="sign in signatures"
          :key="sign.id"
          @click.native="selectedTool.defaultOptions.sign = sign.id"
          >{{ sign.name }}</b-dropdown-item
        >
      </b-dropdown>
    </div>
    <b-modal
      ref="imageMenu"
      centered
      title="Obrázky"
      size="lg"
      @ok="imageModalAccepted"
    >
      <image-modal ref="imageModal"></image-modal>
    </b-modal>
    <b-modal
      ref="signMenu"
      centered
      title="Podpisy"
      size="lg"
      @ok="signModalAccepted"
    >
      <sign-modal :signs="getSigns" ref="signModal"></sign-modal>
    </b-modal>
    <hr />
    <div class="right-controls">
      <button
        id="zoomInButton"
        class="btn btn-outline-primary"
        @click="eventHub.$emit('viewport:scale', 0.1)"
      >
        <span class="material-icons">add</span>
      </button>
      <button
        id="zoomOutButton"
        class="btn btn-outline-primary"
        @click="eventHub.$emit('viewport:scale', -0.1)"
      >
        <span class="material-icons">remove</span>
      </button>
      <!-- <button
        id="rotateButton"
        class="btn btn-outline-primary"
        @click="eventHub.$emit('viewport:rotate')"
      >
        <span class="material-icons">refresh</span>
      </button> -->
      <b-button id="repairButton" @click="$refs.repairTool.Open()">
        <span class="material-icons">build</span>
      </b-button>
      <pdf-repairer ref="repairTool" />
      <b-tooltip target="zoomOutButton" triggers="hover"> Oddialiť </b-tooltip>
      <b-tooltip target="zoomInButton" triggers="hover"> Priblížiť </b-tooltip>
      <b-tooltip target="repairButton" triggers="hover">
        Opraviť zle nahraté PDFko (pridať prázdnu stranu a otočiť obrázky)
      </b-tooltip>
      <!-- <b-tooltip target="rotateButton" triggers="hover"> Otocit </b-tooltip> -->
    </div>
  </div>
</template>

<script lang="ts">
import { tools } from "./Tool";
import { PDFdocument } from "../PDFdocument";
import { FontsAvailable } from "../Fonts";
import { Canvas } from "../../Canvas";
import { getViewedDocument } from "@/DocumentManager";

import SignModal from "./SignModal.vue";
import ImageModal from "./ImageModal.vue";
import ColorPicker from "../ColorPicker.vue";
import PdfRepairer from "./PdfRepairer/PdfRepairer.vue";
import { Database } from "@/Db";
import { Component, Watch } from "vue-property-decorator";
import { BModal } from "bootstrap-vue";
import Vue from "vue";
import { ITemplate, Tool } from "@/@types";

@Component({
  components: {
    ColorPicker,
    SignModal,
    ImageModal,
    PdfRepairer,
  },
})
export default class Toolbar extends Vue {
  tools = tools;
  selectedTool = tools[0];
  selectedOptions = tools[0].options;
  fill = "#ffffff";
  stroke = "#000000";
  fonts = FontsAvailable;
  signatures: ITemplate[] = [];
  images: ITemplate[] = [];

  $refs!: {
    signMenu: BModal;
    imageMenu: BModal;
    signModal: SignModal;
    imageModal: ImageModal;
  }

  mounted() {
    this.eventHub.$emit("tool:init", this);
    Canvas.toolbarRef = this;
    this.getSigns().then((signs) => {
      this.signatures = signs;
    });
    this.getImages().then((images) => {
      this.images = images;
    });
  }

  select(tool: Tool) {
    this.selectedTool = tool;
    this.eventHub.$emit("tool:select", tool);
  }

  openSignModal() {
    this.$refs.signMenu.show();
  }

  openImageModal() {
    this.$refs.imageMenu.show();
  }

  getSigns() {
    return new Promise<ITemplate[]>((resolve, reject) => {
      Database.getAllTemplates()
        .then((templates) => {
          resolve(templates.filter((e) => e.type === "Sign"));
        })
        .catch((err) => reject(err));
    });
  }

  getImages() {
    return new Promise<ITemplate[]>((resolve, reject) => {
      Database.getAllTemplates()
        .then((templates) => {
          resolve(templates.filter((e) => e.type === "Image"));
        })
        .catch((err) => reject(err));
    });
  }

  signModalAccepted() {
    this.$refs.signModal.signModalAccepted();
    this.getSigns().then((signs) => {
      this.signatures = signs;
    });
  }

  imageModalAccepted() {
    this.$refs.imageModal.imageModalAccepted();
    this.getImages().then((images) => {
      this.images = images;
    });
  }

  getSignDropdownText() {
    return (
      this.signatures.find(
        (e) => e.id == (this.selectedTool.defaultOptions as any).sign
      )?.name || "Vyber Podpis"
    );
  }

  getImageDropdownText() {
    return (
      this.images.find(
        (e) => e.id == (this.selectedTool.defaultOptions as any).image
      )?.name || "Vyber obrázok"
    );
  }

  @Watch('selectedTool.defaultOptions', { deep: true })
  onOptionsChanged() {
    if (
      this.selectedTool.name == "Select" &&
      this.selectedTool.defaultOptions
    ) {
      if (PDFdocument.activeObject != null) {
        if (PDFdocument.activeObject.type == "group") {
          (PDFdocument.activeObject as fabric.Group).getObjects().forEach((obj) => {
            obj.set(this.selectedTool.defaultOptions);
          });
        }
        PDFdocument.activeObject.set(this.selectedTool.defaultOptions);
        try {
          PDFdocument.activeObject.canvas?.renderAll();
        } catch (e) {
          return;
        }
      }
    } else if (this.selectedTool.name == "Draw") {
      getViewedDocument()?.pageCanvases.forEach((e) => {
        e.freeDrawingBrush.color =
          this.selectedTool.defaultOptions.stroke || "#000000";
        e.freeDrawingBrush.width =
          this.selectedTool.defaultOptions.strokeWidth || 10;
      });
    }
  }
}
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
