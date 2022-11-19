<template>
  <div
    cols="7"
    class="tool-controls"
  >
    <text-settings
      v-if="selectedOptions.hasText"
      :selected-tool="selectedTool"
    />
    <div v-if="selectedOptions.hasStrokeWidth">
      <p>Hrúbka čiary</p>
      <input
        v-model.number="selectedTool.defaultOptions.strokeWidth"
        class=""
        min="1"
        style="width: 100px"
        type="range"
        max="20"
      >
      {{ selectedTool.defaultOptions.strokeWidth || 0 }}
    </div>
    <div v-if="selectedOptions.hasFill">
      <color-picker
        v-model="selectedTool.defaultOptions.fill"
        name="fill"
        :value="selectedTool.defaultOptions.fill"
      >
        <span class="material-icons d-block">format_color_fill</span>
      </color-picker>
    </div>
    <div v-if="selectedOptions.hasStroke">
      <color-picker
        v-model="selectedTool.defaultOptions.stroke"
        name="stroke"
        :value="selectedTool.defaultOptions.stroke"
      >
        <span class="material-icons d-block">gesture</span>
      </color-picker>
    </div>
    <div v-if="selectedTool.name == 'Photo'">
      <b-button
        variant="primary"
        @click="openImageModal"
      >
        <span class="material-icons d-block">add_photo_alternate</span>
      </b-button>
      <b-dropdown
        :text="getImageDropdownText()"
        class="dropdown"
      >
        <b-dropdown-item
          v-for="image in images"
          :key="image.id"
          @click.native="selectedTool.defaultOptions.image = image.id"
        >
          {{ image.name }}
        </b-dropdown-item>
      </b-dropdown>
    </div>
    <div v-if="selectedTool.name == 'Sign'">
      <b-button
        variant="primary"
        class="w-auto p-2"
        @click="openSignModal"
      >
        Otvoriť menu s podpismi
      </b-button>
      <b-dropdown
        :text="getSignDropdownText()"
        class="dropdown"
      >
        <b-dropdown-item
          v-for="sign in signatures"
          :key="sign.id"
          @click.native="selectedTool.defaultOptions.sign = sign.id"
        >
          {{ sign.name }}
        </b-dropdown-item>
        <b-dropdown-item
          v-if="signatures.length == 0"
          disabled
        >
          Nie je nastavený žiaden podpis, pridaj si aspoň jeden
        </b-dropdown-item>
      </b-dropdown>
    </div>
    <b-modal
      ref="imageMenu"
      centered
      title="Obrázky"
      size="lg"
      @ok="imageModalAccepted"
    >
      <image-modal ref="imageModal" />
    </b-modal>
    <b-modal
      ref="signMenu"
      centered
      title="Podpisy"
      size="lg"
      @ok="signModalAccepted"
    >
      <sign-modal
        ref="signModal"
        :signs="getSigns"
      />
    </b-modal>
  </div>    
</template>

<script lang="ts">
import { ITemplate, Tool, ToolOptions } from '@/@types';
import { Database } from '@/Db';
import { getViewedDocument } from '@/Documents/DocumentManager';
import { BModal } from 'bootstrap-vue';
import Vue from 'vue'
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ColorPicker from '../ColorPicker.vue';
import { FontsAvailable } from '../Fonts';
import { PDFdocument } from '../PDFdocument';
import ImageModal from './ImageModal.vue';
import SignModal from './SignModal.vue';
import TextSettings from './TextSettings.vue';

@Component({
  components: {
    ColorPicker,
    SignModal,
    ImageModal,
    TextSettings
  },
})
export default class ToolSettings extends Vue {
  @Prop({required: true})
  selectedTool!: Tool<fabric.IObjectOptions>;
  @Prop({required: true})
  selectedOptions!: ToolOptions;
  fonts = FontsAvailable;
  $refs!: {
    signMenu: BModal;
    imageMenu: BModal;
    signModal: SignModal;
    imageModal: ImageModal;
  }
  signatures: ITemplate[] = [];
  images: ITemplate[] = [];

  mounted(){
    this.getSigns().then((signs) => {
      this.signatures = signs;
    });
    this.getImages().then((images) => {
      this.images = images;
    });
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
        console.log(this.selectedTool.defaultOptions);
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

  openSignModal() {
    this.$refs.signMenu.show();
  }

  openImageModal() {
    this.$refs.imageMenu.show();
  }
}
</script>

<style lang="scss" scoped>
.tool-controls {
  display: flex;
  flex-direction: row;
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

.dropdown {
  margin: 0 2px;
  height: 2.8rem;
}
</style>