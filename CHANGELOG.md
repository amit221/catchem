# Changelog

## [1.2.0](https://github.com/amit221/catchem/compare/v1.1.1...v1.2.0) (2026-04-29)


### Features

* update creature mechanics and notifications ([9ea1f71](https://github.com/amit221/catchem/commit/9ea1f716314d5cae42d089c3829e5a5589ab31b4))

## [1.1.1](https://github.com/amit221/catchem/compare/v1.1.0...v1.1.1) (2026-04-26)


### Bug Fixes

* clear catch directive on miss to prevent stuck-creature replay ([#3](https://github.com/amit221/catchem/issues/3)) ([f319b9e](https://github.com/amit221/catchem/commit/f319b9effdbceaaf9039bcb713dcc4e1d53e1d16))
* clear catch directive on miss to stop stuck-creature replay ([1bd8408](https://github.com/amit221/catchem/commit/1bd840882ffac342936ad16c01d7f9641f68cbe1))
* scope catch directive to current turn instead of emitting on miss ([487ff3c](https://github.com/amit221/catchem/commit/487ff3c5a4eb420cf0d890a3eac5977479268fc0)), closes [#3](https://github.com/amit221/catchem/issues/3)

## [1.1.0](https://github.com/amit221/catchem/compare/v1.0.0...v1.1.0) (2026-04-25)


### Features

* add /collection skill to launch TUI viewer ([575f999](https://github.com/amit221/catchem/commit/575f9999d43f090702d3ec43963ab699a3b3b9d6))
* add 2-3 animation frames per creature for TUI idle animations ([3b6a046](https://github.com/amit221/catchem/commit/3b6a046b58eb975b07ee3e62c3fc72e0fce7c382))
* add 20 new creatures with diverse icon styles across all themes ([b56b4d6](https://github.com/amit221/catchem/commit/b56b4d67a9cc4a6804097045fdf2a2e78d8bba94))
* add 24 creatures across 4 themes (elemental, galactic, marvel, legends) ([3d13dfb](https://github.com/amit221/catchem/commit/3d13dfb2b46c0939a734ee1d688806d82306b2dc))
* add animation frame cycling hook for TUI ([3ee6182](https://github.com/amit221/catchem/commit/3ee6182b74fe1ba84ddc6d7f85aa871ebd9490b5))
* add auto-update prompt and multi-platform adapters (Cursor, Copilot, Codex, OpenCode, Gemini) ([961e628](https://github.com/amit221/catchem/commit/961e6286953c7dd523d9bdddddb8e0388ed64b7c))
* add catch engine with pity timer mechanic ([513bbca](https://github.com/amit221/catchem/commit/513bbca60995a1db6f665a3d7bbaad483805de1f))
* add catch notification formatter with new/levelup/normal tiers ([77ee055](https://github.com/amit221/catchem/commit/77ee05586aa14e0d9b113c9f054d18642c9bdec2))
* add Claude Code adapter and platform detection ([a924422](https://github.com/amit221/catchem/commit/a9244220145e7ceec790ac2f11e6b4b5db312d92))
* add Claude Code plugin manifest and hooks configuration ([2e9f99a](https://github.com/amit221/catchem/commit/2e9f99a78f03b5cd8e9f9079c62e08a566f3bf36))
* add CLI entry point with setup and collection commands ([c9b22df](https://github.com/amit221/catchem/commit/c9b22df9e98ec83ea7d7f432cc47813fa7d2978b))
* add coding humor flavor text pool ([d32d6b5](https://github.com/amit221/catchem/commit/d32d6b5ba9211c5ce64a29dea533394abad94262))
* add core type definitions, constants, and rarity system ([77d42f0](https://github.com/amit221/catchem/commit/77d42f061636eec5ef93a58dbb3665af0b0367e5))
* add creature registry with weighted random selection ([3d25808](https://github.com/amit221/catchem/commit/3d258084390d3bb19e6ea3ce7dc1823b069db384))
* add dev:setup script for one-command dev environment ([54f8df5](https://github.com/amit221/catchem/commit/54f8df57ee4529139cb94c18561c34917813eda3))
* add ESM TUI launcher, fix Ink v5 compatibility ([b2b9aa3](https://github.com/amit221/catchem/commit/b2b9aa3b0a5bb9f3bb66f6c98703328a1dec4232))
* add leveling system with 13-tier thresholds ([74b5e33](https://github.com/amit221/catchem/commit/74b5e33cc55d0b20bf089741596efe0306402b36))
* add LOTR, Greek mythology, and Egyptian mythology creature themes ([4c07f40](https://github.com/amit221/catchem/commit/4c07f408bc5d75dcf6c8f4f04ad23d2b9595ff3d))
* add patterned background fill for incomplete grid rows ([a307058](https://github.com/amit221/catchem/commit/a3070583682fe8c13cf0733f17cffe80caeb039d))
* add state manager with atomic writes and corruption recovery ([9b7196d](https://github.com/amit221/catchem/commit/9b7196d91cdaff4c29ec786856d58805c0194b4f))
* add TUI collection viewer with scrollable creature list ([9a5a08f](https://github.com/amit221/catchem/commit/9a5a08f4af9bc7572129984d9dae29346c1da93c))
* add TUI creature card component with animation support ([4c35109](https://github.com/amit221/catchem/commit/4c351093c7e178c791c9025737591800378bda06))
* add TUI progress bar component ([529da7f](https://github.com/amit221/catchem/commit/529da7fb8ca4355fd429a70e0d802e31a2b8e65a))
* add universal hook script with pity timer mechanic ([72af7f4](https://github.com/amit221/catchem/commit/72af7f4398d6920edfcd2d7b54b24ab3273d0577))
* animated border colors for selected and legendary/mythic cards ([b7818ea](https://github.com/amit221/catchem/commit/b7818ea7f6be1b3136f2f541cf1221be134db123))
* bigger cards, centered grid, fullscreen terminal, better scroll indicators ([9474a68](https://github.com/amit221/catchem/commit/9474a683a5ce00ac1c3e602dcc1fb94c6bf147f8))
* build dist and update /collection skill to use built CLI ([2a76720](https://github.com/amit221/catchem/commit/2a76720f0d0ada93bc343db7069902fb0c94e13e))
* polish TUI with windowed scrolling, rarity colors, and detail view ([4df8066](https://github.com/amit221/catchem/commit/4df8066a390fe1cba63af5bed3c5821acfe991cb))
* redesign TUI with 3-column card grid, rarity colors, and scroll-to-reveal ([bbd6831](https://github.com/amit221/catchem/commit/bbd6831755bb631ac8dfa4125408b22ec5a46e71))
* show 4 rows in grid, remove animation frames, clean up card component ([2a4594c](https://github.com/amit221/catchem/commit/2a4594c00271373646ee76e24f68ab438a429527))
* undead-horror theme, levelCatches system, hook rebalance ([1ac71a3](https://github.com/amit221/catchem/commit/1ac71a36c2ac7fb640be5662a3e9c9c45bbb5ed0))


### Bug Fixes

* add spacing between card art and progress bar ([5db9879](https://github.com/amit221/catchem/commit/5db9879810129a59f8cd8b15d1cb33aaba2d4de4))
* align ASCII art widths across all creatures ([292099b](https://github.com/amit221/catchem/commit/292099b0ca425d98e78175d3f752732049fbd2eb))
* card art overflow using visual width calculation ([11f424f](https://github.com/amit221/catchem/commit/11f424f0ee784ae93ad6f46dfc567c2cc124e716))
* clip card art overflow and remove duplicate header ([92f50b7](https://github.com/amit221/catchem/commit/92f50b7e36d1189165cc59d998b25076592fc5fc))
* clip card art overflow, dynamic row count, disable catches in subagents ([5f2a336](https://github.com/amit221/catchem/commit/5f2a336a278e0cddc9a77e5f4fc11b3650297765))
* configure Jest to handle ESM dependencies (ink, yoga-layout) ([aac19c5](https://github.com/amit221/catchem/commit/aac19c5428e4291e20bbd3127fa2e8d72de0d83b))
* correct terminal launch command for Windows, Mac, and Linux ([973612d](https://github.com/amit221/catchem/commit/973612da66c2d83c6a52e6edde0b077541dd1afe))
* enhance error handling in tick.js and clean up old hooks in setup.ts ([ca7bd61](https://github.com/amit221/catchem/commit/ca7bd61d6103cd6604d017480fd9e124f9f4345b))
* open collection TUI in new terminal window instead of Bash tool ([14f2838](https://github.com/amit221/catchem/commit/14f28385da7509059fbc4515326faf41e00776ba))
* remove dist/ from repo, build on demand via skill ([327fe17](https://github.com/amit221/catchem/commit/327fe17e7d9f9593981e662b1061e2bc0c9e566b))
* remove unused string-width import from card test ([062bdbc](https://github.com/amit221/catchem/commit/062bdbc87319bbd7508cf9c38d665053cb9e4504))
* replace diagonal box chars with /\ and restore tasteful icons ([893225e](https://github.com/amit221/catchem/commit/893225e57a8dc9236a1ed008fcf39a1c443d14bd))
* revert to ╱╲ diagonal chars, keep icons ([c17a0d3](https://github.com/amit221/catchem/commit/c17a0d337442a30cd8fc1a4772d9ef73f45589b7))
* skip auto-update prompt in non-TTY, clean dev:setup script ([ce0fe0f](https://github.com/amit221/catchem/commit/ce0fe0f6f8de6050ccab15c5de7245a8f9ce6811))
* update setup test for new skill directory structure ([7bb6d04](https://github.com/amit221/catchem/commit/7bb6d049848c1e90e50a739bc86adf951dd2e5b5))
* use correct Claude Code hook format (wrapped in hooks array) ([5d2b106](https://github.com/amit221/catchem/commit/5d2b10684ff9895fb4f3bd276472613be83c3054))
* use correct skill directory structure (SKILL.md in subdirectory) ([83c6d52](https://github.com/amit221/catchem/commit/83c6d5267d44be15492fad2c5de40c2b8a37cb66))
