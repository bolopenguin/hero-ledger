// Equipment catalog (D&D 2024 rules, SRD 5.2, CC BY 4.0). Costs in GP, weights in lb.
// Descriptions are short summaries written for this app.
import { ARMOR, WEAPONS } from './srd';

export type GearCat =
	| 'weapon'
	| 'armor'
	| 'artisan'
	| 'tool'
	| 'instrument'
	| 'gaming'
	| 'gear'
	| 'ammo'
	| 'focus'
	| 'pack'
	| 'mount'
	| 'tack'
	| 'vehicle';

export interface GearDef {
	name: string;
	cat: GearCat;
	cost: number;
	weight: number;
	d?: string;
	/** Equipment packs: what they contain, as [item name, quantity]. */
	contents?: [string, number][];
	/** Items normally bought in bundles (e.g. 20 arrows). */
	qty?: number;
}

export const GEAR_CAT_LABEL: Record<GearCat, string> = {
	weapon: 'Weapons',
	armor: 'Armor',
	artisan: "Artisan's Tools",
	tool: 'Other tools',
	instrument: 'Musical Instruments',
	gaming: 'Gaming Sets',
	gear: 'Adventuring Gear',
	ammo: 'Ammunition',
	focus: 'Spellcasting Focuses',
	pack: 'Equipment Packs',
	mount: 'Mounts',
	tack: 'Tack and Harness',
	vehicle: 'Vehicles'
};

const tool = (name: string, cat: GearCat, cost: number, weight: number, d: string): GearDef => ({
	name,
	cat,
	cost,
	weight,
	d
});

