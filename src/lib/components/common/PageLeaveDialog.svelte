<!--
SPDX-License-Identifier: AGPL-3.0-only
SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>
-->

<script lang="ts">
	import { beforeNavigate, goto } from '$app/navigation';
	import { unsavedDataExists, pageLeft } from '$lib/stores';
	import { t } from '$lib/i18n';
	import type { NavigationTarget } from '@sveltejs/kit';
	import ConfirmationDialog from '$lib/components/common/ConfirmationDialog.svelte';

	// interceptedTarget is set to navigation target on internal application navigation.
	let interceptedTarget: NavigationTarget | null = null;

	// open is dialog open status.
	let open = false;

	// leavingAccepted is true if leaving was accepted in this dialog.
	let leavingAccepted = false;

	// content is dialog content.
	let content = '';

	// interceptedTargetChangeHandler handles interceptedTarget value changes.
	function interceptedTargetChangeHandler(interceptedTarget: NavigationTarget | null) {
		// open is page leaving confirmation dialog open status.
		if (interceptedTarget !== null) {
			if (!open) {
				leavingAccepted = false;
				content = $t('common.pageLeaveConfirmation');
				open = true;
			}
		} else {
			open = false;
		}
	}
	$: interceptedTargetChangeHandler(interceptedTarget);

	// beforeNavigate displays confirmation dialog before leaving page if
	// unsaved changes are present.
	beforeNavigate(({ to, cancel }) => {
		// Don't display page leaving confirmation dialog if no
		// unsaved data exists.
		if (!$unsavedDataExists) {
			pageLeft.set(true);
			return;
		}

		if (leavingAccepted) {
			// Don't block leavning if leaving was accepted.
			return;
		}

		// Confirmation dialog will be opened here so set pageLeft store
		// to undefined for api call keeper to wait for decision (to
		// continue processing when user decides to stay or abort
		// processing when user decides to leave).
		pageLeft.set(undefined);

		// This cancels internal navigation or displays browser page leaving dialog
		// when page is about to be unloaded.
		cancel();

		// If `to` has a value, we're navigating internally and
		// should display our own dialog. Otherwise, we're in
		// beforeunload, which means the user will already
		// see a system dialog and doesn't need ours too.
		if (to) {
			// We're navigating so remember target and open our
			// confirmation dialog.
			interceptedTarget = to;
		} else {
			if (!open) {
				// Browser dialog was displayed and user choose not to leave the page
				// and no application leave page dialog is displayed so save answer.
				pageLeft.set(false);
			}
		}
	});
</script>

<!-- Page leave confirmation dialog. -->
<ConfirmationDialog
	{open}
	title={$t('common.confirmPageLeaving')}
	{content}
	on:refuse={() => {
		pageLeft.set(false);
		// Just close dialog after leaving was refused.
		interceptedTarget = null;
	}}
	on:confirm={async () => {
		// Leaving page was accepted.
		pageLeft.set(true);

		// Reset unsaved data existence status if such data exists
		// and do actual navigation and close dialog.
		if (interceptedTarget) {
			let targetUrl = interceptedTarget.url;
			interceptedTarget = null;
			if ($unsavedDataExists) {
				$unsavedDataExists = false;
			}
			leavingAccepted = true;
			await goto(targetUrl);
			leavingAccepted = false;
		}
	}}
/>
