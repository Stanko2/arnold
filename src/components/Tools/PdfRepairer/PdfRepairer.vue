<template>
  <b-modal ref="modal" size="lg" title="Opravit pokazene PDFko" scrollable>
    <p>Nie je miesto na Komentar, alebo pdfko je divne otocene? Tu to vies vyriesit.
      Rotovanie je ale dostupne len pri rieseniach, kde su len obrazky. Taktiez tu vies z obrazkovych rieseni odstranit biele okraje :)</p>
    <div v-if="ImageSources">
      <b-button v-b-toggle.rotate-collapse variant="primary" block>Rotovat strany</b-button>
      <b-collapse id="rotate-collapse" @show="renderRotateUI">
        <b-alert show variant="warning">
          <p>Otacaj, len ak riesenie obsahuje iba fotky!</p>
          <p>Inak prides o vsetok text, ktoey tam bol</p>
        </b-alert>
        <b-card v-for="image in ImageSources" :key="image.id">
            <div class="canvas-wrapper" ref="images">
              <canvas ref="pageCanvases" class="image"></canvas>
            </div>
        </b-card>
      </b-collapse>
    </div>
    <div v-if="err">
        <b-alert show variant="danger">
            {{ err }}
        </b-alert>
    </div>
    <b-button v-b-toggle.new-page variant="primary" block>Nova Strana</b-button>
    <b-collapse id="new-page">
      <b-card>
        <b-row class="p-2">
          <b-col>Pridat Novu Stranu na koniec</b-col>
          <b-col ><b-form-checkbox class="float-right" switch v-model="newPage"/></b-col>
        </b-row>
      </b-card>
    </b-collapse>
    <b-button @click="generate()" block :disabled="ImageSources.length == 0 && !newPage">Generate</b-button>
  </b-modal>
</template>

<script lang="ts">
import { Database } from "@/Db";
import { getViewedDocument } from "@/DocumentManager";
import { BCard, BModal } from "bootstrap-vue";
import { fabric } from "fabric";
import Vue from "vue";
import Component from "vue-class-component";
import { AddTrailingPage, ExtractImages, GeneratePDF, PDFImage } from "./PdfModifier";

@Component
export default class PDFRepairer extends Vue {
  ImageSources: PDFImage[] = [];
  canvases: fabric.Canvas[] = [];
  newPage: boolean = false;
  err: string = '';
  rotating: boolean = false;

  $refs!: {
    modal: BModal;
    pageCanvases: HTMLCanvasElement[];
    images: HTMLElement[]
  };
  Open() {
    this.$refs.modal.show();
    const id = getViewedDocument()?.id;
    if (id) {
      Database.getDocument(id).then((doc) => {
        ExtractImages(doc.initialPdf).then((images) => {
          this.ImageSources = images;
          this.$nextTick().then(() => {
            this.renderRotateUI();
          })
        }).catch(err=>{
            this.err = err;
            this.ImageSources = [];
        });
      });
    }
  }
  generate() {
    const doc = getViewedDocument()?.id;
    if(!doc) return;
    this.$bvModal.msgBoxConfirm('Ak upravis toto PDFko, tak stratis v nom vsetky zmeny', {
      title: 'Upravit PDFko?',
    }).then((val)=>{
      if(!val) return;
      if(this.ImageSources.length > 0) {
        GeneratePDF(this.ImageSources, this.newPage, doc).then(()=> setTimeout(() => {
          location.reload()
        }, 50))
      }
      else {
        AddTrailingPage(doc).then(()=> location.reload())
      }
    })
  }
  renderRotateUI() {
    const images = this.ImageSources;
    this.rotating = false;
    this.$refs.pageCanvases.forEach((e, i) => {
      const img = new Image();
      img.src = images[i].url;
      const aspect = images[i].width / images[i].height;

      img.onload = () => {
        const cnvImg = new fabric.Image(img, {
          top: img.height / 2,
          left: img.width / 2,
          originX: 'center',
          originY: 'center',
          angle: 360
            // hasControls: false,
            // lockMovementX: true,
            // lockMovementY: true,
        });
        const cnv = new fabric.Canvas(e, {
          backgroundImage: cnvImg,
        })
        this.canvases.push(cnv);
        let rotation = 0;
        const width = this.$refs.images[i].clientWidth;
        cnv.on('mouse:down', (e) => {
          if(cnvImg.angle)
          cnvImg.angle += 90;
          this.rotating = true;
          this.ImageSources[i].rotation++;
          cnv.backgroundImage = cnvImg;
          rotation++;
          if(rotation %2 == 1){
            cnvImg.left = img.height / 2;
            cnvImg.top = img.width / 2;
            cnv.setDimensions({
              width: width,
              height: width * aspect,
            })
            cnv.setZoom(width / img.height)
          }
          else {
            cnvImg.top = img.height / 2;
            cnvImg.left = img.width / 2;
            cnv.setDimensions({
            width: width,
            height: width / aspect,
            })
            cnv.setZoom(width / img.width)  
          }
          cnv.renderAll();
          this.$refs.images[i].style.height = cnv.getHeight() + "px";
        })
        setTimeout(() => {
          const width = this.$refs.images[i].clientWidth;
          console.log(width);
          cnv.setDimensions({
            width: width,
            height: width / aspect,
          })
          cnv.setZoom(width / img.width)
          this.$refs.images[i].style.height = cnv.getHeight() + "px";
        }, 30);
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
}
.canvas-wrapper {
  width: 100%;
  height: 100%;
}
</style>