const TOOLS: GearDef[] = [
	tool(
		"Alchemist's Supplies",
		'artisan',
		50,
		8,
		"Int. Identify a substance (DC 15) or start a fire (DC 15). Craft: Acid, Alchemist's Fire, Component Pouch, Oil, Paper, Perfume."
	),
	tool(
		"Brewer's Supplies",
		'artisan',
		20,
		9,
		'Int. Detect a poisoned drink (DC 15) or identify alcohol (DC 10). Craft: Antitoxin.'
	),
	tool(
		"Calligrapher's Supplies",
		'artisan',
		10,
		5,
		'Dex. Write with flourishes that guard against forgery (DC 15). Craft: Ink, Spell Scroll.'
	),
	tool(
		"Carpenter's Tools",
		'artisan',
		8,
		6,
		'Str. Seal or pry open a door or container (DC 20). Craft: Club, Greatclub, Quarterstaff, Barrel, Chest, Ladder, Pole, Portable Ram, Torch.'
	),
	tool(
		"Cartographer's Tools",
		'artisan',
		15,
		6,
		'Wis. Draft a map of a small area (DC 15). Craft: Map.'
	),
	tool(
		"Cobbler's Tools",
		'artisan',
		5,
		5,
		"Dex. Modify footwear for advantage on the wearer's next Acrobatics check (DC 10). Craft: Climber's Kit."
	),
	tool(
		"Cook's Utensils",
		'artisan',
		1,
		8,
		'Wis. Improve food (DC 10) or detect spoiled or poisoned food (DC 15). Craft: Rations.'
	),
	tool(
		"Glassblower's Tools",
		'artisan',
		30,
		5,
		'Int. Discern what a glass object held in the last 24 hours (DC 15). Craft: Glass Bottle, Magnifying Glass, Spyglass, Vial.'
	),
	tool(
		"Jeweler's Tools",
		'artisan',
		25,
		2,
		"Int. Discern a gem's value (DC 15). Craft: Arcane Focus, Holy Symbol."
	),
	tool(
		"Leatherworker's Tools",
		'artisan',
		5,
		5,
		'Dex. Add a design to a leather item (DC 10). Craft: Sling, Whip, Hide, Leather and Studded Leather Armor, Backpack, cases, Parchment, Pouch, Quiver, Waterskin.'
	),
	tool(
		"Mason's Tools",
		'artisan',
		10,
		8,
		'Str. Chisel a symbol or hole in stone (DC 10). Craft: Block and Tackle.'
	),
	tool(
		"Painter's Supplies",
		'artisan',
		10,
		5,
		"Wis. Paint a recognizable image of something you've seen (DC 10). Craft: Druidic Focus, Holy Symbol."
	),
	tool(
		"Potter's Tools",
		'artisan',
		10,
		3,
		'Int. Discern what a ceramic object held in the last 24 hours (DC 15). Craft: Jug, Lamp.'
	),
	tool(
		"Smith's Tools",
		'artisan',
		20,
		8,
		'Str. Pry open a door or container (DC 20). Craft: most melee weapons, Medium (not Hide) and Heavy armor, Ball Bearings, Bucket, Caltrops, Chain, Crowbar, bullets, Grappling Hook, Iron Pot, Iron Spikes.'
	),
	tool(
		"Tinker's Tools",
		'artisan',
		50,
		10,
		'Dex. Assemble a Tiny scrap item that falls apart in 1 minute (DC 20). Craft: Musket, Pistol, Bell, lanterns, Flask, Hunting Trap, Lock, Manacles, Mirror, Shovel, Signal Whistle, Tinderbox.'
	),
	tool(
		"Weaver's Tools",
		'artisan',
		1,
		5,
		'Dex. Mend clothing or sew a Tiny design (DC 10). Craft: Padded Armor, Basket, Bedroll, Blanket, clothes, Net, Robe, Rope, Sack, String, Tent.'
	),
	tool(
		"Woodcarver's Tools",
		'artisan',
		1,
		5,
		'Dex. Carve a pattern in wood (DC 10). Craft: Club, Greatclub, Quarterstaff, most Ranged weapons, Arcane Focus, Arrows, Bolts, Druidic Focus, Ink Pen, Needles.'
	),
	tool('Disguise Kit', 'tool', 25, 3, 'Cha. Apply makeup (DC 10). Craft: Costume.'),
	tool(
		'Forgery Kit',
		'tool',
		15,
		5,
		"Dex. Mimic up to 10 words of someone's handwriting (DC 15) or duplicate a wax seal (DC 20)."
	),
	tool(
		'Herbalism Kit',
		'tool',
		5,
		3,
		"Int. Identify a plant (DC 10). Craft: Antitoxin, Candle, Healer's Kit, Potion of Healing."
	),
	tool(
		"Navigator's Tools",
		'tool',
		25,
		2,
		'Wis. Plot a course (DC 10) or find your position by the stars (DC 15).'
	),
	tool(
		"Poisoner's Kit",
		'tool',
		50,
		2,
		'Int. Detect a poisoned object (DC 10). Craft: Basic Poison.'
	),
	tool("Thieves' Tools", 'tool', 25, 1, 'Dex. Pick a lock (DC 15) or disarm a trap (DC 15).'),
	tool('Dice Set', 'gaming', 0.1, 0, 'Wis. Spot cheating (DC 10) or win the game (DC 20).'),
	tool('Dragonchess Set', 'gaming', 1, 0, 'Wis. Spot cheating (DC 10) or win the game (DC 20).'),
	tool('Playing Card Set', 'gaming', 0.5, 0, 'Wis. Spot cheating (DC 10) or win the game (DC 20).'),
	tool(
		'Three-Dragon Ante Set',
		'gaming',
		1,
		0,
		'Wis. Spot cheating (DC 10) or win the game (DC 20).'
	),
	tool(
		'Bagpipes',
		'instrument',
		30,
		6,
		'Cha. Play a known tune (DC 10) or improvise a song (DC 15).'
	),
	tool('Drum', 'instrument', 6, 3, 'Cha. Play a known tune (DC 10) or improvise a song (DC 15).'),
	tool(
		'Dulcimer',
		'instrument',
		25,
		10,
		'Cha. Play a known tune (DC 10) or improvise a song (DC 15).'
	),
	tool('Flute', 'instrument', 2, 1, 'Cha. Play a known tune (DC 10) or improvise a song (DC 15).'),
	tool('Horn', 'instrument', 3, 2, 'Cha. Play a known tune (DC 10) or improvise a song (DC 15).'),
	tool('Lute', 'instrument', 35, 2, 'Cha. Play a known tune (DC 10) or improvise a song (DC 15).'),
	tool('Lyre', 'instrument', 30, 2, 'Cha. Play a known tune (DC 10) or improvise a song (DC 15).'),
	tool(
		'Pan Flute',
		'instrument',
		12,
		2,
		'Cha. Play a known tune (DC 10) or improvise a song (DC 15).'
	),
	tool('Shawm', 'instrument', 2, 1, 'Cha. Play a known tune (DC 10) or improvise a song (DC 15).'),
	tool('Viol', 'instrument', 30, 1, 'Cha. Play a known tune (DC 10) or improvise a song (DC 15).')
];

