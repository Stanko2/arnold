<template>
  <b-nav-item v-b-modal.noveRiesenie>
    <span id="addSolution">Pridať ďalšie riešenie</span>
    <b-tooltip target="addSolution" triggers="hover" placement="bottom">
      Pridať ďalšie riešenie alebo nahradiť existujúce
    </b-tooltip>
    <b-modal
      id="noveRiesenie"
      size="lg"
      title="Pridať nové riešenie"
      @ok="pridajRiesenia"
      :ok-disabled="noveRiesenia.length == 0"
    >
      <b-form-file
        accept=".pdf"
        multiple
        id="rieseniaInput"
        v-model="noveRiesenia"
        :file-name-formatter="formatNames"
      />
    </b-modal>
  </b-nav-item>
</template>

<script lang="ts">
import {Database} from '@/Db';
import {activeParser, AddDocument, Documents} from '@/Documents/DocumentManager';
import Vue from 'vue'
import Component from 'vue-class-component';

@Component
export default class AddDocumentButton extends Vue {
  noveRiesenia: File[] = [];
  formatNames(files: File[]) {
    return files.map((e) => activeParser.parse(e.name).riesitel).join(", ");
  }
  pridajRiesenia() {
    console.log("pridavam");

    const addOperations: Promise<void>[] = [];
    const baseLength = Documents.length;
    for (let i = 0; i < this.noveRiesenia.length; i++) {
      const riesenie = this.noveRiesenia[i];
      addOperations.push(
        new Promise<void>((resolve, reject) => {
          const index = i;
          riesenie.arrayBuffer().then((buffer) => {
            AddDocument(riesenie.name, buffer, baseLength + index + 1)
              .then(() => resolve())
              .catch((err) => this.$bvModal.msgBoxConfirm(`Riešenie ${riesenie.name} už existuje, chceš ho nahradiť novým?`, { okTitle: 'Áno', cancelTitle: 'Nie' }).then(val => {
                if (val) {
                  const id = activeParser.parse(riesenie.name).id
                  Database.removeDocument(id).then(() => {
                    AddDocument(riesenie.name, buffer, baseLength + index + 1)
                      .then(() => resolve())
                  })
                }
                else resolve()
              }));
          });
        })
      );
    }
    Promise.all(addOperations).then(() => {
      location.reload();
    });
  }
}
</script>
