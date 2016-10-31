# CSS Class Cycler

This utility enables the DOM cycling of toggled CSS classes based on a given parent element and specified macros. It also responds to the `mouseover` and `mouseout` events on cycled elements.

## Use Cases

Using the cycler can be fairly simple, yet dynamically customized, should the view need a more flexible cycling pattern.

### Simple Example

The markup of your component looks something like this:

```html
<div class="parent">
  <div class="child"></div>
  <div class="child"></div>
  <div class="child"></div>
</div>
```

Perhaps you want to cycle through `.child`ren with `.red-border` and `.red-background` classes, and you also want to add `mouseover` and `mouseon` event listeners that pause and resume the cycle wherever the user's mouse enters or exits. Your script can start the `ClassCycler` as such:

```javascript
// parent is the .parent Element
var cycle = new ClassCycler(parent, 'red-border red-background');
cycle.run();
```

By default, the immediate children of the passed parent element are the hosts of the `mouseover` and `mouseout` event listeners that, respectively, pause and resume the `ClassCycler`.

### Slightly More Elaborate Example

The markup of your component looks something like this:

```html
<div class="parent">
  <div class="child">
    <div class="foo"></div>
  </div>

  <div class="child">
    <div class="foo"></div>
  </div>

  <div class="child">
    <div class="foo"></div>
  </div>
</div>
```

You still want to add the `mouseover` and `mouseon` event listeners on `.child`ren, but you want all `.foo`'s to be cycled with a `.bar` class. In other words, you want all `.foo`'s to be cycled with a `.bar` class, but you want the event listeners attached to each respective outer `.child` container. Your script can configure the `ClassCycler` as such:


```javascript
// parent is the .parent Element
var cycle = new ClassCycler(parent, {
  locator: 'foo',
  toggle: 'bar',
});
cycle.run();
```

In this example, the cycling of `.foo`'s is scoped within `.parent`.

If you wanted to scope the cycling of `.foo`'s within a different, more immediate parent container, you can add an optional `parentEl: Element` key-value pair in the passed object of the above example.

### More Elaborate Example

This example is just to demonstrate a more dyamic use case.

The markup of your component looks something like this:

```html
<div class="parent">
  <div class="special-excluded-element">

  <div class="child">
    <div class="foo"></div>
    <div class="bob"></div>
    <div class="hello"></div>
  </div>

  <div class="child">
    <div class="foo"></div>
    <div class="bob"></div>
    <div class="hello"></div>
  </div>

  <div class="child">
    <div class="foo"></div>
    <div class="bob"></div>
    <div class="hello"></div>
  </div>

  <div class="other-special-excluded-element"></div>
</div>
```

You want to add the `mouseover` and `mouseon` event listeners only on `.parent`'s immediate `.child`ren.

You also want all `.foo`'s to be cycled with a `.bar` class, all `.bob`'s to be cycled with a `.joe` class, and all `.hello`'s to be cycled with a `.world` class, all in the same iteration or interval of the `ClassCycler`. Your script can configure the `ClassCycler` as such:

```javascript
// parent is the .parent Element
var cycle = new ClassCycler({
  parentEl: parent,
  listenerHost: 'child'
}, [{
  locator: 'foo',
  toggle: 'bar'
}, {
  locator: 'bob',
  toggle: 'joe'
}, {
  locator: 'hello',
  toggle: 'world'
}]);
cycle.run();
```

From this example, it's clear that the first argument passed to the `ClassCycler` constructor is to determine more explicitly the `scope` of the elements attached with mouse event listeners. This distinction would be necessary if you wanted to restrict the listener-attached elements to a certain class of elements instead of all the immediate children of the `parent`.

### Even More Elaborate Example

Take the previous example's use case, but you want to attach the mouseover and mouseon event listeners not just to one specific set of elements, but to more.

The markup of your component looks something like this:

```html
<div class="parent">
  <div class="child"></div>
  <div class="child"></div>
  <div class="child"></div>

  <div class="hello">
    <div class="world"></div>
    <div class="world"></div>
    <div class="world"></div>
  </div>

  <div class="bob">
    <div class="joe"></div>
    <div class="joe"></div>
    <div class="joe"></div>
  </div>

  <div class="foo">
    <div class="bar"></div>
    <div class="bar"></div>
    <div class="bar"></div>
  </div>

  <div class="joe"></div>
</div>
```

