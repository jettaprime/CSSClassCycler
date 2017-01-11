import isArray from 'lodash/isArray';
import isElement from 'lodash/isElement';
import isFunction from 'lodash/isFunction';
import isInteger from 'lodash/isInteger';
import isString from 'lodash/isString';
import isUndefined from 'lodash/isUndefined';

export default class {
  constructor(scope, switchMacro, config) {
    // Set operational state.
    this._halted = true;

    // Configure.
    this._setup(config);
    this._handlerRegistry = {};

    // Determine the listener host elements from the parent element.
    if (scope) {
      this._setParentEl(scope);
      this._setListenerHosts(scope);
    }

    // Process the macro(s) into a switch object(s).
    if (switchMacro) {
      this._produceSwitchObj(switchMacro);
    }
  }

  get halted() { return this._halted; }

  static get DefaultIntervalDuration() { return 1000; }

  static get DefaultTimeoutDuration() { return 30000; }

  _setup(config) {
    this._setStartIdx(config);
    this._setIntervalDuration(config);
    this._setTimeoutDuration(config);
    this._setStepDistance(config);
    this._setAdditionalCallback(config);
  }

  _setStartIdx(config) {
    const c = config;

    this._cycleIdx = (c && c.startIdx && isInteger(c.startIdx) &&
      c.startIdx >= 0) ? c.startIdx : 0;
  }

  _setIntervalDuration(config) {
    const c = config;

    this._intervalDuration = (c && c.intervalDuration &&
      c.intervalDuration >= 0) ? c.intervalDuration :
      this.constructor.DefaultIntervalDuration;
  }

  _setTimeoutDuration(config) {
    const c = config;

    this._timeoutDuration = c && !isUndefined(c.timeoutDuration) ?
      c.timeoutDuration : this.constructor.DefaultTimeoutDuration;
  }

  _setStepDistance(config) {
    const c = config;
    const direction = c && c.reverseDirection ? -1 : 1;
    const distance = c && c.stepDistance || 1;
    this._stepDistance = direction * distance;
  }

  _setAdditionalCallback(config) {
    const c = config;

    if (c && c.additionalCallback && isFunction(additionalCallback)) {
      this._additionalCallback = additionalCallback;
    }
  }

  _setParentEl(scope) {
    this._parentEl = ((scope) => {
      if (isArray(scope)) {
        return scope.filter((locator) => { return locator.main; });
      } else if (isString(scope)) {
        return document.querySelector(`.${scope}`);
      } else if (isElement(scope)) {
        return scope;
      } else if (scope.parentEl) {
        return scope.parentEl;
      }
    })(scope);
  }

  _setListenerHosts(scope) {
    this._listenerHosts = ((scope) => {
      if (isArray(scope)) {
        return this._categorizeHosts(scope);
      } else if (isString(scope)) {
        return [Array.prototype.slice.call(this._parentEl.children, 0)];
      } else {
        return [Array.prototype.slice.call(this._designateHostSet(scope))];
      }
    })(scope);
  }

  _categorizeHosts(scope) {
    return scope.map((locator) => {
      return Array.prototype.slice.call(this._designateHostSet(locator), 0);
    });
  }

  _designateHostSet(locator) {
    let parentEl;

    if (isElement(locator.parentEl)) {
      parentEl = locator.parentEl;
    } else if (isString(locator.parentEl)) {
      parentEl = document.querySelector(`.${locator.parentEl}`);
    } else if (locator.children) {
      return locator.children;
    }

    return parentEl.getElementsByClassName(locator.listenerHost);
  }

  _buildHandler(eventType, idx) {
    return this.constructor.EventHandlers[eventType].bind(this, idx);
  }

  _mouseoverHandler(idx) {
    if (!this._halted) {
      this._halt();
      this._removeClassesOnCurrentEl();
      this._cycleIdx = idx;
      this._addClassesOnCurrentEl();
    }
  }

  _mouseoutHandler(idx) {
    if (this._halted) {
      this._resume();
      this._cycleIdx = idx;
      this._startFrameLoop();
    }
  }

