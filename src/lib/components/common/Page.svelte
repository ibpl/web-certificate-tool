<!--
SPDX-License-Identifier: AGPL-3.0-only
SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>
-->

<script lang="ts">
	import { t, locale, locales } from '$lib/i18n';
	import Button, { Icon, Label } from '@smui/button';
	import Menu from '@smui/menu';
	import List, { Item, Text } from '@smui/list';
	import { settings } from '$lib/stores';
	import {
		mdiWhiteBalanceSunny,
		mdiWeatherNight,
		mdiThemeLightDark,
		mdiMenuDown,
		mdiWeb
	} from '@mdi/js';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	// title is string displayed in bar.
	export let title = '';

	// contentEnabled allows disabling access to all controls on page content when set to false.
	export let contentEnabled = true;

	// themeModes contains all avalable theme mode selections.
	const themeModes = [
		{ id: 1, name: 'common.themeModeLight', icon: mdiWhiteBalanceSunny, themeMode: 'light' },
		{
			id: 2,
			name: 'common.themeModeSystem',
			icon: mdiThemeLightDark,
			themeMode: ''
		},
		{ id: 3, name: 'common.themeModeDark', icon: mdiWeatherNight, themeMode: 'dark' }
	];

	// selectedThemeMode is selected theme mode (system by default).
	let selectedThemeMode = themeModes[1];
	if ($settings.themeMode === 'light') {
		selectedThemeMode = themeModes[0];
	}
	if ($settings.themeMode === 'dark') {
		selectedThemeMode = themeModes[2];
	}

	// Update settings store on settings change in UI.
	$: {
		if ($settings.themeMode != selectedThemeMode.themeMode || $settings.locale != $locale) {
			$settings.themeMode = selectedThemeMode.themeMode;
			$settings.locale = $locale;
		}
	}

	let menuLanguage: Menu; // menuLanguage is menu with available UI languages.
	let menuThemeMode: Menu; // menuThemeMode is menu with avalilable UI theme modes.
</script>

<svelte:head>
	<!-- /* v8 ignore next */ -->
	<title>{title ? title + ' • ' : ''}{$t('common.webCertificateTool')}</title>
</svelte:head>

<!-- Greyout page content if disabled. -->
<!-- /* v8 ignore next */ -->
<div class="page-content{contentEnabled ? '' : ' disabled'}" style="padding: 0rem 1rem 2rem 1rem;">
	<div
		style="display: flex; justify-content: flex-end; align-items: baseline; flex-wrap: wrap-reverse;"
	>
		<!-- Page title to be displayed on the left in the top bar row. -->
		<div style="flex-grow: 1;">
			<!-- /* v8 ignore next */ -->
			<h6 data-testid="page-title">{title ? title : $t('common.webCertificateTool')}</h6>
		</div>
		<!-- Menu buttons to be displayed on the right in the top bar row. Wraps as the first on small screens. -->
		<div style="display: flex; justify-content: flex-end; align-items: baseline; margin-top: 1rem;">
			<!-- Language change button and menu. -->
			<div class="menu-button">
				<Button
					data-testid="button-language"
					title={$t('common.changeLanguage')}
					on:click={() => menuLanguage.setOpen(true)}
					variant="outlined"
					style="padding: 0; min-width: 70px;"
				>
					<Icon tag="svg" style="width: 1em; height: auto; margin: 0 5px;" viewBox="0 0 24 24">
						<path fill="currentColor" d={mdiWeb} />
					</Icon>
					<Label>{$locale}</Label>
					<Icon tag="svg" style="width: 1em; height: auto; margin: 0;" viewBox="0 0 24 24">
						<path fill="currentColor" d={mdiMenuDown} />
					</Icon>
				</Button>
				<Menu bind:this={menuLanguage} anchorCorner="BOTTOM_START">
					<List>
						{#each $locales as l}
							<Item
								data-testid="menu-language-{l}"
								on:SMUI:action={async () => {
									// Change locale.
									$locale = l;

									// Set locale as l URL query parameter after user changes it manually.
									// Don't execute in during unit tests as goto is not available there.
									if (browser) {
										const urlSearchParams = new URLSearchParams(window.location.search);
										urlSearchParams.set('l', l);
										await goto('/?' + urlSearchParams.toString(), {
											replaceState: true,
											invalidateAll: false
										});
									}
								}}
							>
								<!-- /* v8 ignore next */ -->
								<Text>{$t(`lang.${l}`)}</Text>
							</Item>
						{/each}
					</List>
				</Menu>
			</div>
			<!-- Theme mode change button and menu. -->
			<div class="menu-button">
				<Button
					data-testid="button-theme-mode"
					title={$t('common.changeThemeMode')}
					on:click={() => menuThemeMode.setOpen(true)}
					variant="outlined"
					style="padding: 0; min-width: 60px;"
				>
					<Icon tag="svg" style="width: 1em; height: auto; margin: 0;" viewBox="0 0 24 24">
						<path
							data-testid="button-theme-mode-icon-path"
							fill="currentColor"
							d={selectedThemeMode.icon}
						/>
					</Icon>
					<Icon tag="svg" style="width: 1em; height: auto; margin: 0;" viewBox="0 0 24 24">
						<path fill="currentColor" d={mdiMenuDown} />
					</Icon>
				</Button>
				<Menu bind:this={menuThemeMode} anchorCorner="BOTTOM_START">
					<List>
						{#each themeModes as themeMode}
							<Item
								data-testid="menu-theme-mode-{themeMode.id}"
								on:SMUI:action={async () => {
									// Change theme mode.
									selectedThemeMode = themeMode;

									// Set theme mode as URL query parameter after user changes it manually.
									// Don't execute in during unit tests as goto is not available there.
									if (browser) {
										const urlSearchParams = new URLSearchParams(window.location.search);
										switch (themeMode.id) {
											case 1:
												urlSearchParams.set('tm', 'light');
												break;
											case 3:
												urlSearchParams.set('tm', 'dark');
												break;
											default:
												urlSearchParams.delete('tm');
												break;
										}
										await goto('/?' + urlSearchParams.toString(), {
											replaceState: true,
											invalidateAll: false
										});
									}
								}}
							>
								<Icon
									tag="svg"
									style="width: 1em; height: auto; margin: 0px 5px 0px 0px"
									viewBox="0 0 24 24"
								>
									<path fill="currentColor" d={themeMode.icon} />
								</Icon>
								<Text>{$t(themeMode.name)}</Text>
							</Item>
						{/each}
					</List>
				</Menu>
			</div>
		</div>
	</div>
	<div>
		<!--  Page main content. -->
		<slot />
	</div>

	<!-- Footer -->
	<div class="mdc-theme--secondary" style="text-align: right">
		<small
			><!-- eslint-disable-line svelte/no-at-html-tags -->{@html $t('common.licenseInfo', {
				url: 'https://github.com/ibpl/web-certificate-tool'
			})}</small
		>
	</div>
</div>

{#if !contentEnabled}
	<!-- When rendered, blocks input on whole screen.  -->
	<div class="input-blocker" />
{/if}

<style>
	.page-content {
		overflow: auto;
		height: 100%;
		opacity: 1;
		transition: opacity 0.2s;
	}
	.menu-button {
		margin: 0px 0px 0px 5px;
	}
	.disabled {
		opacity: 0.5;
		transition: opacity 0.2s;
	}
	.input-blocker {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		padding: 0;
		margin: 0;
		opacity: 1;
	}
</style>
