<h1 align="center">
  <img src="https://user-images.githubusercontent.com/24604927/147800476-f463b79b-7902-4a0d-8f5b-c088f6fc46f5.png" />
</h1>
<p align="center">
  c7: The <b>C</b>onfigurable <b>C</b>ommittable <b>C</b>ross-appli<b>C</b>ation <b>C</b>ustom <b>C</b>omponent <b>C</b>reator
</p>

## Quickstart
### Record

```bash
$ npx c7@latest record [<id> --<option1>=<value1> --<option2>=<value2> ...]
```

### Add

```bash
$ npx c7@latest add [<id> --<option1>=<value1> --<option2>=<value2> ...]
```

### Install

**Warning: We don't recommend installing `c7` globally. Use `npx` instead.**
```bash
$ npm install -g c7
```

## Do I need this?

Do you:
- Write lots of boilerplate? 
- Want the power of macros but with committable configuration files? 
- Want to standardize how components/routes/models/reusable bits are created in your repo? 
- Hate needing different component generators for different services?

**If you answered yes to at least one of the questions above, this package is for you!**

## Alright, I'm on board... how does it work?
For this follow-along, let's assume we're developing a React app with the following directory:

```
|-node_modules/
|-public/
|-src/
  |-components/
  |-hooks/
  |-pages/
  |-App.js
  |-App.cs
|-package.json
|-package-lock.json
```

### 1. Record yourself adding/editing files _(Optional, but recommended)_

I'll start by recording myself creating something reusable (it could be anything). Let's say I want to create a React component. I'll teach `c7` what to do by recording myself creating a `component` (but I could call it anything, like `route` or `model`). I'll also add a custom `name` parameter set to `Button` (this will make more sense later). To do that, I'll run this command:

```bash
$ c7 record component --name=Button
```

**Note: custom parameters must start with a lowercase letter. Uppercase parameters are specific to `c7`.**

It presents me with this prompt:

```bash
$ c7 record component --name=Button
Watching for changes... (Press any key to end the recording.)
```

Great! I'll go ahead and **manually** add the `Button` component now.

#### Add `src/components/Button/Button.js`
```javascript
export const Button = () => {
  // TODO
}
```

#### Modify `src/components/index.js` (new lines indicated by comments)
```javascript
import { Button } from "./Button/Button.js"; // <- manually added this line
import { Input } from "./Input/Input.js";

export {
  Button, // <- manually added this line too
  Input,
};
```

Once I'm done, I'll go back to my terminal and hit any key. I'm now presented with this screen:

```bash
$ c7 record component --name=Button
Watching for changes... (Press any key to end the recording.)
Stopped recording!

Calculating diffs...

CHANGES:
[ADDED]       `src/components/${name}/${name}.js`
[MODIFIED]    `src/components/index.js`

Does this look right? (Y/n) _
```

After selecting `Y`, `c7` creates the file `c7.json` and the directory `.c7` if they don't exist already. This config file and directory is where `c7` stores all the data it needs to recreate what we just did. 

It's smart enough to recognize that the path of the file we created contained our custom `name` parameter. If we were to define another custom parameter, for example `--basedir=src/components`, it would recognize that in the path too. It's also smart enough to understand how we modified the `index.js` file (we'll see how in a second).

I could technically create these artifacts (the configuration file and the directory) myself and still get the same result. That's the beauty of `c7`: it's configurable and controllable. It's just easier to do have them generated automatically. Now, let's get on to adding more components.

### 2. Add new components

I now want to add a new `Dropdown` component. It's as easy as running the following command:

```bash
$ c7 add component --name=Dropdown
```

Once I do, I'll see the following:

```bash
$ c7 add component --name=Dropdown
Applying diffs...

CHANGES:
[ADDED]       `src/components/Dropdown/Dropdown.js`
[MODIFIED]    `src/components/index.js`
```

Awesome! Let's take a look at what it did automatically.

#### Added `src/components/Dropdown/Dropdown.js`
```javascript
export const Dropdown = () => {
  // TODO
}
```

#### Modified `src/components/index.js` (new lines indicated by comments)
```javascript
import { Button } from "./Button/Button.js";
import { Dropdown } from "./Dropdown/Dropdown.js"; // <- automatically added this line
import { Input } from "./Input/Input.js";

export {
  Button,
  Dropdown, // <- automatically added this line too
  Input,
};
```

Wow! It got the paths right, and it even parsed `index.js` to figure out that we were adding imports and exports. If you've modified a file that doesn't have a supported parser yet, it'll fall back to inserting or modifying line-by-line. 

### 3. Use all our saved time to figure out what else `c7` can do

`c7` isn't just for React components. Any time you need to programmatically add/modify file(s) in your codebase, `c7` can help. Take a look at a few examples below for inspiration:

#### Adding routes, handlers, and validators to a REST endpoint

**Note: `MatchCase` is a `c7` specific parameter that determines whether the exact case of custom parameters must be matched. Setting it to false allows `c7` to generate boilerplate for functions that use camelCase too (like `validateUser`).**

```bash
$ c7 record model --name=user --MatchCase=false
Watching for changes... (Press any key to end the recording.)
Stopped recording!

Calculating diffs...

CHANGES:
[ADDED]       `src/handlers/${model}.js`
[ADDED]       `src/validators/${model}.js`
[MODIFIED]    `src/routes.js`

Does this look right? (Y/n) _
```

## Params specific to `c7`

|Param|Type|Default|Description|
|-----|-----|-----|-----|
|`MatchCase`|Boolean|`true`|Determines whether to match the case of custom parameters. If false, will match any variant of every custom parameter in paths, new files, and modified files.|
|`MatchPath`|Boolean|`true`|Determines whether to match paths of created and modified files. If false, will always use the absolute path.|
|`AllowVars`|Boolean|`false`|Determines whether parameters can be passed as variables to other parameters. For example, if true, passing `--name=Param1 --test=[name]00` would set `name` to be `Param1` and `test` to be `Param100`.|

More to come soon!

## What's next?

Here's a list of planned and existing features:

|Feature|Description|Progress|
|-----|-----|-----|
|**Core**|Allows for creating directories and files from specified configuration files.|`TODO`|
|**Record**|Allows the user to record component creation.|`TODO`|
|**Edit files**|Uses a parser or raw plaintext diff to allow for modifying existing files.|`TODO`|

If you have any suggestions or bugs, drop them in our [Issues](https://github.com/svasandani/c7/issues) page!
