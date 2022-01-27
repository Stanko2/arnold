<template>
  <div class="d-inline">
    <b-button
      variant="success"
      :disabled="downloading"
      v-b-modal.downloadAllModal
    >
      <div v-if="downloading">
        <b-spinner
          variant="secondary"
          label="loading..."
          v-if="downloading"
          small
        ></b-spinner>
        Komprimujem
      </div>
      <div v-else>Download all</div>
    </b-button>
    <b-modal
      id="downloadAllModal"
      hide-footer
      ref="modal"
      title="Vyber si formát riešení"
    >
      <b-button id="downloadAll" @click="downloadAll(false)" block
        >Stiahnuť pre stránky</b-button
      >
      <b-button id="downloadAllArnold" @click="downloadAll(true)" block
        >Stiahnuť pre opätovné použitie v Arnoldovi</b-button
      >
      <b-tooltip triggers="hover" target="downloadAll" placement="bottom"
        >Stiahne len obodované riešenia - pripravené na upload na
        stránky</b-tooltip
      >
      <b-tooltip triggers="hover" target="downloadAllArnold" placement="bottom"
        >Stiahne úplne všetko - pôvodné riešenia, všetky opravené riešenia,
        komentáre, aby sa to dalo ďalej editovať v Arnoldovi.</b-tooltip
      >
    </b-modal>
  </div>
</template>

<script lang="ts">
import { BModal } from 'bootstrap-vue';
import Vue from 'vue'
import Component from 'vue-class-component';

@Component
export default class DownloadAllButton extends Vue {
  downloading = false;
  $refs!: {
    modal: BModal;
  }

  mounted() {
    this.eventHub.$on("download:done", () => (this.downloading = false));
    this.eventHub.$on("editor:downloadZip", () => (this.downloading = true));
  }

  downloadAll(forArnold: boolean) {
    console.log(forArnold);
    this.eventHub.$emit('editor:downloadZip', forArnold);
    this.$refs.modal.hide();
  }
}
</script>