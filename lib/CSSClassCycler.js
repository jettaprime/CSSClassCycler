(function(w, d) {
  var ClassCycler = w.ClassCycler = function(scope, switchMacro, config) {
    // Set operational states.
    this._halted = false;

    // Configure.
    this._setupConfig(config);

    // Determine the listener host elements from the parent element.
    this._handlerRegistry = {};
    this._parentEl = this._setParentEl(scope);
    this._listenerHosts = this._setListenerHosts(scope);

    // Process the macro(s) into a switch object(s).
    this._switchObj = this._produceSwitchObj(switchMacro);
  };

  ClassCycler.DefaultIntervalDuration = 1000;

  ClassCycler.DefaultTimeoutDuration = 30000;

  if (!isFunction(Number.prototype.isWhole)) {
    Number.prototype.isWhole = function() {
      return Number.isInteger(this) && this >= 0;
    };
  }

  ClassCycler.prototype._setupConfig = function(config) {
    if (config) {
      this._cycleIdx = config.startIdx.isWhole() ? config.startIdx : 0;
      this._intervalDuration = config.intervalDuration.isWhole() ?
        config.intervalDuration : ClassCycler.DefaultIntervalDuration;
      this._timeoutDuration = config.timeoutDuration !== undefined ?
        config.timeoutDuration : ClassCycler.DefaultTimeoutDuration;
      this._setStepDistance(config);
      this._additionalCallback = config.additionalCallback;
    }
  };

  ClassCycler.prototype._setStepDistance = function(config) {
    var direction = config.reverseDirection ? -1 : 1;
    var distance = config.stepDistance ? config.stepDistance : 1;
    this._stepDistance = direction * distance;
  };

  ClassCycler.prototype._setParentEl = function(scope) {
    switch (scope && true) {
      case (isArray(scope)):
        return scope.filter(function(locator) { return locator.main; });
      case (isString(scope)):
        return d.querySelector('.' + scope);
      case (isElement(scope)):
        return scope;
      default:
        return scope.parentEl;
    }
  };

  function isArray(arrayOrNot) {
    return arrayOrNot instanceof Array;
  }

  ClassCycler.prototype._setListenerHosts = function(scope) {
    switch (scope && true) {
      case (isArray(scope)):
        return this._categorizeHosts(scope);
      case (isString(scope)):
        return [Array.prototype.slice.call(this._parentEl.children, 0)];
      default:
        return [Array.prototype.slice.call(this._designateHostSet(scope))];
    }
  };

  ClassCycler.prototype._categorizeHosts = function(scope) {
    return scope.map(function(locator) {
      return Array.prototype.slice.call(this._designateHostSet(locator), 0);
    }.bind(this));
  };

  ClassCycler.prototype._designateHostSet = function(locator) {
    var parentEl;

    switch (locator && true) {
      case (isElement(locator.parentEl)):
        parentEl = locator.parentEl;
        break;
      case (isString(locator.parentEl)):
        parentEl = d.querySelector('.' + locator.parentEl);
        break;
      default:
        return locator.children;
    }

    return parentEl.getElementsByClassName(locator.listenerHost);
  };

  function isElement(elementOrNot) {
    return elementOrNot instanceof Element;
  }

  function isString(stringOrNot) {
    return typeof stringOrNot === 'string';
  }

  ClassCycler.prototype._buildHandler = function(eventType, idx) {
    return ClassCycler.EventHandlers[eventType].bind(this, idx);
  };

  ClassCycler.prototype._mouseoverHandler = function(idx) {
    if (!this._halted) {
      this._halt();
      this._removeClassesOnCurrentEl();
      this._cycleIdx = idx;
      this._addClassesOnCurrentEl();
    }
  };

  ClassCycler.prototype._mouseoutHandler = function(idx) {
    if (this._halted) {
      this._resume();
      this._cycleIdx = idx;
      this._startFrameLoop();
    }
  };

  ClassCycler.prototype._blurHandler = function() {
    if (!this._halted) {
      this._halt();
      this._removeClassesOnCurrentEl();
    }
  };

  ClassCycler.prototype._focusHandler = function() {
    if (this._halted) {
      this._resume();
      this._addClassesOnCurrentEl();
      this._startFrameLoop();
    }
  };

  ClassCycler.prototype._visibilityHandler = function() {
    if (d.hidden) {
      this._blurHandler();
    } else {
      this._focusHandler();
    }
  };

  ClassCycler.EventHandlers = {
    'blur': ClassCycler.prototype._blurHandler,
    'focus': ClassCycler.prototype._focusHandler,
    'mouseout': ClassCycler.prototype._mouseoutHandler,
    'mouseover': ClassCycler.prototype._mouseoverHandler,
    'visibilitychange': ClassCycler.prototype._visibilityHandler
  };

  ClassCycler.prototype._produceSwitchObj = function(macro) {
    var switchObj;

    if (isArray(macro)) {
      switchObj = [];
      macro.forEach(function(macro) {
        switchObj.push(this._processMacro(macro));
      }.bind(this));
    } else {
      switchObj = this._processMacro(macro);
    }

    return switchObj;
  };

  ClassCycler.prototype._processMacro = function(macro) {
    var parentEl, elements, togglingClasses;
    switch (macro && true) {
      case (isString(macro)):
        parentEl = this._parentEl;
        elements = parentEl.children;
        togglingClasses = macro.split(' ');
        break;
      case (isString(macro.parentEl)):
        parentEl = d.querySelector('.' + macro.parentEl);
        break;
      default:
        parentEl = macro.parentEl || this._parentEl;
    }

    if (!elements) {
      elements = parentEl.getElementsByClassName(macro.locator);
    }

    if (!togglingClasses) {
      togglingClasses = macro.toggle.split(' ');
    }

    return { elements: elements, togglingClasses: togglingClasses };
  };

  ClassCycler.prototype._addListenersOnHosts = function() {
    var events = ['mouseover', 'mouseout'];
    var listenerIdx = 0;

    this._listenerHosts.forEach(function(hostSet) {
      hostSet.forEach(function(host, idx) {
        events.forEach(function(e) {
          this._handlerRegistry.mouse = this._handlerRegistry.mouse || [];
          this._handlerRegistry.mouse.push(this._buildHandler(e, idx));
          host.addEventListener(e, this._handlerRegistry.mouse[listenerIdx],
            false);
          listenerIdx++;
        }.bind(this));
      }.bind(this));
    }.bind(this));
  };

  ClassCycler.prototype._addListenersOnWindow = function() {
    var events = hasVisibilityChangeEvent() ? ['visibilitychange'] :
      ['blur', 'focus'];

    events.forEach(function(event) {
      this._handlerRegistry[event] =
        ClassCycler.EventHandlers[event].bind(this);
      w.addEventListener(event, this._handlerRegistry[event], false);
    }.bind(this));
  };

  ClassCycler.prototype._halt = function() {
    w.cancelAnimationFrame(this._scheduledFrame);
    this._halted = true;
  };

  ClassCycler.prototype._unhalt = ClassCycler.prototype._resume = function() {
    this._halted = false;
  };

  ClassCycler.prototype._establishCycleCallback = function() {
    if (isArray(this._switchObj)) {
      return this._switchObj.map(function(switchObj) {
        return this._buildCallback(switchObj);
      }.bind(this));
    } else {
      return this._buildCallback(this._switchObj);
    }
  };

  ClassCycler.prototype._buildCallback = function(switchObj) {
    this._elementCount = this._elementCount || switchObj.elements.length;
    return this._switchClass.bind(this, switchObj);
  };

  ClassCycler.prototype._switchClass = function(switchObj) {
    var togglingClasses = switchObj.togglingClasses;
    var removingClassList = switchObj.elements[this._cycleIdx].classList;
    var nextIdx = this._determineNextIdx(this._cycleIdx, this._elementCount);
    var addingClassList = switchObj.elements[nextIdx].classList;
    removingClassList.remove.apply(removingClassList, togglingClasses);
    addingClassList.add.apply(addingClassList, togglingClasses);
  };

  ClassCycler.prototype._startFrameLoop = function() {
    // Add the CSS classes on the current element.
    this._addClassesOnCurrentEl();

    // Then, fire the requestAnimationFrame loop.
    this._loop(new Date().getTime());
  };

  ClassCycler.prototype._loop = function(currentTime) {
    var delta = new Date().getTime() - currentTime;

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
        w.requestAnimationFrame(this._loop.bind(this, currentTime));
    }
  };

  ClassCycler.prototype._performIterationStep = function(currentTime) {
    this._invokeClassSwitch();
    this._cycleIdx = this._determineNextIdx(this._cycleIdx, this._elementCount);
    if (isFunction(this._additionalCallback)) {
      this._additionalCallback();
    }
  };

  function isFunction(functionOrNot) {
    return functionOrNot && typeof functionOrNot === 'function';
  }

  ClassCycler.prototype._invokeClassSwitch = function() {
    if (isArray(this._cycleCallback)) {
      this._cycleCallback.forEach(function(callback) {
        callback();
      });
    } else {
      this._cycleCallback();
    }
  };

  Number.prototype.mod = function(divisor) {
    return ((this % divisor) + divisor) % divisor;
  };

  ClassCycler.prototype._determineNextIdx = function(idx, count) {
    return (idx + this._stepDistance).mod(count);
  };

  ClassCycler.prototype._affectCurrentEl = function(addOrRemoveClassesOn) {
    if (isArray(this._switchObj)) {
      this._switchObj.forEach(function(cycleObj) {
        addOrRemoveClassesOn(cycleObj.elements[this._cycleIdx],
          cycleObj.togglingClasses);
      }.bind(this));
    } else {
      addOrRemoveClassesOn(this._switchObj.elements[this._cycleIdx],
        this._switchObj.togglingClasses);
    }
  };

  ClassCycler.prototype._removeClassesOnCurrentEl = function() {
    this._affectCurrentEl(function(element, togglingClasses) {
      element.classList.remove.apply(element.classList, togglingClasses);
    });
  };

  ClassCycler.prototype._addClassesOnCurrentEl = function() {
    this._affectCurrentEl(function(element, togglingClasses) {
      element.classList.add.apply(element.classList, togglingClasses);
    });
  };

  ClassCycler.prototype._removeListenersOnHosts = function() {
    var events = ['mouseover', 'mouseout'];
    var listenerIdx = 0;

    this._listenerHosts.forEach(function(hostSet) {
      hostSet.forEach(function(host, idx) {
        events.forEach(function(e) {
          host.removeEventListener(e, this._handlerRegistry.mouse[listenerIdx],
            false);
          listenerIdx++;
        }.bind(this));
      }.bind(this));
    }.bind(this));
  };

  ClassCycler.prototype._removeListenersOnWindow = function() {
    var events = hasVisibilityChangeEvent() ? ['visibilitychange'] :
      ['blur', 'focus'];

    events.forEach(function(event) {
      w.removeEventListener(event, this._handlerRegistry[event], false);
    }.bind(this));
  };

  function hasVisibilityChangeEvent() {
    return 'hidden' in d;
  }

  ClassCycler.prototype.run = function() {
    // Establish the callback(s) to invoke on every interval of the ClassCycler.
    this._addListenersOnHosts();
    this._addListenersOnWindow();
    this._unhalt();
    this._cycleCallback = this._establishCycleCallback();
    this._startFrameLoop();
  };

  ClassCycler.prototype.stop = function() {
    this._halt();
    this._removeClassesOnCurrentEl();
    this._removeListenersOnHosts();
    this._removeListenersOnWindow();
  };
})(window, document);
