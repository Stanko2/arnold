<template>
  <b-modal
    ref="modal"
    ok-only
  >
    <p>
      Skratku vieš nastaviť tak, že do textového poľa napíšeš patričné klávesy,
      ktoré chceš stláčať. Viacero kláves naraz vieš oddeľovať pomocou "+" (ctrl+b).
      Tabuľka mapovania je tu:
    </p>
    <table class="table">
      <thead>
        <tr>
          <th>Kláves</th>
          <th>Meno</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Delete</td>
          <td>del</td>
        </tr>
        <tr>
          <td>Backspace</td>
          <td>backspace</td>
        </tr>
        <tr>
          <td>Shift</td>
          <td>shift</td>
        </tr>
        <tr>
          <td>Control</td>
          <td>ctrl</td>
        </tr>
        <tr>
          <td>Alt</td>
          <td>alt</td>
        </tr>
        <tr>
          <td>Alt Graph (AltGr)</td>
          <td>altgraph</td>
        </tr>
        <tr>
          <td>Windows kláves alebo Mac Cmd</td>
          <td>meta</td>
        </tr>
        <tr>
          <td>Šípka hore</td>
          <td>arrowup</td>
        </tr>
        <tr>
          <td>Šípka dole</td>
          <td>arrowdown</td>
        </tr>
        <tr>
          <td>Šípka doľava</td>
          <td>arrowleft</td>
        </tr>
        <tr>
          <td>Šípka doprava</td>
          <td>arrowright</td>
        </tr>
        <tr>
          <td>Enter</td>
          <td>enter</td>
        </tr>
        <tr>
          <td>Escape</td>
          <td>esc</td>
        </tr>
        <tr>
          <td>Tabulátor</td>
          <td>tab</td>
        </tr>
        <tr>
          <td>Medzerník</td>
          <td>space</td>
        </tr>
        <tr>
          <td>Page Up</td>
          <td>pageup</td>
        </tr>
        <tr>
          <td>Page Down</td>
          <td>pagedown</td>
        </tr>
        <tr>
          <td>Home</td>
          <td>home</td>
        </tr>
        <tr>
          <td>End</td>
          <td>end</td>
        </tr>
        <tr>
          <td>A - Z</td>
          <td>a-z</td>
        </tr>
        <tr>
          <td>0-9</td>
          <td>0-9</td>
        </tr>
        <tr>
          <td>F1-F12</td>
          <td>f1-f12</td>
        </tr>
        <tr>
          <td>+</td>
          <td>plus</td>
        </tr>
      </tbody>
    </table>
  </b-modal>
</template>

<script lang="ts">
import {BModal} from "bootstrap-vue";
import Vue from "vue";
import Component from "vue-class-component";

@Component
export default class ShortcutHelpModal extends Vue {
  $refs!: {
    modal: BModal;
  }
 show() {
      (this.$refs.modal as any).show();
    }
}
</script>
