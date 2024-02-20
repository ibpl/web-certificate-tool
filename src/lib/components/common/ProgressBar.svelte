<!--
SPDX-License-Identifier: AGPL-3.0-only
SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { progressOpen } from '$lib/stores';
	import LinearProgress from '@smui/linear-progress';
	import { fade } from 'svelte/transition';

	const progress = tweened(0, {
		duration: 3500,
		easing: cubicOut
	});

	// progressOpenChangeHandler handles progressOpen value changes.
	function progressOpenChangeHandler(progressOpen: boolean) {
		if (!progressOpen) {
			// Move progress bar to 100% on progress closing.
			progress.set(1, { duration: 100 });
		}
	}
	$: progressOpenChangeHandler($progressOpen);

	onMount(async () => {
		// Move progress bar to 70% on progress open.
		progress.set(0.7);
	});
</script>

<div class="progress-bar" out:fade|global={{ delay: 100 }}>
	<LinearProgress progress={$progress} closed={false} class="linear-progress" />
</div>

<style>
	.progress-bar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 3;
	}
</style>
