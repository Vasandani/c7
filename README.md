<h1 align="center">
  <img height="250" width="375" src="https://user-images.githubusercontent.com/24604927/147843028-ccdc5ee8-e3d8-4017-9923-f11e5ba37eb8.gif" />
  <br />
  <img src="https://img.shields.io/npms-io/final-score/c7" />
  <img src="https://img.shields.io/npms-io/maintenance-score/c7" />
  <img src="https://img.shields.io/npms-io/popularity-score/c7" />
  <img src="https://img.shields.io/npms-io/quality-score/c7" />
  <img src="https://img.shields.io/npm/dm/c7" />
  <br />
  <img src="https://img.shields.io/github/license/svasandani/c7" />
  <img src="https://img.shields.io/npm/v/c7?label=version" />
  <img src="https://img.shields.io/github/commit-activity/m/svasandani/c7" />
  <img src="https://img.shields.io/github/stars/svasandani/c7" />
</h1>

`c7` is a CLI that allows you to define reusable code components and recreate them with different names/paths/variables—no more copy-pasting folders an changing filenames, imports, exports, comments, or anything else. With `c7`, just [record](#record-yourself-creating-something) yourself creating a component, and then [add](#add-more-somethings) a new one when you need it. No time-consuming config files needed.

Why `c7`? It's an easy way to standardize component generation. Maybe you've already scripted a macro to do this, but your team and other people contributing to your repo won't have access to it. Make it easier for everyone—contributors, maintainers, you.

Plus, with starter packs (coming soon), you can easily bootstrap your project with best practices for anything the community supports, in any language: hooks in React, handlers in Express, goroutines in Go, routes in Rust, and more. If the community doesn't have a starter pack, you can even make your own!

<br />

-----
<p align="center">
  The <b>C</b>onfigurable <b>C</b>ommittable <b>C</b>ross-appli<b>C</b>ation <b>C</b>ustom <b>C</b>omponent <b>C</b>reator
</p>

-----
<br />

## How do I use it?
### Install it

Install it globally with `npm`.

```bash
$ npm install -g c7
```

### Record yourself creating something

`c7` needs to know how to make what you want. If it doesn't already know, teach it by letting it watch you. Run the command below, then make your changes. Press Enter once you're done, and it'll automatically create all the configuration for you.

```bash
$ c7 record [<id> --<param1>=<value1> --<param2>=<value2> ...]
```

`id` is a unique identifier for whatever you're making. If it's a `Page` in a React app, use `Page`. Any alphanumeric value is supported here.

`param`s and `value`s allow you to define custom variables for each code component. For example, a React design component would probably have a `name`, so you'd add the `--name` param. The `value` is whatever that param is set to in the code you create.

For example, you want to create a React component. To teach it, you might create a component with the name `Button`. You'd run this:

```bash
$ c7 record component --name=Button
```

Then, you'd add the relevant files (`Button.jsx`, `Button.css`, whatever your heart desires). `c7` will replace every occurrence of `Button` with a placeholder, that will be filled in when you add a new component.

Note: If you want to create something else use `--name=SomethingElse`. Call it whatever you want!

### Add more somethings

Once the configuration is generated, you can add new items whenever you want! Run the command below with the same `id` and `param`s, and `c7` will figure out where to put the new values.

```bash
$ c7 add [<id> --<param1>=<value1> --<param2>=<value2> ...]
```

The `id` determines what is generated. It has to match what you recorded, or in the case of a starter pack, whatever is specified by the author of the starter pack. 

Use the same `param`s as when you recorded, but with updated values. Using the React component example above, if you wanted to create an `Input` component, you'd run this:

```bash
$ c7 add component --name=Input
```

## FAQs

### Is it stable?

Not yet! We're using semantic versioning, and our 1.0.0 release is coming soon. That will have the core features, and breaking changes will result in a major version upgrade.

[Watch](https://github.com/svasandani/c7/subscription) this repository to be notified when 1.0.0 comes out!

### What's the point? Can't I just use existing packages/some other solution?

Sure! Whatever works best for you works best for you, and if that's not `c7`, we encourage you to do what makes you happy.

The key advantages of `c7` are that:
- since configurations can be committed, everyone in your team can generate things the same way
- it's not opinionated at all—create components however you want
- if you do want to do things the idiomatic way, you can with starter packs (coming soon!)
- super simple configuration—just record file creation, and `c7` does the rest

### How does modifying files work?

Currently, `c7` looks for where you've added data based on line and col position. It will add data at the same place (adjusting to make sure it stays even if things shift a little). Eventually, we'll support AST parsers to more meaningfully modify files.

We'll support a limited subset, but we'll allow plugins to support other community-written parsers.

## Configuring `c7`

These can be configured either in `c7.json` or as params when running commands.

|Param|Type|Default|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Description&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|
|-----|-----|-----|-----|
|`MatchCase`|Boolean|`true`|Determines whether to match the case of parameters. If false, will match lowercase, uppercase, and capitalcase variants of every custom parameter in paths, new files, and modified files.|
|`MatchPath`|Boolean|`true`|Determines whether to match paths of created and modified files. If false, will never try to change the path.|
|`AllowVars`|Boolean|`false`|Determines whether parameters can be passed as variables to other parameters. For example, if true, passing `--name=Param1 --test=[name]00` would set `name` to be `Param1` and `test` to be `Param100`.|

More to come soon!

## What's the roadmap?

In the interest of full disclosure, here's a list of all planned and existing features, along with their status.

- ### Add ![incomplete](https://img.shields.io/badge/-INCOMPLETE-orange)
  - #### Create ![incomplete](https://img.shields.io/badge/-INCOMPLETE-orange)
    - ##### Create directories ![live](https://img.shields.io/badge/-LIVE-green)
    - ##### Create files ![live](https://img.shields.io/badge/-LIVE-green)
    - ##### Ensure no overwrite ![todo](https://img.shields.io/badge/-TODO-red)
  - #### Modify ![incomplete](https://img.shields.io/badge/-INCOMPLETE-orange)
    - ##### Modify files using line position ![incomplete](https://img.shields.io/badge/-INCOMPLETE-orange)
      - ###### Insert chunks at position ![live](https://img.shields.io/badge/-LIVE-green)
      - ###### Update chunk position on insert ![live](https://img.shields.io/badge/-LIVE-green)
      - ###### Detect external changes to file (`lastHash`, `lastContents`) ![todo](https://img.shields.io/badge/-TODO-red)
      - ###### Add naive, diff, prefix, skip resolutions ![todo](https://img.shields.io/badge/-TODO-red)
    - ##### Modify files using AST ![todo](https://img.shields.io/badge/-TODO-red)
- ### Record ![incomplete](https://img.shields.io/badge/-INCOMPLETE-orange)
  - #### New ![incomplete](https://img.shields.io/badge/-INCOMPLETE-orange)
    - ##### New directories ![live](https://img.shields.io/badge/-LIVE-green)
    - ##### New files ![live](https://img.shields.io/badge/-LIVE-green)
    - ##### Use user-friendly templates ![todo](https://img.shields.io/badge/-TODO-red)
  - #### Modified ![incomplete](https://img.shields.io/badge/-INCOMPLETE-orange)
    - ##### Modified directories ![live](https://img.shields.io/badge/-LIVE-green)
    - ##### Modified files ![todo](https://img.shields.io/badge/-TODO-red)
- ### Starter packs ![todo](https://img.shields.io/badge/-TODO-red)
  - #### Allow modify if not exist (`ifEmpty`) ![todo](https://img.shields.io/badge/-TODO-red)
- ### Plugins ![todo](https://img.shields.io/badge/-TODO-red)
  - #### Refactor and extract core to plugin ![todo](https://img.shields.io/badge/-TODO-red)
- ### Dependency management ![todo](https://img.shields.io/badge/-TODO-red)

If you would like to see a feature not listed here, or if you notice any bugs, drop them in our [Issues](https://github.com/svasandani/c7/issues) page!

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
