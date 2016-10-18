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

All in all, configuring and running the `ClassCycler` in this manner performs the necessary CSS class-switching changes in a _single generated callback_ that is invoked on every interval of the cycle.

Lastly, the default start index, interval duration, and timeout duration are `0`, `1000`, and `30000`, respectively. You can pass an optional `config` argument to customize these configurations.

## Whew

Have fun.
