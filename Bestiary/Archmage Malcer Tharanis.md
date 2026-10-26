---
type: monster
status: canon
ac: 18
hp: 178
hp_formula: 19d8+95
size: Medium
creature_type: humanoid (human)
alignment: Lawful Evil
speed: 30 ft
legendary: true
source: homebrew
aliases: [Malcer, Malcer Tharanis, The Grand Architect]
---

> [!warning] Calibration
> 178 HP is canon. He may be **upgraded** for later encounters if the table needs it —
> but the Planar Anchor fight must **not** be a copy of the Planar Seed fight.
> See [[Planar Seed vs Planar Anchor]].

## Stat block

**Armor Class:** 18 (Arcane Shield)
**Hit Points:** 178 (19d8+95)
**Speed:** 30 ft

| STR | DEX | CON | INT | WIS | CHA |
|-----|-----|-----|-----|-----|-----|
| 10 (+0) | 14 (+2) | 20 (+5) | 18 (+4) | 16 (+3) | 16 (+3) |

**Saving Throws:** Int +9, Wis +8
**Senses:** passive Perception 13
**Challenge:** 15 (13,000 XP)

### Traits

**Legendary Resistance (3/day).** If Malcer fails a saving throw, he can choose to succeed
instead. See `Testify` in [[Temporal Isolation Labs]] — [[Muk]] can strip this.

**Planar Anchor.** While the **Anchor Charge** track is above 0, Malcer does not die. On
dropping to 0 hit points he dissolves into light and returns at the start of his next turn
at half his hit point maximum (89). At **Anchor Charge 0**, the next time he drops to 0 hit
points he stays down.

**Draw of the Anchor.** At the start of his turn, Malcer gains temporary hit points equal to
**twice the current Anchor Charge**. These do not stack with themselves — recalculate each
turn. Burn the track and he gets frail in front of the party.

### Actions

**Multiattack.** Malcer makes two `Order's Edge` attacks.

**Order's Edge.** Ranged Spell Attack: +9 to hit, range 120 ft, one target. Hit: 22 (4d10)
force damage.

**Temporal Mastery (Recharge 5–6).** Up to 2 creatures Malcer can see within 60 feet make a
DC 17 Wisdom save. On a failure the target is `Paralyzed` until the end of its next turn.

**Consume Custodian (Phase 3 only).** Malcer destroys one willing [[Custodian Overseer]]
within 60 feet. **Anchor Charge +2.** If no Custodian remains, he ruptures a bank of
Neuromantic Decoy tanks instead — Anchor Charge +2, and the Tank Rupture rule triggers.

### Reactions

**Arcane Shielding.** In response to being hit, Malcer gains +3 AC against that attack,
possibly causing it to miss. If it misses, the attacker takes 1d8 force damage.

### Legendary Actions (3 per round)

Malcer can take 3 legendary actions per round, one at a time, at the end of another
creature's turn.

| Action | Cost | Effect |
|--------|------|--------|
| **Arcane Pulse** | 1 | Each creature within 10 ft of a point Malcer can see within 60 ft takes 10 (3d6) force damage, DC 17 Dexterity save for half. |
| **Temporal Step** | 2 | Teleports up to 60 ft, leaving an echo at his origin that detonates for 14 (4d6) force damage in a 10 ft radius. |
| **Shift Reality** | 2 | One creature within 60 ft makes a DC 17 Strength save or is moved up to 30 ft in a direction Malcer chooses. **This is how he breaks [[Merith Lonehunter]]'s plug.** If moved *upward*, see `Suspended` under Updates. |
| **Reseat the Anchor** | 2 | **Anchor Charge +1.** |

### Lair

**Lair Resonance.** On initiative count 20, Malcer controls the machine room — Magnetic Pull,
Gravity Shift, or Mana Drain. Which one is set by the phase; see [[Temporal Isolation Labs]].

## Kampagne-noter

Se [[Archmage Malcer Tharanis]] i `NPCs/` for motivation, stemme og historie.
Fasestruktur og Anchor Charge: [[Temporal Isolation Labs]].
Bordark: `_dm/RUNSHEET Planar Anchor.md`.

## Updates

**2026-08-23** — Stat block udbygget forud for Anchor-kampen. Ændringer, og hvorfor:

- **`Planar Heart` fjernet som begreb.** Trait'et sagde tidligere at han genopstår "unless
  the Planar Heart is destroyed". Det var et tredje navn på noget der i canon hedder enten
  Planar Seed (hjernen) eller Planar Anchor (hjertet), jf. [[Planar Seed vs Planar Anchor]],
  og det pegede desuden på en sejrsbetingelse (ødelæg krystallen) der modsagde
  [[Temporal Isolation Labs]] (Anchor Charge 0). Nu ét begreb, én sejrsbetingelse.
- **`Legendary Resistance (3/day)` tilføjet.** Manglede helt. Uden den havde [[Muk]]s
  `Testify`-løftestang ingen mekanisk effekt overhovedet, fordi den eksplicit fjerner
  Legendary Resistance.
- **Legendary action costs sat.** Var "3/turn" med tre navngivne muligheder og ingen priser.
- **`Reseat the Anchor` tilføjet.** Uden en modvægt kunne gruppen brænde hele Anchor Charge
  på runde 2 (Sharn −3 og Victor −2 alene er 5, og Meriths prop slår regen fra). Faserne nåede
  aldrig at eksistere. Track'et er samtidig hævet fra 8 til **10**.

  > [!warning] Rettelse 2026-10-26 — **8, ikke 10**
  > Tallet 10 holdt under et døgn. Track'et blev **retunet tilbage til 8** (se `_dm/ACTIVE.md`,
  > 2026-08-23 — retune), fordi gruppen kun havde haft **short rest** og begge
  > engangsløftestænger derfor var væk. **8 er det gældende tal**, og kampen kører på 8.
  > Linjen ovenfor er bevaret som designhistorik, ikke som regel.

- **`Draw of the Anchor` og `Consume Custodian` tilføjet** som fase-mekanik.

Intet er slettet fra det oprindelige koncept — AC 18, HP 178, Temporal Mastery, Arcane
Shielding og de tre legendary actions står som de gjorde.

**2026-10-26 — `Shift Reality` udvidet: `Suspended`.** Afgjort live, da Malcer kastede
[[Merith Lonehunter]] **op i luften** i stedet for til siden.

> **Suspended.** If `Shift Reality` moves a creature upward, it hangs in the air until the
> **start of Malcer's next turn**. While suspended it can make ranged attacks, cast spells
> and use reactions normally, but it **cannot move under its own power** — only another
> creature or an effect can move it. When the effect ends it **falls and takes falling
> damage** (1d6 bludgeoning per 10 ft, PHB p. 183).

Det er en oppustning af en legendary action, der allerede kostede 2 LA, og det er med
vilje: mod [[Merith Lonehunter]] på pladen køber den Malcer **en hel runde regen**, ikke
bare én runde uden prop. Husk at proppen ellers er en tilstand ved rundens slutning —
tvunget af og tilbage igen bryder den ikke. Se [[Temporal Isolation Labs]].

`status: unverified` — godkend eller ret efter kampen.
