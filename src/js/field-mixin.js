var whichTransitionEvent = require('which-transition-event'),
    firstErrorField = null;

module.exports = Em.Mixin.create({
    classNameBindings: ['error:has-error'],

    value: null,

    record: null,

    name: null,

    error: null,

    formattedError: function() {
        var error = this.get('error');
        if (Array.isArray(error)) {
            //Ember Data
            error = error
                .map(function(e) {
                    return e.message;
                })
                .join(' ');
        }
        return error;
    }.property('error'),

    hasFocus: null,

    valueDidChange: function() {
        var record = this.get('record');
        if (record && !record.get('isDestroyed')) {
            var errors = record.get('errors')
            if (errors) {
                var name = this.get('name')
                if (errors instanceof DS.Errors) {
                    //Ember Data
                    errors.remove(name)
                } else {
                    //Billy Data
                    record.set('errors.'+name, null);
                    record.set('error', null);
                }
            }
        }
    }.observes('value'),

    setupErrorMouseEvents: function() {
        var self = this;
        this.$()
            .mouseenter(function() {
                if (self.get('error')) {
                    self.showErrorTooltip(true);
                }
            })
            .mouseleave(function() {
                if (!self.get('hasFocus')) {
                    self.container.lookup('util:tooltip').scheduleHide();
                }
            });
    }.on('didInsertElement'),

    recordWillChange: function() {
        var r = this.get('record');
        if (r) {
            if (r instanceof DS.Model) {
                //Ember Data
                r.off('becameInvalid', this, this.highlightError);
            } else {
                //Billy Data
                r.off('didValidate', this, this.highlightError);
            }
            this._recordValueBinding.disconnect(this);
            this._recordErrorBinding.disconnect(this);
        }
    }.observesBefore('record'),

    recordDidChange: function() {
        var r = this.get('record');
        if (r) {
            this._recordValueBinding = this.bind('value', 'record.'+ this.get('name'));
            if (r instanceof DS.Model) {
                //Ember Data
                r.on('becameInvalid', this, this.highlightError);
                this._recordErrorBinding = Em.oneWay(this, 'error', 'record.errors.'+this.get('name'));
            } else {
                //Billy Data
                r.on('didValidate', this, this.highlightError);
                this._recordErrorBinding = this.bind('error', 'record.errors.'+this.get('name'));
            }

        }
    }.observes('record').on('init'),

    highlightError: function() {
        if (this.get('record.errors.'+this.get('name'))) {
            var el = this.$(),
                y = el.offset().top,
                x = el.offset().left,
                first$ = firstErrorField ? firstErrorField.$() : null,
                firstY = first$ ? first$.offset().top : null,
                firstX = first$ ? first$.offset().left : null;
            el.addClass('has-error-highlight');
            el.one(whichTransitionEvent(), function() {
                el.removeClass('has-error-highlight');
            });
            if (!firstErrorField) {
                firstErrorField = this;
            } else if (y === firstY && x < firstX) {
                firstErrorField = this;
            } else if (y < firstY) {
                firstErrorField = this;
            }
            if (firstErrorField) {
                Em.run.scheduleOnce('afterRender', this, this.showErrorFieldsTooltip);
            }
        }
    },

    willDestroy: function() {
        this.container.lookup('util:tooltip').hide();

        this.recordWillChange();
    },

    showErrorFieldsTooltip: function() {
        if (firstErrorField && !firstErrorField.get('isDestroying')) {
            firstErrorField.showErrorTooltip();
        }
        firstErrorField = null;
    },

    errorDidChange: function() {
        var error = this.get('error');
        if (!error) {
            this.container.lookup('util:tooltip').hide();
        }
    }.observes('error'),

    hasFocusDidChange: function() {
        if (this.get('hasFocus') && this.get('error')) {
            this.showErrorTooltip(false);
        } else {
            this.container.lookup('util:tooltip').hide();
        }
    }.observes('hasFocus'),

    showErrorTooltip: function(scheduled) {
        this.container.lookup('util:tooltip')[scheduled ? 'scheduleShow' : 'show'](this, this.get('formattedError'), 'topLeft');
    }
});