  _blurHandler() {
    if (!this._halted) {
      this._halt();
      this._removeClassesOnCurrentEl();
    }
  }

  _focusHandler() {
    if (this._halted) {
      this._resume();
      this._addClassesOnCurrentEl();
      this._startFrameLoop();
    }
  }

  _visibilityHandler() {
    if (document.hidden) {
      this._blurHandler();
    } else {
      this._focusHandler();
    }
  }

  static get EventHandlers() {
    return {
      blur: this.prototype._blurHandler,
      focus: this.prototype._focusHandler,
      mouseout: this.prototype._mouseoutHandler,
      mouseover: this.prototype._mouseoverHandler,
      visibilitychange: this.prototype._visibilityHandler
    };
  }

  _produceSwitchObj(macro) {
    this._switchObj = isArray(macro) ? this._populateSwitchObj(macro) :
      this._processMacro(macro);
  }

  _populateSwitchObj(macro) {
    return macro.map((macro) => { return this._processMacro(macro); });
  }

  _processMacro(macro) {
    let parentEl, elements, togglingClasses;

    if (isString(macro)) {
      parentEl = this._parentEl;
      elements = parentEl.children;
      togglingClasses = macro.split(' ');
    } else if (isString(macro.parentEl)) {
      parentEl = document.querySelector(`.${macro.parentEl}`);
    } else {
      parentEl = macro.parentEl || this._parentEl;
    }

    if (!elements) {
      elements = parentEl.getElementsByClassName(macro.locator);
    }

    if (!togglingClasses) {
      togglingClasses = macro.toggle.split(' ');
    }

    return { elements, togglingClasses };
  }

  _addListenersOnHosts() {
    const events = ['mouseover', 'mouseout'];
    let listenerIdx = 0;

    this._listenerHosts.forEach((hostSet) => {
      hostSet.forEach((host, idx) => {
        events.forEach((eventType) => {
          this._handlerRegistry.mouse = this._handlerRegistry.mouse || [];
          this._handlerRegistry.mouse.push(this._buildHandler(eventType, idx));
          host.addEventListener(eventType,
            this._handlerRegistry.mouse[listenerIdx], false);
          listenerIdx++;
        });
      });
    });
  }

  _addListenersOnWindow() {
    const event = this._hasVisibilityChangeEvent() ? 'visibilitychange' :
      ['blur', 'focus'];

    if (isArray(event)) {
      this._registerEachEventListener(event);
    } else {
      this._registerEventListener(event);
    }
  }

  _hasVisibilityChangeEvent() {
    return 'hidden' in document;
  }

  _registerEachEventListener(eventTypes) {
    eventTypes.forEach((eventType) => {
      this._registerEventListener(eventType);
    });
  }

  _registerEventListener(event) {
    this._handlerRegistry[event] =
      this.constructor.EventHandlers[event].bind(this);

    window.addEventListener(event, this._handlerRegistry[event], false);
  }

  _halt() {
    window.cancelAnimationFrame(this._scheduledFrame);
    this._halted = true;
  }

  _resume() {
    this._halted = false;
  }

  _unhalt() {
    this._resume();
  }

  _establishCycleCallback() {
    this._cycleCallback = isArray(this._switchObj) ?
      this._populateCycleCallback() : this._buildCallback(this._switchObj);
  }

  _populateCycleCallback() {
    return this._switchObj.map((switchObj) => {
      return this._buildCallback(switchObj);
    });
  }

  _buildCallback(switchObj) {
    this._elementCount = this._elementCount || switchObj.elements.length;
    return this._switchClass.bind(this, switchObj);
  }

  _switchClass(switchObj) {
    const { togglingClasses } = switchObj;
    const removingClassList = switchObj.elements[this._cycleIdx].classList;
    const nextIdx = this._determineNextIdx(this._cycleIdx, this._elementCount);
    const addingClassList = switchObj.elements[nextIdx].classList;
    removingClassList.remove.apply(removingClassList, togglingClasses);
    addingClassList.add.apply(addingClassList, togglingClasses);
  }

