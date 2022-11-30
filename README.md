<div align="center">
<br />
  <h1>
  <img src="https://user-images.githubusercontent.com/1323193/201663351-171f5916-bf03-44e0-9d9a-f5c69d3e3ec8.svg#gh-light-mode-only" width="250" alt="Anima Command line interface" />
  <img src="https://user-images.githubusercontent.com/1323193/201663360-76c32bdb-c4e4-43af-bcf7-5db760c9b71f.svg#gh-dark-mode-only" width="250" alt="Anima Command line interface" />
</h1>
</div>

**Anima Storybook CLI** is a command line interface that transforms [Storybook](https://storybook.js.org) stories into Figma components for a better design-development workflow.

Learn more about the motivations and benefits in our [our blog post](https://blog.animaapp.com/design-with-your-live-code-components-7f61e99b9bf0).

## Quick start
1. Get your team's Anima Token in the [Anima Plugin](https://www.figma.com/community/plugin/857346721138427857) under the "Storybook" section.
2. Build your storybook, usually `npm run build-storybook`
3. Then run `npx anima-storybook-cli sync -t <ANIMA_TOKEN_HERE>` in your Storybook project.
4. On a Figma file, open the Anima plugin in the Storybook section and select the components you want to sync.
5. That's it! You can now use your Storybook components in Figma.


## Setup

### 1. Install the CLI

Run the following command (of your preferred package manager) in the project that has Storybook installed:

```sh
npm install --save-dev anima-storybook-cli
```

```sh
yarn add -D anima-storybook-cli
```

```sh
pnpm add -D anima-storybook-cli
```

### 2. Add Anima Token

Get your team's Anima Token that can be retrieved from the [Anima Plugin](https://www.figma.com/community/plugin/857346721138427857) under the "Storybook" section.

Then, add it as an Environment Variable:

#### If you're running locally, add the token to an `.env` file in the root of your project

```sh
#.env
STORYBOOK_ANIMA_TOKEN="PASTE_ANIMA_TOKEN_HERE"
```

>Alternatively you can use the `-t` flag when running the CLI command, i.e.:
>```sh
>npm run anima-storybook sync -t <ANIMA_TOKEN_HERE>
>```

<details>

<summary>If you're running on a CI, add the token as an Environment Variable … </summary>


#### in a circleCI step ([how to add Environment Variables in a circleCI](https://circleci.com/docs/set-environment-variable/#set-an-environment-variable-in-a-project))

#### in a GitHub Action step ([how to add Environment Variables in GitHub Actions](https://docs.github.com/en/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository))

```yml
# .github/workflows/main.yml
env:
  STORYBOOK_ANIMA_TOKEN: ${{ secrets.STORYBOOK_ANIMA_TOKEN }}
```
</details>

## Usage

```sh
[pkg manager] anima-storybook sync [option]
```

### We recommend adding the following script to your `package.json`:

So it can be easily integrated with your Continuous Integration solution.

Running the build of your storybook before syncing it with anima ensure that your storybook is always up to date.

```js
"scripts": {
  //...
  "sync": "npm run build-storybook && anima-storybook sync"
}
```

then run easily it with:

```sh
npm run sync
```

## Commands and Options

### `sync`

Command to sync the storybook project to Anima team so that it can be then generated in Figma.

```sh
anima-storybook sync [option]
```

Example of possible commands

```sh
npx anima-storybook sync --token <anima_token> 
npx anima-storybook sync --directory <storybook_static_dir> #default is storybook-static
npx anima-storybook sync --design-tokens <path_to_design_tokens_file>
```

### Options

| Options           | Short | Description                                                                                     |   Type   |
| :---------------- | :---: | :---------------------------------------------------------------------------------------------- | :------: |
| `--token`         | `-t`  | Provide Anima's token if it was not set as Environment variable                                 | `string` |
| `--directory`     | `-d`  | To specify the storybook build folder, otherwise it uses Storybook's default `storybook-static` | `string` |
| `--design-tokens` &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; |       | Provide a path of your Design Tokens file, i.e. `./design-tokens.json`                          | `string` |

## Alternative configuration

You can also create an `anima.config.js` file in your root directory, and save the configuration values like design tokens.

```js
// anima.config.js
module.exports = {
  design_tokens: '<path to design tokens JSON file>', // "./design-tokens.json"
};
```
