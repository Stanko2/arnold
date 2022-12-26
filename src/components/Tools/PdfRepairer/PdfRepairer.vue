<template>
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
    </p>
    <div>
      <div
        id="manager"
        @shown="renderPages"
      >
        <div class="pages">
          <b-spinner v-if="pagesLoading" />
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
                <!-- show alert if page.isNew -->
                <b-alert
                  v-if="page.isNew"
                  variant="warning"
                  show
                >
                  Náhľad novej strany nie je podporovaný.
                </b-alert>
                <canvas
                  v-else
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
</template>

<script lang="ts">
import {Database} from "@/Db";
import {getViewedDocument} from "@/Documents/DocumentManager";
import {Component, Vue} from "vue-property-decorator";
import {getPages, PDFPage} from "@/components/Tools/PdfRepairer/PdfModifier";
import {BModal} from "bootstrap-vue";

@Component
export default class PdfRepairer_new extends Vue {
  pages: Array<PDFPage> = [];
  pagesLoading: boolean = false;

  err: string = '';
  busy: boolean = false;

  $refs!: {
    modal: BModal;
    pageCanvases: HTMLCanvasElement[];
    pages: HTMLDivElement[]
  };
  Open() {
    this.$refs.modal.show();

    this.renderPages();
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
    for (let i = 0; i < this.pages.length; i++) {
      this.renderPage(i);
    }
  }

  lastViewport: any = null;

  async renderPage(index: number) {
    if (this.pages[index].rendered) {
      return;
    }
    // render page
    // rotate page if needed. Determined by page.rotation property. 0 = no rotation, 1 = 90deg, 2 = 180deg, 3 = 270deg
    // set page.rendered to true
    const canvas = this.$refs.pageCanvases[index];
    const ctx = canvas.getContext("2d")!;

    const page = this.pages[index].page;
    if (page != null) {
      const viewport = page.getViewport({scale: .5, rotation: this.pages[index].rotation * 90});
      this.lastViewport = viewport;
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      await page.render(renderContext);

    } else {
      const viewport = this.lastViewport;
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, viewport.width, viewport.height);
    }

    this.pages[index].rendered = true;

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
    // create blank A4 page
    // insert it into this.pages at index
    // set page.rendered to false

    const page = {
      page: null,
      rotation: 0,
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
    // show popup that generation isn't supported yet

    this.$bvToast.toast("Generovanie PDF nie je zatiaľ podporované.", {
      title: "Generovanie PDF",
      variant: "warning",
      solid: true,
    });
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