You want all `.child`ren to be cycled with a `.sick` class, all `.world`'s to be cycled with an `.order` class, all `.joe`'s to be cycled with a `.sloppy` class, and all `bar`'s to be cycled with a `.baz` class, all in the same iteration or interval of the `ClassCycler`.

At the same time, you want to attach the mouseover and mouseon event listeners to every cycled element, pausing and resuming the `ClassCycler` at whichever index corresponds to the hovered or exited cycled element. Your script can configure the `ClassCycler` as such:

```javascript
// parent is the .parent Element
// hello is the .hello Element
// bob is the .bob Element
// foo is the .foo Element
var cycle = new ClassCycler([{
  parentEl: parent,
  listenerHost: 'child',
  main: true
}, {
  parentEl: hello,
  listenerHost: 'world',
}, {
  parentEl: bob,
  listenerHost: 'joe',
}, {
  parentEl: foo,
  listenerHost: 'bar',
}], [{
  locator: 'child',
  toggle: 'sick'
}, {
  locator: 'world',
  toggle: 'order'
}, {
  locator: 'joe',
  toggle: 'sloppy'
}, {
  locator: 'bar',
  toggle: 'baz'
}]);
cycle.run();
```

Notice the key-value pair `main: true` in one of the listener host locators. This key-value pair specifies the main scope of the CSS class-cycling. If there had been another `.joe` element outside of `.bob` but still within `.parent`, such would have been included in the `.sloppy.joe` cycle. The optional (but necessary) key-value `parentEl: bob<Element>` would then need to be added to the class-cycling locator object, as seen below:

```javascript
{
  locator: 'joe',
  toggle: 'sloppy',
  parentEl: bob
}
```
## Last Example

As a challenge, consider the example:

```html
<div class="container">
  <div class="parent">
    <div class="child"></div>
    <div class="child"></div>
    <div class="child"></div>
  </div>

  <div class="hello">
    <div class="world"></div>
    <div class="world"></div>
    <div class="world"></div>
  </div>

  <div class="bob">
    <div class="joe"></div>
    <div class="joe"></div>
    <div class="joe"></div>
  </div>

  <div class="foo">
    <div class="bar"></div>
    <div class="bar"></div>
    <div class="bar"></div>
  </div>
</div>
```

This example challenges the notion of the main parent element or containing scope. Your script can configure the `ClassCycler` as such:

```javascript
// parent is the .parent Element
// hello is the .hello Element
// bob is the .bob Element
// foo is the .foo Element
var cycle = new ClassCycler([{
  parentEl: parent,
  listenerHost: 'child',
}, {
  parentEl: hello,
  listenerHost: 'world',
}, {
  parentEl: bob,
  listenerHost: 'joe',
}, {
  parentEl: foo,
  listenerHost: 'bar',
}], [{
  locator: 'child',
  toggle: 'sick',
  parentEl: parent
}, {
  locator: 'world',
  toggle: 'order',
  parentEl: hello
}, {
  locator: 'joe',
  toggle: 'sloppy',
  parentEl: bob
}, {
  locator: 'bar',
  toggle: 'baz',
  parentEl: foo
}]);
cycle.run();
```

If a `main: Element` isn't specified, the following array of class-cycling element locators must each specify its `parentEl` scope.

## Whew

All in all, configuring and running the `ClassCycler` in these manners of examples performs the necessary CSS class-switching changes in a _single generated callback_ that is invoked on every interval of the cycle.

## Last Note

You can pass an optional `config` argument to customize the configuration of the `Cycler`:

Keys               | Value Types  | Description
------------------ | ------------ | -----------
`startIdx`         | `number`     | Determines the starting index of the `Cycler`. Defaults to `0`.
`intervalDuration` | `number`     | The duration of each cycle interval in milliseconds. Defaults to `1000`.
`timeoutDuration`  | `number\|null` | The duration of the whole cycle in milliseconds. Defaults to `30000`. Passing in a `null` prevents any timeout and makes the `ClassCycler` run perpetually.
`reverseDirection` | `boolean`    | The direction in which the `Cycler` steps. Defaults to _incremental iteration_ as opposed to _decremental iteration_.
`stepDistance`     | `number`     | The distance by which the `Cycler` steps. Defaults to `1`.

The demos and examples show configurations of the `ClassCycler` that pass `Element`'s as `parentEl`'s. Passing in a string instead is valid; doing so will `querySelector` the `document` for an element with a class name of that string. This may or may not achieve the intended effect.

Okay. Have fun.
