# Changelog

## [1.3.0](https://github.com/amit221/catchem/compare/v1.2.0...v1.3.0) (2026-04-30)


### Features

* achievement condition checker and unlock logic ([5e908ba](https://github.com/amit221/catchem/commit/5e908ba93eeb6df314e01bbe1fa6a3d60a3cb680))
* achievement tracker — streak, git stats, tool usage accumulation ([8726c78](https://github.com/amit221/catchem/commit/8726c783bf0cee21df3dd69130d0c66cc0df2c7c))
* achievement unlock notification formatter ([0cc83d5](https://github.com/amit221/catchem/commit/0cc83d58200168a9432d0e336b86f487780fba14))
* add 57 achievement definitions with bytling unlock mappings ([5db6710](https://github.com/amit221/catchem/commit/5db6710bf8bb0cfd14de12e8fe52ea49ccd5fb07))
* add achievement and unlock types to GameState ([0fd99ae](https://github.com/amit221/catchem/commit/0fd99ae6a89954bb11cedf215fa1de0f1e993f1a))
* add git CLI wrapper for achievement tracking ([963b81d](https://github.com/amit221/catchem/commit/963b81dad4226f79c498a11d7a7579cabf45e46f))
* add PostToolUse hook for tool-based achievement tracking ([635aaf1](https://github.com/amit221/catchem/commit/635aaf1111711f4bfc275231fff67645b63506df))
* **assets:** add main pipeline script with interactive/auto modes ([0350b35](https://github.com/amit221/catchem/commit/0350b35029f578f0e9abfcac82c0e5e6913bfc87))
* **assets:** add OpenAI concept art generation client ([f862ff4](https://github.com/amit221/catchem/commit/f862ff4b17a0fd85f95711ab761ee0f4c0b335fc))
* **assets:** add PixelLab MCP client for sprite and animation generation ([77640a7](https://github.com/amit221/catchem/commit/77640a7730bc86fec989be8ce616dc124f8b2b30))
* **assets:** add types and manifest module with tests ([b6376a6](https://github.com/amit221/catchem/commit/b6376a62582212d18b1aaf4541c6acb0b3b6cce9))
* catchem achievements CLI command ([6b86728](https://github.com/amit221/catchem/commit/6b867280b1b9149badb3ce31c6457698c8974f56))
* engine passes unlocked pool to creature picker ([477d4f6](https://github.com/amit221/catchem/commit/477d4f628ff11e90c2ef6af32f75ea2e1795c8bf))
* gist uses image grid layout instead of text tables ([54c1d04](https://github.com/amit221/catchem/commit/54c1d046f11e96ddf99715da09824ed52d892f4a))
* GitHub profile badge — 1-liner with rarest catch, opt-in during setup ([b3f6315](https://github.com/amit221/catchem/commit/b3f631505a55fe9a7f8eee714c535807a17bc475))
* HTML viewer — catchem viewer command with codex cards and platformer scene ([707d3e2](https://github.com/amit221/catchem/commit/707d3e2c633fe354f06ea2d62172a1fa00efe927))
* HTML viewer generator with codex cards and platformer scene ([8df4492](https://github.com/amit221/catchem/commit/8df4492f08557f6f0bec6c75b68a8616f44c655a))
* Phase 3 — gist sync, PR summary, profile viewer ([f6f4bd6](https://github.com/amit221/catchem/commit/f6f4bd6961fe6f08d1b8a91090f61fae274a594a))
* pool filtering for pickRandomCreature ([4530c76](https://github.com/amit221/catchem/commit/4530c762c5f3ec66f64cbf97c6c33e2deb5bf1cf))
* state migration v1→v2 with achievement tracking fields ([1bfd3de](https://github.com/amit221/catchem/commit/1bfd3debc29d4077f574c37fb4cc644d45e3a695))
* tick runs achievement tracking and checking with unlock output ([cacaace](https://github.com/amit221/catchem/commit/cacaace2c69ab204cf70766e00cf7d0448406611))


### Bug Fixes

* **assets:** fix pipeline issues found during smoke testing ([1836992](https://github.com/amit221/catchem/commit/183699254feb78570bfc519afe97d0fca92b69a4))
* gist ID parsing for gh gist create URL format (username/id) ([05a882a](https://github.com/amit221/catchem/commit/05a882af655fd94dfb6f0dcba0255dc11b75119b))
* hide spawned gist sync window on Windows (windowsHide: true) ([c42d9cd](https://github.com/amit221/catchem/commit/c42d9cda2af4e71eed3b31dd4b4a9f258b1bff9d))
* PostToolUse only tracks tools (no catch), gist syncs once per 4h, no spawn windows ([93c90ac](https://github.com/amit221/catchem/commit/93c90ac663f2924a395ae4db753b775581fd3fce))
* session tracking, hook dedup, non-blocking gist sync, time-based achievement guards ([8bc45a1](https://github.com/amit221/catchem/commit/8bc45a1f4d44dcb8b25e8077c6a1bf28ce496e4c))
* tool name from stdin, local timezone for streaks, WebSearch for web-explorer ([d3dee3b](https://github.com/amit221/catchem/commit/d3dee3b32aed1f62e8158f5dd2fb52487612e3f3))
* use async exec instead of execSync for gist sync — never blocks prompt ([200b0da](https://github.com/amit221/catchem/commit/200b0da8da253dd182d57307f926d5fbf627f5ca))


### Performance Improvements

* move git stats from per-tick to on-demand (catchem achievements) ([45df348](https://github.com/amit221/catchem/commit/45df348f780706e7d0972f86aee3b1b9185887f4))

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
