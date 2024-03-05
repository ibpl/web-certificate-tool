<!--
SPDX-License-Identifier: AGPL-3.0-only
SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>
-->

<script lang="ts">
	// Import fonts.
	import '@fontsource/roboto/300.css';
	import '@fontsource/roboto/400.css';
	import '@fontsource/roboto/500.css';
	import '@fontsource/roboto/700.css';
	import '@fontsource/roboto-mono';

	// Import components.
	import { navigating } from '$app/stores';
	import { settings, smallWindow, progressOpen } from '$lib/stores';
	import { dir, locale } from '$lib/i18n';
	import { onMount } from 'svelte';
	import ProgressBar from '$lib/components/common/ProgressBar.svelte';
	import PageLeaveDialog from '$lib/components/common/PageLeaveDialog.svelte';
	import InformationSnackbar from '$lib/components/common/InformationSnackbar.svelte';

	// handleWindowResize updates smallWindow global flag on application window resize.
	function handleWindowResize() {
		$smallWindow = window.innerWidth < 750;
	}

	// Open progress on navigation start and close on navigation finish.
	$: $progressOpen = $navigating !== null;

	// Stuff to execute on first component rendering.
	onMount(() => {
		// Adjust initial page mode to window resolution.
		handleWindowResize();
	});

	// Set ltr/rtl direction and HTML lang attribute based on current locale.
	$: {
		document.dir = $dir;
		document.documentElement.setAttribute('lang', $locale);
	}
</script>

<!-- Adjust UI layout on windows resizing. -->
<svelte:window on:resize={handleWindowResize} />

<!-- Use CSS set appropriate for auto/dark/light theme mode. CSS files specified here
	should be preloaded in app.html...
	   <link rel="preload" href="/smui.css" as="style" />
	   <link rel="preload" href="/smui-dark.css" as="style" />
	...to avoid FOUC on page load. -->
<svelte:head>
	{#if $settings.themeMode == ''}
		<link rel="stylesheet" href="/smui.css" media="(prefers-color-scheme: light)" />
		<link rel="stylesheet" href="/smui-dark.css" media="screen and (prefers-color-scheme: dark)" />
	{:else if $settings.themeMode == 'dark'}
		<link rel="stylesheet" href="/smui.css" />
		<link rel="stylesheet" href="/smui-dark.css" media="screen" />
	{:else}
		<link rel="stylesheet" href="/smui.css" />
	{/if}
</svelte:head>

<!-- #key stuff below required for UI to be re-rendered correctly on locale change. -->
{#key $locale}
	<!-- Don't display content until smallWindow is set to true or false in handleWindowResize()
	executed in onMount() to serve correct page layout from the beginning. -->
	{#if $smallWindow !== undefined}
		{#if $progressOpen}
			<ProgressBar />
		{/if}
	{/if}

	<slot />

	<!-- Modal dialog for page leaving confirmation when unsaved changes exists. -->
	<PageLeaveDialog />

	<!-- Information snackbar. -->
	<InformationSnackbar />
{/key}
