<div align="center">
  <br/>
  <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTsajnACWOIGnufHjda9Lps9iVrzeKU7EUxmg&usqp=CAU" width="100" alt="Storybook to Anima to Figma Addon"/>
  <br/>
  
  <h1>Anima Storybook CLI</h1>

  <br/>
</div>

Anima Storybook CLI is a command line interface that enables to transform stories into Figma components for a better design-development workflow.

Learn more about the motivations and benefits in our [our blog post](https://blog.animaapp.com/design-with-your-live-code-components-7f61e99b9bf0)

## Setup

### 1. Install

```sh
npm install --save-dev anima-storybook-cli
# yarn add -D anima-storybook-cli
```

### 2. Configure `anima.config.js`

create an `anima.config.js` file in your root directory

```js
// anima.config.js
module.exports = {
  access_token: '<paste your access token here>',
  build_command: '<storybook build command>', // build-storybook by default
};
```

## Usage

### Sync

In order to sync your project's storybook you can run the sync command

```sh
anima-storybook sync [options]
# yarn add -D storybook-anima
```

| Options                          | Description                                                              |
| -------------------------------- | ------------------------------------------------------------------------ |
| `-t`, `--token [string]`         | Provide anima's access token <br/>`anima-storybook -t 1234`              |
| `-b`, `--build-command [number]` | Storybook build command to run <br/>`anima-storybook -b build-storybook` |
