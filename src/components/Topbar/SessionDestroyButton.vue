<template>
  <b-nav-item v-b-modal.sessionDestroy>
    <span>Uzavrieť opravovanie</span>
    <b-modal
      id="sessionDestroy"
      title="Naozaj chcete uzavrieť opravovanie?"
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
      Ak to potvrdíš, svoje stiahnuté opravené riešenia už nebudeš vedieť meniť<br>
      <b>Pred uzavretím sa uisti, že máš stiahnuté opravené riešenia!</b>
      <template #modal-footer="{ ok, cancel }">
        <div class="float-left">
          <b-button
            class="m-1"
            variant="primary"
            @click="cancel()"
          >
            Zrušiť
          </b-button>
          <b-button
            variant="danger"
            class="m-1"
            @click="ok()"
          >
            Uzavrieť opravovanie
          </b-button>
        </div>
      </template>
    </b-modal>
  </b-nav-item>
</template>

<script lang="ts">
import { Database } from "@/Db";
import Vue from "vue";
import Component from "vue-class-component";
import DownloadAllButton from "./DownloadAllButton.vue";

@Component({ components: { DownloadAllButton } })
export default class SessionDestroyButton extends Vue {

  async destroySession() {
    const docs = await Database.getAllDocuments();
    for (const doc of docs) {
      if(doc.problem === this.$store.state.currentProblem){
        await Database.removeDocument(doc.id);
      }
    }
    this.$store.commit('unloadCurrentProblem')
    this.$router.push({path: '/'});
  }
}
</script>