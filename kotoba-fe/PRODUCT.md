# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Vietnamese speakers learning Japanese. The interface ships in two languages, Vietnamese (the default) and English; the explanations are written in Vietnamese and the English wording is derived from them. Japanese appears as the study material (kana, kanji, romaji). The first release serves people starting from zero, who need to learn to read hiragana and katakana before anything else.

## Product Purpose
Kotoba ("言葉", word) helps Vietnamese speakers learn Japanese in their own language. Success for the first release: a visitor understands what Kotoba is, opens the kana chart, and can drill hiragana/katakana recognition with no sign-up.

## Positioning
A Japanese course built for Vietnamese speakers from the start, not translated from English. The English interface exists so a non-Vietnamese visitor can still use the site; it does not change who the course is written for. It can point out things only a Vietnamese learner has, such as Sino-Vietnamese (Hán Việt) readings that share roots with kanji on'yomi. *(Inferred from the audience; confirm before making it a headline claim.)*

## Operating Context
Short self-study sessions on phone or laptop. Learners go back and forth between a reference (the kana chart) and active recall (quiz).

## Capabilities and Constraints
- Stack: Next.js 16 (App Router), React 19, CSS Modules, TypeScript, pnpm. No UI library.
- A backend (`kotoba-be`) exists or is planned. The frontend reads lesson data through a thin data module shaped like the future API; for now it uses bundled mock data. Progress is kept in the browser until the API exists.
- First-release capabilities: landing page, hiragana/katakana chart, recognition quiz.
- Interface language: Vietnamese or English, switched from the header and remembered in the `kotoba.lang` cookie. The pronunciation hints are Vietnamese phonetics by construction, so they ship only in the Vietnamese interface.
- Undecided: accounts, pricing, JLPT content, kanji/grammar lessons, audio.

## Evidence on Hand
None. No users, testimonials, learner counts, or partnerships exist, so none may be invented.

## Product Principles
1. Vietnamese first: explanations are written for Vietnamese speakers, not translated from English.
2. Let people practice before asking for anything: the first lesson works without signing up.
3. Show the real script: learners always see the actual Japanese characters, not just romaji.
4. Honest progress: show what the learner has actually memorized, not points for showing up.

## Accessibility & Inclusion
Japanese text needs `lang="ja"`, and Vietnamese UI text needs `lang="vi"`. Fonts must support Vietnamese diacritics. Quiz answers must work from the keyboard.
