

<template>
  <div>
    <b-button
      id="emojiPicker"
      class="emojiInputButton"
      variant="outline-secondary"
    >
      <span
        class="d-block"
        style="transform: scale(2);"
      >😀</span>
    </b-button>
    <b-tooltip
      triggers="hover"
      target="emojiPicker"
    >
      Emoji
    </b-tooltip>
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
	width: 100%;
	height: 100%;
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
	&::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-radius: 20px;
	}
}

.category
{
	display: flex;
	flex-direction: column;
	color: var(--bg-200);
	font-size: 1.02rem;
}

.emojis_container
{
	display: flex;
	flex-wrap: wrap;
    font-family: 'Emoji';
	justify-content: center;
	button {
		color: var(--bg-100);
		margin-left: 0;
		background: inherit;
		border: none;
		font-size: 2.25rem;
		padding: 0;
		transition: 100ms;
		&:hover {
			color: var(--primary);
		}
	}
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