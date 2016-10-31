(function(w) {
  var ClassCycler = w.ClassCycler = function(scope, switchMacro, config) {
    // Set operational states.
    this._halted = false;

    // Configure.
    this._setupConfig(config);

    // Determine the listener host elements from the parent element.
    this._handlerRegistry = [];
    this._parentEl = this._setParentEl(scope);
    this._listenerHosts = this._setListenerHosts(scope);

    // Process the macro(s) into a switch object(s).
    this._switchObj = this._produceSwitchObj(switchMacro);
  };

  ClassCycler.DefaultIntervalDuration = 1000;

  ClassCycler.DefaultTimeoutDuration = 30000;

  Number.prototype.isWhole = function() {
    return Number.isInteger(this) && this >= 0;
  };

  ClassCycler.prototype._setupConfig = function(config) {
    if (config) {
      this._cycleIdx = config.startIdx.isWhole() ? config.startIdx : 0;
      this._intervalDuration = config.intervalDuration.isWhole() ?
        config.intervalDuration : ClassCycler.DefaultIntervalDuration;
      this._timeoutDuration = config.timeoutDuration !== undefined ?
        config.timeoutDuration : ClassCycler.DefaultTimeoutDuration;
      this._setStepDistance(config);
    }
  };

  ClassCycler.prototype._setStepDistance = function(config) {
    var direction = config.reverseDirection ? -1 : 1;
    var distance = config.stepDistance ? config.stepDistance : 1;
    this._stepDistance = direction * distance;
  };

  ClassCycler.prototype._setParentEl = function(scope) {
    switch (scope && true) {
      case (scope instanceof Array):
        return scope.filter(function(locator) { return locator.main; });
      case (typeof scope === 'string'):
        return document.querySelector('.' + scope);
      case (scope instanceof Element):
        return scope;
      default:
        return scope.parentEl;
    }
  };

  ClassCycler.prototype._setListenerHosts = function(scope) {
    switch (scope && true) {
      case (scope instanceof Array):
        return this._categorizeHosts(scope);
      case (typeof scope === 'string'):
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
      case (locator.parentEl instanceof Element):
        parentEl = locator.parentEl;
        break;
      case (typeof locator.parentEl === 'string'):
        parentEl = document.querySelector('.' + locator.parentEl);
        break;
      default:
        return locator.children;
    }

    return parentEl.getElementsByClassName(locator.listenerHost);
  };

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

  ClassCycler.EventHandlers = {
    'mouseover': ClassCycler.prototype._mouseoverHandler,
    'mouseout': ClassCycler.prototype._mouseoutHandler,
    'blur': ClassCycler.prototype._blurHandler,
    'focus': ClassCycler.prototype._focusHandler
  };

  ClassCycler.prototype._produceSwitchObj = function(macro) {
    var switchObj;

    if (macro instanceof Array) {
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
      case (typeof macro === 'string'):
        parentEl = this._parentEl;
        elements = parentEl.children;
        togglingClasses = macro.split(' ');
        break;
      case (typeof macro.parentEl === 'string'):
        parentEl = document.querySelector('.' + macro.parentEl);
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
          this._handlerRegistry.push(this._buildHandler(e, idx));
          host.addEventListener(e, this._handlerRegistry[listenerIdx], false);
          listenerIdx++;
        }.bind(this));
      }.bind(this));
    }.bind(this));
  };

  ClassCycler.prototype._addListenersOnWindow = function() {
    var blurHandlerIdx = this._handlerRegistry.length;
    var focusHandlerIdx = blurHandlerIdx + 1;

    this._handlerRegistry.push(ClassCycler.EventHandlers.blur.bind(this));
    w.addEventListener('blur', this._handlerRegistry[blurHandlerIdx], false);

    this._handlerRegistry.push(ClassCycler.EventHandlers.focus.bind(this));
    w.addEventListener('focus', this._handlerRegistry[focusHandlerIdx], false);
  };

  ClassCycler.prototype._halt = function() {
    this._halted = true;
  };

  ClassCycler.prototype._unhalt = ClassCycler.prototype._resume = function() {
    this._halted = false;
  };

  ClassCycler.prototype._establishCycleCallback = function() {
    if (this._switchObj instanceof Array) {
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
      // Perform the iteration if the interval duration has elapsed.
      this._performIteration();
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
      w.requestAnimationFrame(this._loop.bind(this, currentTime));
    }
  };

  ClassCycler.prototype._performIteration = function(currentTime) {
    this._invokeClassSwitch();
    this._cycleIdx = this._determineNextIdx(this._cycleIdx, this._elementCount);
  };

  ClassCycler.prototype._invokeClassSwitch = function() {
    if (this._cycleCallback instanceof Array) {
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
    if (this._switchObj instanceof Array) {
      this._switchObj.forEach(function(cycleObj) {
        addOrRemoveClassesOn(cycleObj.elements[this._cycleIdx], cycleObj.togglingClasses);
      }.bind(this));
    } else {
      addOrRemoveClassesOn(this._switchObj.elements[this._cycleIdx], this._switchObj.togglingClasses);
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
          host.removeEventListener(e, this._handlerRegistry[listenerIdx], false);
          listenerIdx++;
        }.bind(this));
      }.bind(this));
    }.bind(this));
  };

  ClassCycler.prototype._removeListenersOnWindow = function() {
    var focusHandlerIdx = this._handlerRegistry.length - 1;
    var blurHandlerIdx = focusHandlerIdx - 1;

    w.removeEventListener('blur', this._handlerRegistry[blurHandlerIdx], false);
    w.removeEventListener('focus', this._handlerRegistry[focusHandlerIdx],
      false);
  };

  ClassCycler.prototype.run = function() {
    // Establish the callback(s) to invoke on every iteration of the ClassCycler.
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
})(window);