  _startFrameLoop() {
    // Add the CSS classes on the current element.
    this._addClassesOnCurrentEl();

    // Then, fire the requestAnimationFrame loop.
    this._loop(new Date().getTime());
  }

  _loop(currentTime) {
    const delta = new Date().getTime() - currentTime;

    if (delta >= this._intervalDuration) {
      // Perform the iteration step if the interval duration has elapsed.
      this._performIterationStep();
      currentTime += this._intervalDuration;

      // Subtract from the timeout duration if it exists.
      if (this._timeoutDuration) {
        this._timeoutDuration -= this._intervalDuration;

        if (this._timeoutDuration <= 0) {
          this.stop();
        }
      }
    }

    if (!this._halted) {
      this._scheduledFrame =
        window.requestAnimationFrame(this._loop.bind(this, currentTime));
    }
  }

  _performIterationStep() {
    this._invokeClassSwitch();
    this._cycleIdx = this._determineNextIdx();

    if (isFunction(this._additionalCallback)) {
      this._additionalCallback();
    }
  }

  _invokeClassSwitch() {
    if (isArray(this._cycleCallback)) {
      this._invokeEachCycleCallback();
    } else {
      this._cycleCallback();
    }
  }

  _invokeEachCycleCallback() {
    this._cycleCallback.forEach((callback) => { callback(); });
  }

  _determineNextIdx() {
    return (((this._cycleIdx + this._stepDistance) % this._elementCount) +
      this._elementCount) % this._elementCount;
  }

  _affectCurrentEl(addOrRemoveClassesOn) {
    if (isArray(this._switchObj)) {
      this._addOrRemoveClassesOnEach(addOrRemoveClassesOn);
    } else {
      addOrRemoveClassesOn(this._switchObj.elements[this._cycleIdx],
        this._switchObj.togglingClasses);
    }
  }

  _addOrRemoveClassesOnEach(addOrRemoveClassesOn) {
    this._switchObj.forEach((cycleObj) => {
      addOrRemoveClassesOn(cycleObj.elements[this._cycleIdx],
        cycleObj.togglingClasses);
    });
  }

  _removeClassesOnCurrentEl() {
    this._affectCurrentEl((element, togglingClasses) => {
      element.classList.remove.apply(element.classList, togglingClasses);
    });
  }

  _addClassesOnCurrentEl() {
    this._affectCurrentEl((element, togglingClasses) => {
      element.classList.add.apply(element.classList, togglingClasses);
    });
  }

  _removeListenersOnHosts() {
    const events = ['mouseover', 'mouseout'];
    let listenerIdx = 0;

    this._listenerHosts.forEach((hostSet) => {
      hostSet.forEach((host, idx) => {
        events.forEach((event) => {
          host.removeEventListener(event,
            this._handlerRegistry.mouse[listenerIdx], false);
          listenerIdx++;
        });
      });
    });
  }

  _removeListenersOnWindow() {
    const event = this._hasVisibilityChangeEvent() ? 'visibilitychange' :
      ['blur', 'focus'];

    if (isArray(event)) {
      this._deregisterEachEventListener(event);
    } else {
      this._deregisterEventListener(event);
    }
  }

  _deregisterEachEventListener(eventTypes) {
    eventTypes.forEach((eventType) => {
      this._deregisterEventListener(eventType);
    });
  }

  _deregisterEventListener(eventType) {
    window.removeEventListener(eventType, this._handlerRegistry[eventType],
      false);
  }

  run() {
    if (this._switchObj && this._halted) {
      // Establish the callback(s) to invoke on every interval of the cycle.
      this._addListenersOnHosts();
      this._addListenersOnWindow();
      this._unhalt();
      this._establishCycleCallback();
      this._startFrameLoop();
    }
  }

  stop() {
    if (!this._halted) {
      this._halt();
      this._removeClassesOnCurrentEl();
      this._removeListenersOnHosts();
      this._removeListenersOnWindow();
    }
  }
}
