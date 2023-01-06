<template>
  <div>
    <b-modal
      ref="modal"
      size="xl"
      title="Upraviť strany"
      scrollable
      no-close-on-backdrop
    >
      <p>
        Nie je miesto na komentár, alebo je strana divne otočená? Tu to vieš vyriešiť.
        <br>
        <i>Toto rozhranie môže byť občas pomalé. Ak sa zasekne, zatvorte ho a skúste to znova.</i>
      </p>
      <div>
        <div
          id="manager"
          @shown="renderPages"
        >
          <div class="pages">
            <b-spinner v-if="pagesLoading" />
            <div :class="`pages ${pagesLoading ? 'd-none' : ''}`">
              <div
                v-for="(page, index) in pages"
                :key="index"
                class="page-container"
              >
                <div
                  class="add-page"
                  @click="insertPage(index)"
                >
                  <span class="material-icons">
                    add
                  </span>
                </div>
                <b-card class="m-2 card">
                  <div ref="images">
                    <canvas
                      ref="pageCanvases"
                      class="page"
                      @shown="renderPage(index)"
                    />
                    <div class="tools">
                      <div
                        @click="removePage(index)"
                      >
                        <span class="material-icons">
                          delete
                        </span>
                      </div>
                      <div
                        :class="page.isNew ? 'disabled' : ''"
                        @click="rotatePage(index, 1)"
                      >
                        <span class="material-icons">
                          rotate_90_degrees_cw
                        </span>
                      </div>
                      <div
                        :class="page.isNew ? 'disabled' : ''"
                        @click="rotatePage(index, -1)"
                      >
                        <span class="material-icons">
                          rotate_90_degrees_ccw
                        </span>
                      </div>
                    </div>
                  </div>
                </b-card>
              </div>
              <div
                class="add-page"
                style="height: unset;"
                @click="insertPage(pages.length)"
              >
                <span class="material-icons">
                  add
                </span>
              </div>
            </div>
          </div>
        </div>

        <b-alert
          variant="warning"
          show
        >
          <b>Upozornenie:</b> Táto funkcia je v beta verzii. V prípade problémov s ňou prosím použite <i
            style="cursor: pointer;"
            @click="openOld"
          ><u>starú verziu</u></i>.
        </b-alert>
      </div>

      <template #modal-footer="{ cancel }">
        <b-button
          size="md"
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
    <PDFRepairer_old ref="old" />
  </div>
</template>

<script lang="ts">
import {Database} from "@/Db";
import {getViewedDocument} from "@/Documents/DocumentManager";
import {Component, Vue} from "vue-property-decorator";
import {generate, getPages, PDFPage} from "@/components/Tools/PdfRepairer/PdfModifier";
import {BModal} from "bootstrap-vue";
import PDFRepairer_old from "@/components/Tools/PdfRepairer/PdfRepairer_old.vue";

@Component({
  components: {
    BModal,
    PDFRepairer_old
  }
})
export default class PdfRepairer_new extends Vue {
  pages: Array<PDFPage> = [];
  pagesLoading: boolean = true;

  err: string = '';
  busy: boolean = false;

  $refs!: {
    modal: BModal;
    pageCanvases: HTMLCanvasElement[];
    pages: HTMLDivElement[];
    old: PDFRepairer_old;
  };
  Open() {
    this.eventHub.$emit('document:save', () => {
      this.renderPages();
    });
    this.$refs.modal.show();
  }

  openOld() {
    this.$refs.modal.hide();
    this.$refs.old.Open();
  }

  async renderPages() {
    const id = getViewedDocument()?.id;
    if (id) {
      const doc = await Database.getDocument(id);
      this.pages = await getPages(doc.pdfData);
      console.log(this.pages);
    }
  }

  updated() {
    this.$nextTick(() => {
      for (let i = 0; i < this.pages.length; i++) {
        this.renderPage(i);
      }
      this.pagesLoading = false;
    });
  }

  // A4 page
  newPageViewport = {
    width: 306,
    height: 396
  };

  async renderPage(index: number) {
    if (this.pages[index].rendered) {
      return;
    }

    try {
      const canvas = this.$refs.pageCanvases[index];
      const ctx = canvas.getContext("2d")!;

      const page = this.pages[index].page;
      if (page != null) {
        const viewport = page.getViewport({scale: .5, rotation: this.pages[index].rotation * 90});
        console.log(viewport);
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        await page.render(renderContext);

      } else {
        const viewport = this.newPageViewport;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, viewport.width, viewport.height);
      }

      this.pages[index].rendered = true;
    } catch (e) {
      console.warn("Failed to render page", index);
    }
  }

  removePage(index: number) {
    this.pages.splice(index, 1);

    this.rerenderAll();
  }

  rotatePage(index: number, direction: number) {
    this.pages[index].rotation = (this.pages[index].rotation + direction) % 4;
    this.pages[index].rendered = false;

    this.rerenderAll();
  }

  insertPage(index: number) {
    const page = {
      page: null,
      rotation: 0,
      originalRotation: 0,
      isNew: true,
      rendered: false,
      id: -1,
    };

    this.pages.splice(index, 0, page);

    this.pages.forEach((page, index) => {
      page.rendered = false;
    });

    this.rerenderAll();
  }

  rerenderAll() {
    this.pages.forEach((page, index) => {
      page.rendered = false;
    });

    this.$forceUpdate();
  }

  generate() {
    this.$bvToast.toast("Začínam generovať...", {
      title: "Generovanie",
      variant: "info",
      solid: true,
      autoHideDelay: 2000,
    });

    this.busy = true;

    setTimeout(() => {

      const doc = getViewedDocument();

      if(!doc) {
        this.$bvToast.toast("Nepodarilo sa nájsť otvorený dokument", {
          title: "Generovanie",
          variant: "danger",
          solid: true,
        });
        this.busy = false;
        return;
      }

      generate(doc, this.pages).then(() => {
        this.$bvToast.toast("Dokument bol úspešne vygenerovaný", {
          title: "Generovanie",
          variant: "success",
          solid: true,
        });
        this.busy = false;
        this.$refs.modal.hide();
      }).catch((err) => {
        this.$bvToast.toast("Nastala chyba pri generovaní dokumentu", {
          title: "Generovanie",
          variant: "danger",
          solid: true,
        });
        this.busy = false;
        console.error(err);
      });
    }, 0);
  }
}
</script>

<style scoped lang="scss">
  .pages, .page-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    flex-direction: row;
  }

  .page {
    width: 100%;
    height: 100%;
    border: 1px solid black;
    position: relative;
  }

  .card {
    width: 20rem;
  }

  .add-page {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    flex-direction: column;
  }

  .tools {
    background-color: rgba(0, 0, 0, 0.5);
    height: 2.7rem;
    position: absolute;
    display: flex;
    justify-content: space-evenly;
    width: 100%;
    bottom: 0;
    left: 0;
    padding: 0.5rem;
  }

  .disabled {
    color: grey;
    pointer-events: none;
  }

  .material-icons {
    cursor: pointer;
  }
</style>
