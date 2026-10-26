---
type: monster
status: unverified
ac: 12
hp: 27
hp_formula: 6d8
size: Medium
creature_type: aberration
alignment: Unaligned
speed: 0 ft, fly 30 ft (hover)
cr: 2
immunities: poison
resistances: acid, cold, fire, lightning, thunder; bludgeoning, piercing and slashing from nonmagical attacks
condition_immunities: charmed, exhaustion, grappled, paralyzed, petrified, prone, restrained
source: homebrew
aliases: [Hollowed Dreamer, Hulldrømmer, Dreamer]
---

> [!note] Hvad det er
> En halvt høstet fange fra en Neuromantic Decoy-tank. Ikke et spøgelse og ikke en udød —
> et menneske hvis drøm er blevet trukket halvvejs ud og efterladt stående i luften.
> Formen flimrer mellem den sovende krop og det den drømte om.

Bruges i [[Temporal Isolation Labs]] via **Tank Rupture**-reglen.

## Stat block

**Armor Class:** 12
**Hit Points:** 27 (6d8)
**Speed:** 0 ft, Fly 30 ft (hover)

| STR | DEX | CON | INT | WIS | CHA |
|-----|-----|-----|-----|-----|-----|
| 6 (−2) | 14 (+2) | 10 (+0) | 8 (−1) | 12 (+1) | 14 (+2) |

**Damage Resistances:** acid, cold, fire, lightning, thunder; bludgeoning, piercing and
slashing from nonmagical attacks
**Damage Immunities:** poison
**Condition Immunities:** charmed, exhaustion, grappled, paralyzed, petrified, prone, restrained
**Senses:** darkvision 60 ft, passive Perception 11
**Challenge:** 2 (450 XP)

### Traits

**Incorporeal Movement.** Can move through other creatures and objects as difficult terrain.
Takes 5 (1d10) force damage if it ends its turn inside an object.

**Unmoored.** At the start of its turn, if it cannot see the creature that most recently
moved within 60 feet, it has disadvantage on attack rolls until the end of its turn.

**Not Yet Gone.** If reduced to 0 hit points by psychic damage, or by an effect that would
put a creature to sleep, it is not destroyed — it collapses into a dormant mote and the
harvested prisoner survives. Any other means of reduction kills the person in the tank.
Nobody tells the party this. Let them work it out.

### Actions

**Bleed Touch.** Melee spell attack: +4 to hit, reach 5 ft, one target.
*Hit:* 10 (3d6) psychic damage.

**Borrowed Scream (Recharge 6).** Each creature within 10 feet makes a DC 12 Wisdom save,
taking 7 (2d6) psychic damage on a failure, or half as much on a success. A creature that
fails is `Frightened` of the Hollowed Dreamer until the end of its next turn.

## Kørselsnoter

- **De er ikke pålideligt fjendtlige.** De angriber det der bevægede sig sidst — inklusive
  Custodians og [[Archmage Malcer Tharanis]]. Rul ikke om det; se hvem der faktisk rykkede.
- Det her er [[Chang Wang]]s joker-mekanik med et stat block på. Hold det kaotisk i
  begge retninger.
- `Not Yet Gone` er den skjulte moralske omkostning i kampen. Ingen advarer gruppen.

## Updates

**2026-10-26 — `Dreamstuff` tilføjet.** DM-afgørelse ved bordet. Problemet: de rejser sig
inde i [[Chang Wang]]s `Maelstrom`, der gør **6d6 magical bludgeoning** (XGE) — gennemsnit
21 mod deres 27 HP. Den eksisterende resistance dækker kun **nonmagical** bludgeoning,
så de blev tværet ud af den spell, der fødte dem. Intet er slettet; traiten er tilføjet.

### Traits (tilføjet)

**Dreamstuff.** The Hollowed Dreamer is immune to forced movement, and takes no damage from
area effects that work by moving water, air or debris — `Maelstrom`, `Magnetic Pull`,
`Gravity Shift` and the like. It is not standing in the room the way a body is. Targeted
attacks and spells affect it normally.

> [!note] Hvorfor den version, og ikke bare "resistant to bludgeoning"
> At give dem resistance mod magical B/P/S ville fordoble deres effektive HP mod hele
> gruppens hovedskade — seks af dem på brættet bliver så en slæbende grind på level 11.
> `Dreamstuff` løser præcis det stillede problem uden at gøre dem sejere mod angreb.
>
> Den hænger desuden på det, der allerede stod i stat blocket: `Incorporeal Movement`,
> `speed 0 ft, fly 30 ft (hover)`, og beskrivelsen *"efterladt stående i luften."*

> [!warning] Hvad den IKKE løser — `Not Yet Gone` står uændret
> Reduceres en Dreamer til 0 HP af **psychic damage** eller en **sleep**-effekt, overlever
> fangen. **Alt andet dræber mennesket i tanken.** `Dreamstuff` betyder kun, at `Maelstrom`
> ikke længere er mordvåbnet — det gør hver eneste sværdhug og hver ildkugle fra gruppen.
> Den moralske omkostning er intakt. Ingen advarer gruppen.

> [!important] Prisen for Chang
> Hans `Maelstrom` kan nu heller ikke **rydde** dem. Vælger han at vække bank efter bank,
> kan han ikke feje resultatet væk med samme spell. Han skal bruge psychic eller sleep,
> hvis han vil have dem ned uden at slå fangerne ihjel — og det er han som Circle of Dreams
> den eneste i gruppen, der kan.

**Bivirkning, bevidst:** de er nu også immune over for Malcers `Magnetic Pull` og
`Gravity Shift`. Maskinrummet kan ikke flytte dem. Det kan flytte PC'erne.
