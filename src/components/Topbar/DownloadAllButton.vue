<template>
  <b-nav-item v-if="downloading">
    <b-spinner
        variant="secondary"
        label="Loading..."
        v-if="downloading"
        small
    ></b-spinner>
    Komprimujem
  </b-nav-item>
  <b-nav-item-dropdown text="Stiahnuť všetky" v-else :disabled="downloading">
    <b-dropdown-item @click="downloadAll(false)" id="downloadAll" :disabled="downloading">
      Pre stránky
    </b-dropdown-item>
    <b-dropdown-item @click="downloadAll(true)" id="downloadAllArnold" :disabled="downloading">
      Pre použitie v Arnoldovi
    </b-dropdown-item>
    <b-tooltip triggers="hover" target="downloadAll" placement="right">
      Stiahne len obodované riešenia - pripravené na nahratie na stránky
    </b-tooltip>
    <b-tooltip triggers="hover" target="downloadAllArnold" placement="right">
      Stiahne úplne všetko - pôvodné riešenia, všetky opravené riešenia,
      komentáre, aby sa to dalo ďalej editovať v Arnoldovi.
    </b-tooltip>
  </b-nav-item-dropdown>
</template>

<script lang="ts">
import {BModal} from 'bootstrap-vue';
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
  }
}
</script>