const g = (
	name: string,
	cost: number,
	weight: number,
	d = '',
	cat: GearCat = 'gear',
	extra: Partial<GearDef> = {}
): GearDef => ({ name, cat, cost, weight, d, ...extra });

const GEAR_LIST: GearDef[] = [
	g(
		'Acid',
		25,
		1,
		'Replace one attack: throw at a target within 20 ft, Dex save (DC 8 + Dex + PB) or 2d6 Acid.'
	),
	g(
		"Alchemist's Fire",
		50,
		1,
		'Replace one attack: throw at a target within 20 ft, Dex save (DC 8 + Dex + PB) or 1d4 Fire and burning.'
	),
	g('Antitoxin', 50, 0, 'Bonus Action: drink for advantage on saves against Poisoned for 1 hour.'),
	g('Backpack', 2, 5, 'Holds 30 lb in 1 cubic foot; also a saddlebag.'),
	g(
		'Ball Bearings',
		1,
		2,
		'Utilize: cover a 10-ft square within 10 ft; entering creatures make a DC 10 Dex save or fall Prone. 10 min to recover.'
	),
	g('Barrel', 2, 70, 'Holds 40 gallons of liquid or 4 cubic feet of goods.'),
	g('Basket', 0.4, 2, 'Holds 40 lb in 2 cubic feet.'),
	g('Bedroll', 1, 7, 'Automatically succeed on saves against extreme cold while in it.'),
	g('Bell', 1, 0, 'Utilize: heard up to 60 ft away.'),
	g('Blanket', 0.5, 3, 'Advantage on saves against extreme cold while wrapped in it.'),
	g('Block and Tackle', 1, 5, 'Hoist up to four times the weight you can normally lift.'),
	g('Book', 25, 5, '+5 to Arcana, History, Nature or Religion checks about its (accurate) topic.'),
	g('Bottle, Glass', 2, 2, 'Holds 1½ pints.'),
	g('Bucket', 0.05, 2, 'Holds half a cubic foot.'),
	g(
		'Caltrops',
		1,
		2,
		'Utilize: cover a 5-ft square within 5 ft; entering creatures make a DC 15 Dex save or take 1 Piercing and Speed 0 until their next turn.'
	),
	g('Candle', 0.01, 0, 'Bright Light 5 ft and Dim Light 5 ft more for 1 hour.'),
	g('Case, Crossbow Bolt', 1, 1, 'Holds 20 Bolts.'),
	g('Case, Map or Scroll', 1, 1, 'Holds 10 sheets of paper or 5 of parchment.'),
	g(
		'Chain',
		5,
		10,
		'Utilize: bind a Grappled, Incapacitated or Restrained creature within 5 ft (DC 13 Athletics). Escape or burst: DC 18 / DC 20 Athletics.'
	),
	g('Chest', 5, 25, 'Holds 12 cubic feet.'),
	g(
		"Climber's Kit",
		25,
		12,
		"Utilize: anchor yourself; you can't fall more than 25 ft from the anchor or move farther without undoing it (Bonus Action)."
	),
	g('Clothes, Fine', 15, 6, 'Expensive clothes; some places admit only people wearing them.'),
	g("Clothes, Traveler's", 2, 4, 'Resilient clothes for travel.'),
	g(
		'Component Pouch',
		25,
		2,
		'Holds all the free Material components of your spells; usable instead of them.'
	),
	g('Costume', 5, 4, 'Advantage on checks to impersonate the person or type it represents.'),
	g('Crowbar', 2, 5, 'Advantage on Strength checks where leverage applies.'),
	g('Flask', 0.02, 1, 'Holds 1 pint.'),
	g(
		'Grappling Hook',
		2,
		4,
		'Utilize: throw at a catch within 50 ft (DC 13 Acrobatics) to climb with Rope.'
	),
	g(
		"Healer's Kit",
		5,
		3,
		'Ten uses. Utilize: stabilize a creature at 0 HP without a Medicine check.'
	),
	g(
		'Holy Water',
		25,
		1,
		'Replace one attack: throw at a creature within 20 ft, Dex save (DC 8 + Dex + PB) or 2d8 Radiant if Fiend or Undead.'
	),
	g(
		'Hunting Trap',
		5,
		25,
		'Utilize to set: DC 13 Dex save or 1d4 Piercing and Speed 0; DC 13 Athletics to escape (1 Piercing per failure).'
	),
	g('Ink', 10, 0, '1-ounce bottle, about 500 pages.'),
	g('Ink Pen', 0.02, 0, 'Writes with Ink.'),
	g('Jug', 0.02, 4, 'Holds 1 gallon.'),
	g('Ladder', 0.1, 25, '10 ft tall.'),
	g('Lamp', 0.5, 1, 'Burns Oil: Bright Light 15 ft, Dim Light 30 ft more.'),
	g('Lantern, Bullseye', 10, 2, 'Burns Oil: Bright Light in a 60-ft Cone, Dim Light 60 ft more.'),
	g(
		'Lantern, Hooded',
		5,
		2,
		'Burns Oil: Bright Light 30 ft, Dim 30 ft more. Bonus Action to hood it (Dim Light 5 ft).'
	),
	g('Lock', 10, 1, "Comes with a key. Picking it: DC 15 Sleight of Hand with Thieves' Tools."),
	g(
		'Magnifying Glass',
		100,
		0,
		'Advantage on checks to appraise or inspect detailed items; can start a fire in sunlight.'
	),
	g(
		'Manacles',
		2,
		6,
		'Utilize: bind a Small or Medium Grappled, Incapacitated or Restrained creature (DC 13 Sleight of Hand). Escape DC 20 Sleight of Hand, burst DC 25 Athletics.'
	),
	g('Map', 1, 0, '+5 to Survival checks to find your way in the mapped place.'),
	g('Mirror', 5, 0.5, 'Handheld steel mirror.'),
	g(
		'Net',
		1,
		3,
		'Replace one attack: target within 15 ft, Dex save (DC 8 + Dex + PB) or Restrained (Huge+ immune). DC 10 Athletics to escape; AC 10, 5 HP.'
	),
	g(
		'Oil',
		0.1,
		1,
		'Replace one attack: douse a target within 20 ft (Dex save) for +5 Fire if it burns; or cover a 5-ft square that burns for 2 rounds (5 Fire); lamp fuel for 6 hours.'
	),
	g('Paper', 0.2, 0, 'One sheet, about 250 words.'),
	g('Parchment', 0.1, 0, 'One sheet, about 250 words.'),
	g(
		'Perfume',
		5,
		0,
		'For 1 hour, advantage on Persuasion to influence an Indifferent Humanoid within 5 ft.'
	),
	g(
		'Poison, Basic',
		100,
		0,
		'Bonus Action: coat a weapon or three pieces of ammunition; Piercing or Slashing damage adds 1d4 Poison for 1 minute.'
	),
	g('Pole', 0.05, 7, '10 ft long; advantage on Athletics checks to vault in a jump.'),
	g('Pot, Iron', 2, 10, 'Holds 1 gallon.'),
	g(
		'Potion of Healing',
		50,
		0.5,
		'Magic. Bonus Action: drink or give to a creature within 5 ft; regain 2d4 + 2 HP.'
	),
	g('Pouch', 0.5, 1, 'Holds 6 lb in a fifth of a cubic foot.'),
	g('Quiver', 1, 1, 'Holds 20 Arrows.'),
	g('Ram, Portable', 4, 35, '+4 to Strength checks to break doors; a helper gives advantage.'),
	g('Rations', 0.5, 2, 'One day of travel food.'),
	g('Robe', 1, 4, 'Vocational or ceremonial garment.'),
	g(
		'Rope',
		1,
		5,
		'Utilize: tie a knot (DC 10 Sleight of Hand); bind a Grappled, Incapacitated or Restrained creature (escape DC 15 Acrobatics). Burst DC 20 Athletics.'
	),
	g('Sack', 0.01, 0.5, 'Holds 30 lb in 1 cubic foot.'),
	g('Shovel', 2, 5, 'Dig a 5-ft hole in an hour.'),
	g('Signal Whistle', 0.05, 0, 'Utilize: heard up to 600 ft away.'),
	g(
		'Spell Scroll (Cantrip)',
		30,
		0,
		'Magic. Cast its cantrip if it is on your class list; DC 13, +5 to hit.'
	),
	g(
		'Spell Scroll (Level 1)',
		50,
		0,
		'Magic. Cast its level 1 spell if it is on your class list; DC 13, +5 to hit.'
	),
	g('Spikes, Iron', 1, 5, 'Bundle of ten; hammer in to jam doors or tie ropes.'),
	g('Spyglass', 1000, 1, 'Magnifies twice.'),
	g('Spellbook', 50, 3, "A Wizard's book of spells (100 pages)."),
	g('String', 0.1, 0, '10 ft long; tie a knot as a Utilize action.'),
	g('Tent', 2, 20, 'Sleeps up to two Small or Medium creatures.'),
	g('Tinderbox', 0.5, 1, 'Bonus Action to light a torch or lamp; 1 minute for other fires.'),
	g(
		'Torch',
		0.01,
		1,
		'Bright Light 20 ft, Dim Light 20 ft more for 1 hour. Can attack as a Simple Melee weapon for 1 Fire.'
	),
	g('Vial', 1, 0, 'Holds 4 ounces.'),
	g('Waterskin', 0.2, 5, 'Holds 4 pints (5 lb full).'),
	g('Arrows', 1, 1, 'Bundle of 20; stored in a Quiver.', 'ammo', { qty: 20 }),
	g('Bolts', 1, 1.5, 'Bundle of 20; stored in a Crossbow Bolt Case.', 'ammo', { qty: 20 }),
	g('Bullets, Firearm', 3, 2, 'Bundle of 10; stored in a Pouch.', 'ammo', { qty: 10 }),
	g('Bullets, Sling', 0.04, 1.5, 'Bundle of 20; stored in a Pouch.', 'ammo', { qty: 20 }),
	g('Needles', 1, 1, 'Bundle of 50; stored in a Pouch.', 'ammo', { qty: 50 }),
	g('Arcane Focus (Crystal)', 10, 1, 'Sorcerer, Warlock or Wizard spellcasting focus.', 'focus'),
	g('Arcane Focus (Orb)', 20, 3, 'Sorcerer, Warlock or Wizard spellcasting focus.', 'focus'),
	g('Arcane Focus (Rod)', 10, 2, 'Sorcerer, Warlock or Wizard spellcasting focus.', 'focus'),
	g(
		'Arcane Focus (Staff)',
		5,
		4,
		'Sorcerer, Warlock or Wizard spellcasting focus; also a Quarterstaff.',
		'focus'
	),
	g('Arcane Focus (Wand)', 10, 1, 'Sorcerer, Warlock or Wizard spellcasting focus.', 'focus'),
	g('Druidic Focus (Sprig of Mistletoe)', 1, 0, 'Druid or Ranger spellcasting focus.', 'focus'),
	g(
		'Druidic Focus (Wooden Staff)',
		5,
		4,
		'Druid or Ranger spellcasting focus; also a Quarterstaff.',
		'focus'
	),
	g('Druidic Focus (Yew Wand)', 10, 1, 'Druid or Ranger spellcasting focus.', 'focus'),
	g('Holy Symbol (Amulet)', 5, 1, 'Cleric or Paladin focus, worn or held.', 'focus'),
	g('Holy Symbol (Emblem)', 5, 0, 'Cleric or Paladin focus, borne on fabric or a Shield.', 'focus'),
	g('Holy Symbol (Reliquary)', 5, 2, 'Cleric or Paladin focus, held.', 'focus'),
	g("Burglar's Pack", 16, 42, '', 'pack', {
		contents: [
			['Backpack', 1],
			['Ball Bearings', 1],
			['Bell', 1],
			['Candle', 10],
			['Crowbar', 1],
			['Lantern, Hooded', 1],
			['Oil', 7],
			['Rations', 5],
			['Rope', 1],
			['Tinderbox', 1],
			['Waterskin', 1]
		]
	}),
	g("Diplomat's Pack", 39, 39, '', 'pack', {
		contents: [
			['Chest', 1],
			['Clothes, Fine', 1],
			['Ink', 1],
			['Ink Pen', 5],
			['Lamp', 1],
			['Case, Map or Scroll', 2],
			['Oil', 4],
			['Paper', 5],
			['Parchment', 5],
			['Perfume', 1],
			['Tinderbox', 1]
		]
	}),
	g("Dungeoneer's Pack", 12, 55, '', 'pack', {
		contents: [
			['Backpack', 1],
			['Caltrops', 1],
			['Crowbar', 1],
			['Oil', 2],
			['Rations', 10],
			['Rope', 1],
			['Tinderbox', 1],
			['Torch', 10],
			['Waterskin', 1]
		]
	}),
	g("Entertainer's Pack", 40, 58.5, '', 'pack', {
		contents: [
			['Backpack', 1],
			['Bedroll', 1],
			['Bell', 1],
			['Lantern, Bullseye', 1],
			['Costume', 3],
			['Mirror', 1],
			['Oil', 8],
			['Rations', 9],
			['Tinderbox', 1],
			['Waterskin', 1]
		]
	}),
	g("Explorer's Pack", 10, 55, '', 'pack', {
		contents: [
			['Backpack', 1],
			['Bedroll', 1],
			['Oil', 2],
			['Rations', 10],
			['Rope', 1],
			['Tinderbox', 1],
			['Torch', 10],
			['Waterskin', 1]
		]
	}),
	g("Priest's Pack", 33, 29, '', 'pack', {
		contents: [
			['Backpack', 1],
			['Blanket', 1],
			['Holy Water', 1],
			['Lamp', 1],
			['Rations', 7],
			['Robe', 1],
			['Tinderbox', 1]
		]
	}),
	g("Scholar's Pack", 40, 22, '', 'pack', {
		contents: [
			['Backpack', 1],
			['Book', 1],
			['Ink', 1],
			['Ink Pen', 1],
			['Lamp', 1],
			['Oil', 10],
			['Parchment', 10],
			['Tinderbox', 1]
		]
	}),
	g('Camel', 50, 0, 'Carrying capacity 450 lb.', 'mount'),
	g('Elephant', 200, 0, 'Carrying capacity 1,320 lb.', 'mount'),
	g('Horse, Draft', 50, 0, 'Carrying capacity 540 lb.', 'mount'),
	g('Horse, Riding', 75, 0, 'Carrying capacity 480 lb.', 'mount'),
	g('Mastiff', 25, 0, 'Carrying capacity 195 lb.', 'mount'),
	g('Mule', 8, 0, 'Carrying capacity 420 lb.', 'mount'),
	g('Pony', 30, 0, 'Carrying capacity 225 lb.', 'mount'),
	g('Warhorse', 400, 0, 'Carrying capacity 540 lb.', 'mount'),
	g('Saddle, Exotic', 60, 40, 'Required for aquatic or flying mounts.', 'tack'),
	g('Saddle, Military', 20, 30, 'Advantage on checks to stay mounted.', 'tack'),
	g('Saddle, Riding', 10, 25, 'Includes bit, bridle and reins.', 'tack'),
	g('Feed (1 day)', 0.05, 10, '', 'tack'),
	g('Stabling (1 day)', 0.5, 0, '', 'tack'),
	g('Carriage', 100, 600, 'Drawn vehicle.', 'vehicle'),
	g('Cart', 15, 200, 'Drawn vehicle.', 'vehicle'),
	g('Chariot', 250, 100, 'Drawn vehicle.', 'vehicle'),
	g('Sled', 20, 300, 'Drawn vehicle.', 'vehicle'),
	g('Wagon', 35, 400, 'Drawn vehicle.', 'vehicle'),
	g('Rowboat', 50, 100, '1½ mph, 3 passengers.', 'vehicle'),
	g('Keelboat', 3000, 0, '1 mph, crew 1, 6 passengers, AC 15, 100 HP.', 'vehicle'),
	g('Longship', 10000, 0, '3 mph, crew 40, 150 passengers, AC 15, 300 HP.', 'vehicle'),
	g('Sailing Ship', 10000, 0, '2 mph, crew 20, 20 passengers, AC 15, 300 HP.', 'vehicle'),
	g('Warship', 25000, 0, '2½ mph, crew 60, 60 passengers, AC 15, 500 HP.', 'vehicle'),
	g('Galley', 30000, 0, '4 mph, crew 80, AC 15, 500 HP.', 'vehicle'),
	g('Airship', 40000, 0, '8 mph, crew 10, 20 passengers, AC 13, 300 HP.', 'vehicle')
];

