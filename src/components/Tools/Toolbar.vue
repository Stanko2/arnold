<template>
  <b-row class="toolbar">
    <b-col cols="3" class="d-flex p-0">
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
    </b-col>
    <b-col cols="7" class="tool-controls">
      <div class="" v-if="selectedOptions.hasText">
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
      <div class="form-inline" v-if="selectedOptions.hasText">
        <p class="d-flex align-items-center">Veľkosť Písma</p>
        <input
          type="number"
          class="form-control"
          min="0"
          style="width: 100px"
          v-model.number="selectedTool.defaultOptions.fontSize"
        />
      </div>
      <div v-if="selectedOptions.hasStrokeWidth">
        <p>Hrúbka čiary</p>
        <input
          class=""
          min="1"
          style="width: 100px"
          type="range"
          max="20"
          v-model.number="selectedTool.defaultOptions.strokeWidth"
        />
        {{ selectedTool.defaultOptions.strokeWidth || 0 }}
      </div>
      <div v-if="selectedOptions.hasFill">
        <p style="margin: 5px">Výplň</p>
        <color-picker
          name="fill"
          v-model="selectedTool.defaultOptions.fill"
          :value="selectedTool.defaultOptions.fill"
        />
      </div>
      <div v-if="selectedOptions.hasStroke">
        <p style="margin: 5px">Farba čiary</p>
        <color-picker
          name="stroke"
          v-model="selectedTool.defaultOptions.stroke"
          :value="selectedTool.defaultOptions.stroke"
        />
      </div>
      <div v-if="selectedTool.name == 'Photo'">
        <b-button variant="primary" @click="openImageModal">
          <span class="material-icons d-block">add_photo_alternate</span></b-button
        >
        <b-dropdown :text="getImageDropdownText()" class="dropdown">
          <b-dropdown-item
            v-for="image in images"
            :key="image.id"
            @click.native="selectedTool.defaultOptions.image = image.id"
            >{{ image.name }}</b-dropdown-item
          >
        </b-dropdown>
      </div>
      <div v-if="selectedTool.name == 'Sign'">
        <b-button variant="primary" @click="openSignModal" class="w-auto p-2"
          >Otvoriť menu s podpismi</b-button
        >
        <b-dropdown :text="getSignDropdownText()" class="dropdown">
          <b-dropdown-item
            v-for="sign in signatures"
            :key="sign.id"
            @click.native="selectedTool.defaultOptions.sign = sign.id"
            >{{ sign.name }}</b-dropdown-item
          >
          <b-dropdown-item v-if="signatures.length == 0" disabled>
            Nie je nastavený žiaden podpis, pridaj si aspoň jeden
          </b-dropdown-item>
        </b-dropdown>
      </div>
    </b-col>
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
    <b-col cols="2" class="right-controls">
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
        Opraviť zle nahraté PDFko (pridať prázdnu stranu a otočiť obrázky)
      </b-tooltip>
      <!-- <b-tooltip target="rotateButton" triggers="hover"> Otocit </b-tooltip> -->
    </b-col>
  </b-row>
</template>

<script lang="ts">
import {tools} from "./Tool";
import {utils} from "./Util";
import {PDFdocument} from "../PDFdocument";
import {FontsAvailable} from "../Fonts";
import {Canvas} from "../../Canvas";
import {getViewedDocument} from "@/Documents/DocumentManager";

import SignModal from "./SignModal.vue";
import ImageModal from "./ImageModal.vue";
import ColorPicker from "../ColorPicker.vue";
import PdfRepairer from "./PdfRepairer/PdfRepairer.vue";
import {Database} from "@/Db";
import {Component, Watch} from "vue-property-decorator";
import {BModal} from "bootstrap-vue";
import Vue from "vue";
import {ITemplate, Tool, Util} from "@/@types";

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
  utils = utils;
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
    repairTool: PdfRepairer;
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

  select(tool: Tool) {
    this.selectedTool = tool;
    console.log(this.selectedTool);
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
        (e) => e.id == (this.selectedTool.defaultOptions as any)?.image
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

<style scoped lang="scss">
.toolbar {
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  padding: 5px;
  margin: 0;
  justify-content: space-between;
  background-color: var(--bg-700);
}
.btn {
  margin: 0 2px;
  width: 2.8rem;
  height: 2.8rem;
  padding: 0;
}
.dropdown {
  margin: 0 2px;
  height: 2.8rem;
}
.right-controls {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  padding: 0;
}
.tool-controls {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 0 0 0 1rem;

  div {
    margin: 0 2px;
    display: flex;
    align-items: center;
    p {
      margin: 0 5px !important;
    }
  }
}
</style>
