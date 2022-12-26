<template>
  <b-modal
    ref="modal"
    size="xl"
    title="Opraviť pokazené PDFko"
    scrollable
    no-close-on-backdrop
  >
    <p>
      Nie je miesto na komentár, alebo pdfko je divne otočené? Tu to vieš vyriešiť.
      <br>
      Otáčanie strán je dostupné len pri riešeniach, kde sú len obrázky.
    </p>
    <div v-if="ImageSources">
      <b-button
        v-b-toggle.rotate-collapse
        variant="primary"
        block
      >
        Otáčanie strán
      </b-button>
      <b-collapse
        id="rotate-collapse"
        @show="renderRotateUI"
      >
        <div v-if="ImageSources.length > 0">
          <b-alert
            show
            variant="warning"
          >
            <p>
              Otáčaj, len ak riešenie obsahuje iba fotky, inak prídeš o všetok text a zmeny, ktorý v ňom boli!<br>
              Riešenie otočíš kliknutím na obrázok nižšie a otočenie uložíš stlačením <b>Vygeneruj</b>.
            </p>
          </b-alert>
          <div class="pages">
            <b-spinner v-if="imagesLoading" />
            <b-card
              v-for="image in ImageSources"
              v-else
              :key="image.id"
              class="m-2"
            >
              <div ref="images">
                <canvas
                  ref="pageCanvases"
                  class="image"
                />
              </div>
            </b-card>
          </div>
        </div>
        <b-alert
          v-else
          show
          variant="success"
        >
          <p>V tomto riešení nie sú obrázky, nie je možné otáčanie</p>
        </b-alert>
      </b-collapse>
    </div>
    <div v-if="err">
      <b-alert
        show
        variant="danger"
      >
        {{ err }}
      </b-alert>
    </div>
    <b-button
      v-b-toggle.new-page
      variant="primary"
      block
    >
      Nová strana
    </b-button>
    <b-collapse id="new-page">
      <b-card>
        <b-row class="p-2 w-100">
          <b-col>Pridať novú stranu na koniec</b-col>
          <b-col>
            <b-form-checkbox
              v-model="newPage"
              class="float-right"
              switch
            />
          </b-col>
        </b-row>
      </b-card>
    </b-collapse>

    <template #modal-footer="{ cancel }">
      <b-button
        size="md"
        :disabled="(ImageSources.length === 0 && !newPage) || busy"
        @click="generate()"
      >
        <b-spinner v-if="busy" /><span v-else>Vygeneruj</span>
      </b-button>
      <b-button
        size="md"
        variant="danger"
        :disabled="busy"
        @click="cancel()"
      >
        Zrušiť
      </b-button>
    </template>
  </b-modal>
</template>

<script lang="ts">
import {Database} from "@/Db";
import {getViewedDocument} from "@/Documents/DocumentManager";
import {BCard, BModal} from "bootstrap-vue";
import {fabric} from "fabric";
import Vue from "vue";
import Component from "vue-class-component";
import {AddTrailingPage, ExtractImages, GeneratePDF, GetA4Dimensions, PDFImage} from "./PdfModifier_old";

@Component({
  components: {
    BModal,
    BCard,
  }
})
export default class PDFRepairer_old extends Vue {
  ImageSources: PDFImage[] = [];
  canvases: fabric.Canvas[] = [];
  newPage: boolean = false;
  err: string = '';
  rotating: boolean = false;
  busy: boolean = false;
  imagesLoading: boolean = true;
  rotated: boolean = false;

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

    if (this.rotated) {
      this.$bvModal.msgBoxConfirm('Ak upravíš toto PDFko, tak stratíš všetky zmeny ktoré v ňom boli urobené', {
        title: 'Upraviť PDFko?',
      }).then((val) => {
        if (!val) return;
        this.busy = true;
        this.eventHub.$emit('document:save')
        GeneratePDF(this.ImageSources, this.newPage, doc).then(this.generationFinished)
      })
    } else if (this.newPage) {
      this.busy = true;
      this.eventHub.$emit('document:save')
      AddTrailingPage(doc).then(this.generationFinished)
    } else {
      this.$bvToast.toast('Nevybral si ktoré strany ako otočiť ani či chceš pridať stranu. ' +
                          'Pre vygenerovanie zmeneného PDFka musíš vybrať aspoň jednu akciu.', {
        title: 'Neboli vykonané žiadne zmeny',
        variant: 'warning',
        solid: true,
        autoHideDelay: 3000,
      })
    }
  }

  generationFinished() {
    this.busy = false;
    this.$bvToast.toast('PDFko bolo úspešne upravené. Obnov stránku (F5) na zobrazenie', {
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
          hoverCursor: 'pointer',
        });
        cnv.add(cnvImg);
        this.canvases.push(cnv);
        cnv.on('mouse:down', (e) => {
          if (e.target && e.target.type === 'image') {
            if (!e.target.width || !e.target.height || !e.target.scaleX || !e.target.scaleY) return;
            this.rotated = true;
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

        // Fixes a bug caused by not rotating the image at all
        if(cnvImg && cnvImg.width !== undefined && cnvImg.height !== undefined && cnvImg.scaleX !== undefined && cnvImg.scaleY !== undefined) {
          cnvImg.set({
            scaleX: dimensions.width / cnvImg.width,
            scaleY: dimensions.width / cnvImg.width,
          });
          images[i].width = cnvImg.width * cnvImg.scaleX;
          images[i].height = cnvImg.height * cnvImg.scaleY;
        } else {
          console.error('Image dimensions not defined, rotation error may occur');
        }
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