export const GEAR: GearDef[] = [
	...Object.values(WEAPONS)
		.filter((w) => w.name !== 'Unarmed Strike')
		.map((w): GearDef => ({
			name: w.name,
			cat: 'weapon',
			cost: w.cost,
			weight: w.weight,
			d: `${w.dice} ${w.type}${w.versatile ? ` (versatile ${w.versatile})` : ''}; ${w.props.join(', ') || 'no properties'}; mastery ${w.mastery}.`
		})),
	...Object.values(ARMOR).map((a): GearDef => ({
		name: a.name,
		cat: 'armor',
		cost: a.cost,
		weight: a.weight,
		d: `${a.type[0].toUpperCase() + a.type.slice(1)} armor, AC ${a.base}${a.dexCap === null ? ' + Dex' : a.dexCap ? ' + Dex (max 2)' : ''}${a.str ? `, Str ${a.str}` : ''}${a.stealthDis ? ', Stealth disadvantage' : ''}.`
	})),
	{
		name: 'Shield',
		cat: 'armor',
		cost: 10,
		weight: 6,
		d: '+2 AC. Don or doff with the Utilize action.'
	},
	...TOOLS,
	...GEAR_LIST
];

export const GEAR_BY_NAME = new Map(GEAR.map((g) => [g.name.toLowerCase(), g]));

