---
name: ravensight-playtest-readiness
description: Prepare a game, its brief and the run command before a paid Ravensight playtest, so the playtesters (Geri and Freki) can read the screens, make the choice the developer wants and play a full session; then read the report's capability notes and fix what limited the run. Use when the user asks to run, set up or rerun a Ravensight playtest, or says a playtest came back short or thin. Optional; not part of the main Ravensight pack.
metadata:
  version: "0.2.2"
---

# Get a full playtest run

A playtest is paid per run, and a run is charged whether it covered the game or stalled on the second screen. Runs come back thin for five reasons, and all five can be fixed before the first charge:

1. The model budget runs out early on heavy screens.
2. The playtester cannot read or press something: a control with no text, a screen the game draws itself, a font with missing glyphs, a deep tree.
3. The playtester stops early because nothing told it what else to try.
4. The brief does not say how to start or which choice to make.
5. No video was asked for.

Work through the steps in order. Everything before step 7 is free. Never start a paid run, top up a balance or install the CLI without the user asking for it; show the price the CLI prints and let the user confirm.

Use only the commands and flags below. Lines marked **(next release)** are in the CLI after 0.9.0; run `ravensight-playtest <command> --help` and use a flag only if it is listed there.

## 1. Run the free checks

```sh
npx ravensight-playtest check
```

`check` reads this machine, the linked game, the brief and the balance, starts no job and charges nothing. Fix every `fail` row. It needs `ravensight-playtest login` and `ravensight-playtest init --game <gameId>` first; both are free.

**(next release)** `check --driver godot_driver --godot-project <dir> --record-video` adds `full run:` rows: a thin brief, pressable nodes with no text, no game state hook, letters no shipped font covers, and no video. Each row names its fix. Until then, do steps 2 to 5 by reading the project yourself.

## 2. Write a complete brief

Write the fields to a JSON file and save it with `ravensight-playtest brief --from <file>`; read it back with `brief --show`. A complete brief has:

- `build_notes.how_to_start`: the menu path from launch to play, step by step, and **every choice on the way by name** (the faction, character, class, mode or difficulty to pick, and where it sits on the screen). A playtester that has to guess may pick the wrong one.
- `build_notes.controls`: every input the game takes and what it does, including the one that moves time on (End Turn, Next, Confirm).
- `success_criteria`: three to six things a full session reaches, one per line, each something a screen can show ("ends three turns", "opens the shop"). One criterion means the playtester may stop when it is met.
- `goals`: one to three, in priority order.
- `known_issues` and `design_intent_notes`: everything you already know or did on purpose. Each is otherwise reported back as a finding and costs actions.
- `in_scope` and `out_of_scope` when part of the game should be left alone.
- `test_account` (kept on this machine) when the game has a sign-up: sign-up alone can take eight actions.

## 3. Make every control readable

The playtester reads a screen as text first. A control with no text is chosen blind, or needs a picture, which costs more of the model budget on every turn that screen is up.

- **Godot.** Give every `Button`, `TextureButton` and other pressable node `text`. For an icon or a coloured region, give it a meaningful node name and put a `Label` inside it. **(next release)** `tooltip_text` on a node with no text is read as its label.
- **Web builds with real elements.** Every button and link needs visible text or an `aria-label`; inputs need a label.
- **Unity WebGL and other canvas builds.** The page has no elements to read, so the playtester plays from the picture. Keep on-screen text large and high in contrast, and put the important state in words on the screen (score, level, whose turn it is).
- **Screens the game draws itself** (custom `_draw`, a tile map, 3D). In Godot, add a node to the `ravensight_state` group with `func _ravensight_state() -> Dictionary` that returns what a tester needs: the screen, the chosen faction or character, the turn, the score. It is printed with every screen, so a choice or a result can be confirmed without a picture.

## 4. Add a way in

If the part worth testing sits behind a long intro, a tutorial or a sign-up, add a debug start where the game supports it and name it in `how_to_start`:

- a level select, or a debug-only button on the title screen that jumps to the right state;
- a web build that reads a query or hash, opened with `--build-url "http://localhost:8080/?level=3"`; for a cloud playtest, `hosted run --start "?level=3"`;
- a `test_account` in the brief.

**(next release)** `run --start "?level=3"` for a local web run, and `hosted run --save <file>` to start from a save.

## 5. Check the fonts

If the game or the brief uses a language outside Latin, Greek and Cyrillic, the project must ship a font that covers it and set it as the project font (Godot: Project Settings, GUI, Theme, Custom Font). Text drawn as boxes is reported as a broken game, and is one.

## 6. Pick the length, and ask for the video

- A standard local run suits a game whose first screens are light. Use `--long` (twice the actions, model budget and time, at twice the price) when screens are heavy, the goal is far in, or `check` says the first screen is heavy.
- A cloud playtest is sized with `hosted run --tier jam|small|medium|large --minutes <n>`, and steered with `--focus "<goal>"` and `--avoid "<thing>"`. **(next release)** `run --tier`, `--minutes`, `--focus` and `--avoid` for local runs.
- Always pass `--record-video` (kept on this machine) or `--upload-video` (also sent). No video is recorded without one of them.
- Use `--realtime` only when the game has to run in real time; without it the game stands still while the playtester thinks.

## 7. Run, with the user's go

```sh
npx ravensight-playtest run --driver godot_driver --godot-project <dir> --personas fresh-eyes --record-video
npx ravensight-playtest run --build-url <url> --personas fresh-eyes --record-video
```

The CLI prints the price and the balance and asks before any charge. Do not pass `-y` unless the user has agreed to that price. Do not pass `--skip-preflight`.

## 8. Read what the run could not cover, fix it, rerun

Open each run's `report.md` under `.ravensight/jobs/<job>/runs/<run>/` and read these before the findings:

- **What this run didn't cover**: where the session never got to, and the capability notes (what the playtester could not read, press or confirm);
- **Dropped by the runner**: findings that were about the runner, not the game;
- the session length in the header, and whether the screenshots show the choice the brief names. **(next release)** The first line under **What worked** says whether that choice was the one in effect.

**(next release)** Capability notes start with a tag, and `run` prints them with the fix when the job ends. Act on each one, then rerun:

| Tag | What to add |
| --- | --- |
| `[no_label]` | Text, a tooltip or an accessible name on the control named. |
| `[drawn_screen]` | A named control over each pressable thing, or the `_ravensight_state()` hook. |
| `[no_state]` | The choice or result shown on screen, or returned by the state hook. |
| `[font]` | A font that covers the language, set as the project font. |
| `[outline_cut]` | Less nesting, or names on the nodes that matter. |
| `[no_way_in]` | A debug start, a level select or a test account, named in the brief. |
| `[input]` | A plain key or button for the same action, or mark it out of scope. |
| `[too_fast]` | A slow or assist mode for testing, named in the brief. |
| `[brief_gap]` | The missing start step, choice or control in the brief. |
| `[budget]` | `--long`, or fewer goals in the brief. |

A report with fewer than 15 actions, no video, or a session played on the wrong choice is a thin run: tell the user plainly, name which of the five reasons it was, and fix that before spending on another.

Finish by telling the user what you changed in the game and the brief, what `check` says now, what the run cost, and what is still not covered.
