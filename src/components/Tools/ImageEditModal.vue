<template>
  <div>
    <b-modal 
      v-if="image"
      ref="modal"
      size="xl"
      centered
      :title="'Upravuješ ' + image.name"
      ok-only
    >
      <b-row>
        <b-col cols="6">
          <b-img 
            :src="image.data.img" 
            class="mw-100 mh-100" 
          />
        </b-col>
        <b-col cols="6">
          Názov
          <b-form-input v-model="image.name" />
          Scale X
          <b-form-input 
            v-model.number="image.templateOptions.scaleX" 
            type="number" 
          />
          Scale Y
          <b-form-input 
            v-model.number="image.templateOptions.scaleY" 
            type="number" 
          />
        </b-col>
      </b-row>
    </b-modal>
  </div>
</template>

<script lang="ts">
import { ITemplate } from '@/@types';
import { BModal } from 'bootstrap-vue';
import Vue from 'vue'
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

@Component
export default class ImageEditModal extends Vue {
    image: ITemplate | null = null;

    $refs!: {
        modal: BModal
    }

    show(image: ITemplate){
        this.image = image
        this.$refs.modal.show();
    }
}
</script>