export interface StartingOption {
	label: string;
	items: [string, number][];
	gp: number;
}

const opt = (
	label: string,
	gp: number,
	...items: (string | [string, number])[]
): StartingOption => ({
	label,
	gp,
	items: items.map((i) => (typeof i === 'string' ? [i, 1] : i))
});

/** Class starting equipment: choose one option. */
export const CLASS_STARTING: Record<string, StartingOption[]> = {
	barbarian: [opt('A', 15, 'Greataxe', ['Handaxe', 4], "Explorer's Pack"), opt('B', 75)],
	bard: [
		opt(
			'A',
			19,
			'Leather Armor',
			['Dagger', 2],
			'Musical Instrument (your choice)',
			"Entertainer's Pack"
		),
		opt('B', 90)
	],
	cleric: [
		opt('A', 7, 'Chain Shirt', 'Shield', 'Mace', 'Holy Symbol (Amulet)', "Priest's Pack"),
		opt('B', 110)
	],
	druid: [
		opt(
			'A',
			9,
			'Leather Armor',
			'Shield',
			'Sickle',
			'Druidic Focus (Wooden Staff)',
			"Explorer's Pack",
			'Herbalism Kit'
		),
		opt('B', 50)
	],
	fighter: [
		opt('A', 4, 'Chain Mail', 'Greatsword', 'Flail', ['Javelin', 8], "Dungeoneer's Pack"),
		opt(
			'B',
			11,
			'Studded Leather Armor',
			'Scimitar',
			'Shortsword',
			'Longbow',
			'Arrows',
			'Quiver',
			"Dungeoneer's Pack"
		),
		opt('C', 155)
	],
	monk: [
		opt(
			'A',
			11,
			'Spear',
			['Dagger', 5],
			"Artisan's Tools or Musical Instrument (your tool proficiency)",
			"Explorer's Pack"
		),
		opt('B', 50)
	],
	paladin: [
		opt(
			'A',
			9,
			'Chain Mail',
			'Shield',
			'Longsword',
			['Javelin', 6],
			'Holy Symbol (Amulet)',
			"Priest's Pack"
		),
		opt('B', 150)
	],
	ranger: [
		opt(
			'A',
			7,
			'Studded Leather Armor',
			'Scimitar',
			'Shortsword',
			'Longbow',
			'Arrows',
			'Quiver',
			'Druidic Focus (Sprig of Mistletoe)',
			"Explorer's Pack"
		),
		opt('B', 150)
	],
	rogue: [
		opt(
			'A',
			8,
			'Leather Armor',
			['Dagger', 2],
			'Shortsword',
			'Shortbow',
			'Arrows',
			'Quiver',
			"Thieves' Tools",
			"Burglar's Pack"
		),
		opt('B', 100)
	],
	sorcerer: [
		opt('A', 28, 'Spear', ['Dagger', 2], 'Arcane Focus (Crystal)', "Dungeoneer's Pack"),
		opt('B', 50)
	],
	warlock: [
		opt(
			'A',
			15,
			'Leather Armor',
			'Sickle',
			['Dagger', 2],
			'Arcane Focus (Orb)',
			'Book (occult lore)',
			"Scholar's Pack"
		),
		opt('B', 100)
	],
	wizard: [
		opt('A', 5, ['Dagger', 2], 'Arcane Focus (Staff)', 'Robe', 'Spellbook', "Scholar's Pack"),
		opt('B', 55)
	]
};

