<template>
  <b-modal
    ref="modal"
    size="xl"
    title="Opravit pokazene PDFko"
    scrollable
    no-close-on-backdrop
  >
    <p>
      Nie je miesto na Komentár, alebo pdfko je divne otočené? Tu to vieš
      vyriešiť. Rotovanie je ale dostupné len pri riešeniach, kde sú len
      obrázky. Taktiež tu vieš z obrázkových riešení odstrániť biele okraje :)
    </p>
    <div v-if="ImageSources">
      <b-button v-b-toggle.rotate-collapse variant="primary" block
        >Otáčanie strán</b-button
      >
      <b-collapse id="rotate-collapse" @show="renderRotateUI">
        <div v-if="ImageSources.length > 0">
          <b-alert show variant="warning">
            <p>Otáčaj, len ak riešenie obsahuje iba fotky!</p>
            <p>Inak prídeš o všetok text, ktorý tam bol</p>
          </b-alert>
          <div class="pages">
            <b-spinner v-if="imagesLoading"></b-spinner>
            <b-card
              v-else
              v-for="image in ImageSources"
              :key="image.id"
              class="m-2"
            >
              <div ref="images">
                <canvas ref="pageCanvases" class="image"></canvas>
              </div>
            </b-card>
          </div>
        </div>
        <b-alert v-else show variant="success">
          <p>V tomto riešení nie sú obrázky, nie je možné otáčanie</p>
        </b-alert>
      </b-collapse>
    </div>
    <div v-if="err">
      <b-alert show variant="danger">
        {{ err }}
      </b-alert>
    </div>
    <b-button v-b-toggle.new-page variant="primary" block>Nová Strana</b-button>
    <b-collapse id="new-page">
      <b-card>
        <b-row class="p-2 w-100">
          <b-col>Pridat Novú Stranu na koniec</b-col>
          <b-col
            ><b-form-checkbox class="float-right" switch v-model="newPage"
          /></b-col>
        </b-row>
      </b-card>
    </b-collapse>

    <template #modal-footer="{ cancel }">
      <b-button
        @click="generate()"
        size="md"
        :disabled="(ImageSources.length == 0 && !newPage) || busy"
        ><b-spinner v-if="busy" /><span v-else>Vygeneruj</span></b-button
      >
      <b-button size="md" variant="danger" @click="cancel()" :disabled="busy">
        Zrušiť
      </b-button>
    </template>
  </b-modal>
</template>

<script lang="ts">
import { Database } from "@/Db";
import { getViewedDocument } from "@/DocumentManager";
import { BCard, BModal } from "bootstrap-vue";
import { fabric } from "fabric";
import Vue from "vue";
import Component from "vue-class-component";
import { AddTrailingPage, ExtractImages, GeneratePDF, GetA4Dimensions, PDFImage } from "./PdfModifier";

@Component
export default class PDFRepairer extends Vue {
  ImageSources: PDFImage[] = [];
  canvases: fabric.Canvas[] = [];
  newPage: boolean = false;
  err: string = '';
  rotating: boolean = false;
  busy: boolean = false;
  imagesLoading: boolean = true;

  $refs!: {
    modal: BModal;
    pageCanvases: HTMLCanvasElement[];
    images: HTMLElement[]
  };
  Open() {
    this.$refs.modal.show();

    this.loadImages();
  }
  async loadImages() {
    const id = getViewedDocument()?.id;
    if (id) {
      const doc = await Database.getDocument(id);
      this.ImageSources = await ExtractImages(doc.initialPdf).catch(err => {
        this.err = err;
      }) || [];
      this.imagesLoading = false;
      await this.$nextTick();
      this.renderRotateUI();
    }
  }

  generate() {

    const doc = getViewedDocument()?.id;
    if (!doc) return;
    this.$bvModal.msgBoxConfirm('Ak upravíš toto PDFko, tak stratíš v nom všetky zmeny', {
      title: 'Upraviť PDFko?',
    }).then((val) => {
      if (!val) return;
      this.busy = true;
      if (this.ImageSources.length > 0) {
        GeneratePDF(this.ImageSources, this.newPage, doc).then(this.generationFinished)
      }
      else if (this.newPage) {
        AddTrailingPage(doc).then(this.generationFinished)
      }
    })
  }

  generationFinished() {
    this.busy = false;
    this.$bvToast.toast('PDFko bolo úspešne upravené. Refreshni stránku (F5) na zobrazenie', {
      title: 'PDFko upravené',
      variant: 'success',
      solid: true,
      autoHideDelay: 5000,
    });
    this.$refs.modal.hide();
  }
  renderRotateUI() {
    const images = this.ImageSources;
    this.rotating = false;
    if (!this.$refs.pageCanvases) return;
    this.$refs.pageCanvases.forEach((e, i) => {
      const img = new Image();
      img.src = images[i].url;
      const dimensions = GetA4Dimensions();
      const pageAspect = dimensions.width / dimensions.height;
      img.onload = () => {
        const width = 300;
        const cnv = new fabric.Canvas(e, {
          width: width,
          height: width / pageAspect,
          backgroundColor: 'transparent',
          selection: false,
        });
        cnv.setZoom(width / dimensions.width);
        const cnvImg = new fabric.Image(img, {
          top: dimensions.height / 2,
          left: dimensions.width / 2,
          originX: 'center',
          originY: 'center',
          width: img.width,
          height: img.height,
          hasControls: false,
          lockMovementX: true,
          lockMovementY: true,
          scaleX: dimensions.width / img.width,
          scaleY: dimensions.width / img.width,
        });
        cnv.add(cnvImg);
        this.canvases.push(cnv);
        cnv.on('mouse:down', (e) => {
          if (e.target && e.target.type === 'image') {
            if (!e.target.width || !e.target.height || !e.target.scaleX || !e.target.scaleY) return;
            let currAngle = e.target.angle || 0;
            e.target.set({
              angle: (currAngle + 90) % 360,
            });
            currAngle = (currAngle + 90) % 360;
            images[i].rotation = currAngle / 90;
            if ((currAngle / 90) % 2 == 1) {
              e.target.set({
                scaleX: dimensions.width / e.target.height,
                scaleY: dimensions.width / e.target.height,
              });
            }
            else {
              e.target.set({
                scaleX: dimensions.width / e.target.width,
                scaleY: dimensions.width / e.target.width,
              });
            }
            images[i].width = e.target.width * e.target.scaleX;
            images[i].height = e.target.height * e.target.scaleY;
            cnv.renderAll();
            console.log(images);
          }
        });
      }
    })
  }
}
</script>

<style scoped>
.image {
  width: 100%;
  height: 100%;
  margin: 0;
}
.card-body {
  padding: 0;
  display: flex;
}
.pages {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}
</style>