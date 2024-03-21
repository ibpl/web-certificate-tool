<!--
SPDX-License-Identifier: AGPL-3.0-only
SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>
-->

<script lang="ts">
	import { Icon } from '@smui/common';
	import Paper, { Title, Subtitle, Content } from '@smui/paper';
	import { mdiLightbulbOnOutline } from '@mdi/js';

	// icon is icon to be displayed in hint box.
	export let icon = mdiLightbulbOnOutline;
</script>

<div class="hint-container">
	<Paper class="hint-paper" variant="outlined">
		<div class="hint-icon smui-paper.smui-paper--raised">
			<Icon tag="svg" viewBox="0 0 24 24">
				<path fill="currentColor" d={icon} />
			</Icon>
		</div>
		<div class="hint-text">
			<Title><slot name="title" /></Title>
			<Subtitle><slot name="subtitle" /></Subtitle>
			<Content><slot name="content" /></Content>
		</div>
	</Paper>
</div>

<style>
	.hint-container {
		display: flex;
		justify-content: right;
		margin-bottom: 1rem;
	}

	* :global(.hint-paper) {
		flex: 0 1 700px;
		display: flex;
		padding: 0;
	}

	.hint-icon {
		flex: 0 0 24px;
		display: flex;
		flex-direction: column;
		padding: 24px 16px;
		border-radius: var(--mdc-shape-medium, 4px) 0 0 var(--mdc-shape-medium, 4px);
	}

	.hint-text {
		flex-grow: 4;
		padding: 24px 16px;
	}
</style>
