<div align="center">
<br />
  <h1>
  <img src="https://user-images.githubusercontent.com/1323193/201663351-171f5916-bf03-44e0-9d9a-f5c69d3e3ec8.svg#gh-light-mode-only" width="250" alt="Anima Command line interface" />
  <img src="https://user-images.githubusercontent.com/1323193/201663360-76c32bdb-c4e4-43af-bcf7-5db760c9b71f.svg#gh-dark-mode-only" width="250" alt="Anima Command line interface" />
</h1>
</div>

**Anima Storybook CLI** is a command line interface that transforms [Storybook](https://storybook.js.org) stories into Figma components for a better design-development workflow.

Learn more about the motivations and benefits in our [our blog post](https://blog.animaapp.com/design-with-your-live-code-components-7f61e99b9bf0).

## Setup

### 1. Install the CLI

Run one of the following command in the project that has Storybook installed:

```sh
npm install --save-dev anima-storybook-cli
```
```sh
yarn add -D anima-storybook-cli
```
```sh
pnpm i -D anima-storybook-cli
```

### 2. Add Anima Token

Your team's Anima Token can be retrieved from the [Anima Plugin](https://www.figma.com/community/plugin/857346721138427857) under the "Storybook" section.

Then, add it as an Environment Variable:

> If you're running locally, add it to `.env` file in the root of your project

```sh
STORYBOOK_ANIMA_TOKEN="PASTE_YOUR_TOKEN_HERE"
```

> in a circleCI step ([how to add Environment Variables in a circleCI](https://circleci.com/docs/set-environment-variable/#set-an-environment-variable-in-a-project))

```yml
environment:
  STORYBOOK_ANIMA_TOKEN: $STORYBOOK_ANIMA_TOKEN
```

> in a GitHub Action step ([how to add Environment Variables in GitHub Actions](https://docs.github.com/en/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository))

```yml
env:
  STORYBOOK_ANIMA_TOKEN: ${{ secrets.STORYBOOK_ANIMA_TOKEN }}
```

## Usage

We recommend adding the following script to your `package.json`:

> So it can be easily integrated with your Continuous Integration solution.

```js
"scripts": {
  //...
  "sync": "anima-storybook sync"
}
```

then run it with:

```sh
npm run sync
```

## Commands and Options

### `sync`

Command to sync the storybook project to Anima team so that it can be then generated in Figma.

```sh
anima-storybook sync [option]
# example:
# anima-storybook sync --token <anima_token>
```

### Options

| Options           | Short | Description                                                                                     |   Type   |
| :---------------- | :---: | :---------------------------------------------------------------------------------------------- | :------: |
| `--token`         | `-t`  | Provide Anima's token if it was not set as Environment variable                                 | `string` |
| `--directory`     | `-d`  | To specify the storybook build folder, otherwise it uses Storybook's default `storybook-static` | `string` |
| `--design-tokens` |       | Provide a path of your Design Tokens file, i.e. `./design-tokens.json`                          | `string` |

## Alternative configuration

You can also create an `anima.config.js` file in your root directory, and save the configuration values like design tokens.

```js
// anima.config.js
module.exports = {
  design_tokens: '<path to design tokens JSON file>', // "./design-tokens.json"
};
```
