var whichTransitionEvent = require('../../../../src/js/utils/which-transition-event');

module.exports = Em.Mixin.create({
    classNameBindings: ['error:has-error'],
    
    value: null,
    
    record: null,
    
    name: null,

    error: null,
    
    hasFocus: null,

    valueDidChange: function() {
        var record = this.get('record');
        if (record && !record.get('isDestroyed')) {
            if (record.get('errors')) {
                record.set('errors.'+this.get('name'), null);
            }
            record.set('error', null);
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
            r.off('didValidate', this, this.highlightError);
            this._recordValueBinding.disconnect(this);
            this._recordErrorBinding.disconnect(this);
        }
    }.observesBefore('record'),

    recordDidChange: function() {
        var r = this.get('record');
        if (r) {
            r.on('didValidate', this, this.highlightError);
            this._recordValueBinding = this.bind('value', 'record.'+ this.get('name'));
            this._recordErrorBinding = this.bind('error', 'record.errors.'+this.get('name'));
        }
    }.observes('record').on('init'),

    highlightError: function() {
        if (this.get('record.errors.'+this.get('name'))) {
            var el = this.$();
            el.addClass('has-error-highlight');
            el.one(whichTransitionEvent(), function() {
                el.removeClass('has-error-highlight');
            });
        }
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
        this.container.lookup('util:tooltip')[scheduled ? 'scheduleShow' : 'show'](this, this.get('error'), 'topLeft');
    }
});