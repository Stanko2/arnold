<template>
  <div class="d-inline">
    <b-button variant="danger" v-b-modal.sessionDestroy
      >Uzavrieť Opravovanie</b-button
    >
    <b-modal
      id="sessionDestroy"
      title="Naozaj uzavriet opravovanie?"
      ok-variant="danger"
      cancel-variant="primary"
      centered
      @ok="destroySession"
    >
      <p>Pri uzavretí opravovania sa zmažú nasledovné veci</p>
      <ul>
        <li>
          Riešenia a všetko čo s nimi súvisí - ak si ich chceš nechať musíš ich
          stiahnuť na svoj počítač
        </li>
        <li>Bodovacie kritéria</li>
      </ul>
      Ak to potvrdíš, svoje stiahnuté opravené riešenia už nebudeš vedieť meniť

      <template #modal-footer="{ ok, cancel }">
        <div class="float-left">
          <b-button class="m-1" variant="primary" @click="cancel()">
            Zavrieť
          </b-button>
          <download-all-button />
          <b-button variant="danger" @click="ok()" class="m-1">
            Uzavrieť opravovanie
          </b-button>
        </div>
      </template>
    </b-modal>
  </div>
</template>

<script lang="ts">
import { Database } from "@/Db";
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";
import DownloadAllButton from "./DownloadAllButton.vue";

@Component({ components: { DownloadAllButton } })
export default class SessinDestroyButton extends Vue {
  @Prop() downloading!: boolean;

  destroySession() {
    console.log("Destroy");
    Database.clearAllDocuments().then(() => {
      this.$router.push("/");
    });
  }
}
</script>