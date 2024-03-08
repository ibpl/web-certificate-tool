<!--
SPDX-License-Identifier: AGPL-3.0-only
SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>
-->

<script lang="ts">
	import { t } from '$lib/i18n';
	import Textfield from '@smui/textfield';
	import HelperText from '@smui/textfield/helper-text';
	import IconButton from '@smui/icon-button';
	import { Icon } from '@smui/common';
	import { mdiEye, mdiEyeOff } from '@mdi/js';

	export let password = '';
	export let maxLength: number | undefined = undefined;
	export let helperText: string | undefined = undefined;
	let passwordVisible = false;
</script>

<!-- /* v8 ignore next 6 */ -->
<Textfield
	bind:value={password}
	label={$t('common.password')}
	type={passwordVisible ? 'text' : 'password'}
	variant="filled"
	input$maxlength={maxLength}
	input$data-testid="input-password"
	style="width: 100%;"
	helperLine$style="width: 100%"
	withTrailingIcon={true}
>
	<svelte:fragment slot="helper">
		{#if helperText}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			<HelperText slot="helper">{@html helperText}</HelperText>
		{/if}
	</svelte:fragment>
	<svelte:fragment slot="trailingIcon">
		<!-- /* v8 ignore next 2 */ -->
		<IconButton
			title={$t('common.togglePasswordVisibility')}
			slot="trailingIcon"
			on:click={() => (passwordVisible = !passwordVisible)}
			data-testid="button-password-visibility"
		>
			<Icon tag="svg" viewBox="0 0 24 24">
				<!-- /* v8 ignore next 3 */ -->
				<path
					fill="currentColor"
					d={passwordVisible ? mdiEye : mdiEyeOff}
					data-testid="button-password-visibility-icon-path"
				/>
			</Icon>
		</IconButton>
	</svelte:fragment>
</Textfield>
