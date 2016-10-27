(function(w) {
  var ClassCycler = w.ClassCycler = function(scope, switchMacro, config) {
    this._timedOut = false;
    this._setIntervalId = null;
    this._switchMacro = switchMacro;
    this._handlerRegistry = {};

    this._setupConfig(config);
    this._parentEl = this._setParentEl(scope);
    this._listenerHosts = this._setListenerHosts(scope);
    this._addListenersOnHosts();
    this._processedSwitchObj = this._processSwitchObj();
  };

  ClassCycler.DefaultIntervalDuration = 1000;

  ClassCycler.DefaultTimeoutDuration = 30000;

  ClassCycler.prototype._setupConfig = function(config) {
    this._cycleIdx = config && config.startIdx ?
      config.startIdx : 0;
    this._intervalDuration = config && config.intervalDuration ?
      config.intervalDuration : ClassCycler.DefaultIntervalDuration;
    this._timeoutDuration = config && config.timeoutDuration !== undefined ?
      config.timeoutDuration : ClassCycler.DefaultTimeoutDuration;
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

  ClassCycler.prototype._addListenersOnHosts = function() {
    var events = ['mouseover', 'mouseout'];

    this._listenerHosts.forEach(function(hostSet) {
      hostSet.forEach(function(host, idx) {
        events.forEach(function(e) {
          host.addEventListener(e, this._buildHandler(idx), false);
        }.bind(this));
      }.bind(this));
    }.bind(this));
  };

  ClassCycler.prototype._buildHandler = function(idx) {
    return function(e) {
      if (!this._timedOut) {
        if (e.type === 'mouseover') {
          this._haltCycle();
          this._removeClassesOnCurrentEl();
          this._cycleIdx = idx;
          this._addClassesOnCurrentEl();
        }

        if (e.type === 'mouseout') {
          this._cycleIdx = idx;
          this._startSetInterval();
        }
      } else {
        this._removeClassesOnCurrentEl();
      }
    }.bind(this);
  };

  ClassCycler.prototype._processSwitchObj = function() {
    var processedSwitchObj;

    if (this._switchMacro instanceof Array) {
      processedSwitchObj = [];
      this._switchMacro.forEach(function(macro) {
        processedSwitchObj.push(this._processSwitchObjFrom(macro));
      }.bind(this));
    } else {
      processedSwitchObj = this._processSwitchObjFrom(this._switchMacro);
    }

    return processedSwitchObj;
  };

  ClassCycler.prototype._processSwitchObjFrom = function(macro) {
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

  ClassCycler.prototype.run = function() {
    // Establish the callback(s) to invoke on every iteration of the ClassCycler.
    this._cycleCallback = this._establishCycleCallback();
    this._startSetInterval();
    if (this._timeoutDuration !== null) {
      this._startSetTimeout();
    }
  };

  ClassCycler.prototype._establishCycleCallback = function() {
    if (this._processedSwitchObj instanceof Array) {
      return this._processedSwitchObj.map(function(switchObj) {
        return this._buildCallback(switchObj);
      }.bind(this));
    } else {
      return this._buildCallback(this._processedSwitchObj);
    }
  };

  ClassCycler.prototype._buildCallback = function(switchObj) {
    this._elementCount = this._elementCount || switchObj.elements.length;
    return this._switchClass.bind(this, switchObj);
  };

  ClassCycler.prototype._switchClass = function(switchObj) {
    var togglingClasses = switchObj.togglingClasses;
    var removingClassList = switchObj.elements[this._cycleIdx].classList;
    var addingClassList = switchObj.elements[(this._cycleIdx + 1) % switchObj.elements.length].classList;
    removingClassList.remove.apply(removingClassList, togglingClasses);
    addingClassList.add.apply(addingClassList, togglingClasses);
  };

  ClassCycler.prototype._startSetInterval = function() {
    // Add the CSS classes on the current element.
    this._addClassesOnCurrentEl();

    // Then, fire the setInterval.
    this._setIntervalId = w.setInterval(function() {
      if (this._timedOut) {
        this._haltCycle();
      } else {
        this._invokeClassSwitch();
        this._incrementCycleIdx();
      }
    }.bind(this), this._intervalDuration);
  };

  ClassCycler.prototype._addClassesOnCurrentEl = function() {
    this._affectCurrentEl(function(element, togglingClasses) {
      element.classList.add.apply(element.classList, togglingClasses);
    });
  };

  ClassCycler.prototype._affectCurrentEl = function(addOrRemoveClassesOn) {
    if (this._processedSwitchObj instanceof Array) {
      this._processedSwitchObj.forEach(function(cycleObj) {
        addOrRemoveClassesOn(cycleObj.elements[this._cycleIdx], cycleObj.togglingClasses);
      }.bind(this));
    } else {
      addOrRemoveClassesOn(this._processedSwitchObj.elements[this._cycleIdx], this._processedSwitchObj.togglingClasses);
    }
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

  ClassCycler.prototype._incrementCycleIdx = function() {
    if (this._elementCount > 1) {
      this._cycleIdx = (this._cycleIdx + 1) % this._elementCount;
    }
  };

  ClassCycler.prototype._startSetTimeout = function() {
    w.setTimeout(function() {
      this._timedOut = true;
      this._haltCycle();
      this._removeClassesOnCurrentEl();
      this._removeListenersOnHosts();
    }.bind(this), this._timeoutDuration);
  };

  ClassCycler.prototype._haltCycle = function() {
    if (this._setIntervalId) {
      w.clearInterval(this._setIntervalId);
      this._setIntervalId = null;
    }
  };

  ClassCycler.prototype._removeClassesOnCurrentEl = function() {
    this._affectCurrentEl(function(element, togglingClasses) {
      element.classList.remove.apply(element.classList, togglingClasses);
    });
  };

  ClassCycler.prototype._removeListenersOnHosts = function() {
    var events = ['mouseover', 'mouseout'];

    this._listenerHosts.forEach(function(hostSet) {
      hostSet.forEach(function(host, idx) {
        events.forEach(function(e) {
          host.addEventListener(e, this._buildHandler(idx), false);
        }.bind(this));
      }.bind(this));
    }.bind(this));
  };
})(window);
