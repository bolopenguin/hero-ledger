<script lang="ts">
	// Pick the class's skill proficiencies here; the Sheet tab shows the same choice.
	import { currentChar } from '$lib/current.svelte';
	import { getClass, scores, skills } from '$lib/calc';
	import { SKILLS } from '$lib/data/srd';

	const ch = $derived(currentChar());
	const cls = $derived(getClass(ch));
	const sk = $derived(skills(ch, scores(ch)));
	const ids = $derived(
		Object.keys(SKILLS).filter((id) => cls?.skills.list === 'any' || cls?.skills.list.includes(id))
	);
	const picked = $derived(
		ids.filter((id) => (ch.skills[id] ?? 0) >= 1 && !sk[id].fromBg && !sk[id].fromFeature).length
	);
	const need = $derived(cls?.skills.n ?? 0);

	function toggle(id: string) {
		ch.skills[id] = (ch.skills[id] ?? 0) >= 1 ? 0 : 1;
	}
</script>

{#if cls && need}
	<div id="class-skills" class="panel mt-3 scroll-mt-28">
		<div class="flex flex-wrap items-baseline gap-x-3">
			<span class="label-xs">{cls.name} skills</span>
			<span
				class="text-xs font-semibold {picked === need
					? 'text-success'
					: picked > need
						? 'text-warning'
						: 'text-base-content/70'}">Choose {need}: {picked}/{need}</span
			>
		</div>
		<div class="mt-1.5 flex flex-wrap gap-1.5">
			{#each ids as id (id)}
				{@const auto = sk[id].fromBg || sk[id].fromFeature}
				<button
					type="button"
					class="btn btn-xs {auto || (ch.skills[id] ?? 0) >= 1 ? 'btn-primary' : 'btn-outline'}"
					disabled={!!auto}
					title={auto ? 'Already proficient from your background or a feature' : undefined}
					onclick={() => toggle(id)}>{SKILLS[id].name}</button
				>
			{/each}
		</div>
	</div>
{/if}
