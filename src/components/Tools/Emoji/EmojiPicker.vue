

<template>
  <div>
    <b-button
      id="emojiPicker"
      class="emojiInputButton"
      variant="outline-secondary"
    >
      <span style="">😀</span>
    </b-button>
    <b-popover 
      ref="popover"
      :show.sync="show"
      target="emojiPicker"
      triggers="click"
      placement="bottom"
    >
      <template #title>
        Vyber si emoji
      </template>
      <div class="emoji_picker">
        <div class="picker_container">
          <div
            v-for="category in categories"
            :key="`category_${category}`"
            class="category"
          >
            <span>{{ category }}</span>
            <div class="emojis_container">
              <button
                v-for="(emoji, index) in category_emojis(category)"
                :key="`emoji_${index}`"
                @click="handleEmojiClick($event, emoji)"
              >
                {{ emoji }}
              </button>
            </div>
          </div>
        </div>
        <div
          v-if="show_arrow"
          class="bottom_arrow"
        />
      </div>
    </b-popover>
  </div>
</template>

<script>

/**
 * Emoji Picker
 * Load emojis and  categories from the json file 'emojis-data.json'
 * Events:
 *  - 'emoji_click' event is fires when the user clicks on an emoji. The emoji is sent as event payload.
 * Props:
 * 	- 'show_arrow' boolean to show or not the arrow at the bottom of the picker. True by default.
 */

import data from './emoji-data.json';

export default {
	props:
	{
		show_arrow:
		{
			type: Boolean,
			required: false,
			default: true
		}
	},
	data() {
		return {
			show: false
		}
	},
	computed:
	{
		categories()
		{
			return Object.keys(data);
		},

		category_emojis: () => (category) =>
		{
			return Object.values(data[category]);
		}
	},
	mounted() {
		this.clickListener = (event) => {
		if (this.show) {
			let a = this.$refs.popover;
			if (!a) return;
			let pop = a.$children[0].$children[0].$el;
			if (event.target instanceof Element && !pop.contains(event.target)) {
			this.show = false;
			}
		}
		}
		document.addEventListener("click", this.clickListener);
	},
	unmounted() {
		document.removeEventListener("click", this.clickListener);
	},
	methods:
	{
		handleEmojiClick(e, emoji)
		{
			e.preventDefault();
			this.$emit('emoji_click', emoji);
		}
	}
}
</script>

<style scoped lang="scss">
.emojiInputButton {
	font-family: 'Emoji';
}

.emoji_picker
{
	position: relative;
	display: flex;
	flex-direction: column;
	width: 20rem;
	height: 20rem;
	max-width: 100%;
}

.bottom_arrow
{
	box-shadow: 0 0 5px 1px rgba(0, 0, 0, .0975);
}

.emoji_picker,
.picker_container
{
    overflow: hidden;
}

.picker_container
{
	position: relative;
	padding: 1rem;
	overflow: auto;
	z-index: 1;
    user-select: none;
}

.category
{
	display: flex;
	flex-direction: column;
	margin-bottom: 1rem;
	color: var(--bg-200);
}

.emojis_container
{
	display: flex;
	flex-wrap: wrap;
    font-family: 'Emoji';
	button {
		color: var(--bg-100);
	}
}

.category button
{
	margin: 0.5rem;
	margin-left: 0;
	background: inherit;
	border: none;
	font-size: 1.75rem;
	padding: 0;
}

.bottom_arrow
{
	position: absolute;
	left: 50%;
	bottom: 0;
	width: 0.75rem;
	height: 0.75rem;
	transform: translate(-50%, 50%) rotate(45deg);
	background: white;
}

</style>