/** Read a background equipment line like "2 Daggers, Thieves' Tools, 16 GP — or 50 GP" into options. */
export function parseBackgroundEquipment(text: string): StartingOption[] {
	const [a, b] = text.split(/\s+—\s+or\s+/);
	const parse = (part: string, label: string): StartingOption => {
		let gp = 0;
		const items: [string, number][] = [];
		for (const raw of part.split(/,\s*/)) {
			const t = raw.trim();
			const money = /^(\d+)\s*GP$/i.exec(t);
			if (money) {
				gp += Number(money[1]);
				continue;
			}
			const m = /^(\d+)\s+(.*)$/.exec(t);
			let qty = m ? Number(m[1]) : 1;
			let name = m ? m[2] : t;
			const sheets = /^(.*?) \((\d+) (sheets|flasks)\)$/.exec(name);
			if (sheets) {
				name = sheets[1];
				qty = Number(sheets[2]);
			}
			// "2 Daggers" -> Dagger x2, but bundles like "20 Arrows" stay one bundle
			const lower = name.toLowerCase();
			if (GEAR_BY_NAME.get(lower)?.qty) qty = 1;
			else if (qty > 1 && !GEAR_BY_NAME.has(lower) && GEAR_BY_NAME.has(lower.replace(/s$/, '')))
				name = name.replace(/s$/, '');
			if (t) items.push([name, qty]);
		}
		return { label, items, gp };
	};
	return [parse(a ?? '', 'A'), ...(b ? [parse(b, 'B')] : [])];
}
