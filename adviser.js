/*
 * adviser.js - simple configurable client-side input validation library.
 */
(function($, root) {
  "use strict";

  function validate(event, form, options) {
    var f_opt = options.fields[event.target.name],
        is_live = event.type === 'keyup';

    // bail if live_validation is not enabled as soon as possible
    if (is_live && !f_opt.live_validation) return;

    var msg = null,
        type = null,
        field = $(event.target),
        required = !!field.attr('required'),
        equals = f_opt.equals,
        val = field.val(),
        pattern = options.patterns[f_opt.pattern];

    // check custom validator first if it's defined
    if ($.isFunction(f_opt.validator)) {
      msg = f_opt.validator.call(field, val, required, form, options);
      type = 'custom';
    }

    // check equals validator
    if (!msg && equals) {
      var v = equals[0] === '#' ? form.find(equals) : form.find(':input[name="' + equals + '"]').val();
      if (v !== val) {
        msg = f_opt.equals_message.replace('%s', equals);
        type = 'equals';
      }
    }

    // check pattern match
    if (!msg && pattern && !pattern.test(val)) {
      msg = f_opt.pattern_message;
      type = 'pattern';
    }

    // only check required on non-live events
    if (!msg && !is_live && required && !val) {
      msg = f_opt.required_message;
      type = 'required';
    }

    // if validation failed in someway, call the set_field_error function and
    // trigger the 'invalid.advise' event on the field (which bubble up to the
    // form and above)
    if (msg) {
      var err = {msg: msg, type: type, is_live: is_live};
      field.trigger('invalid.advise', [field, err, form, options]);
      $.fn.advise.set_field_error.call(field, err, form, options);
    }
    // otherwise, call the clear_field_error function and trigger the
    // 'valid.advise' event on the fiel
    else {
      field.trigger('valid.advise', [field, form, options]);
      $.fn.advise.clear_field_error.call(field, form, options);
    }
  }

  function build_field_options(fields, options) {
    var f_opts = {};
    fields.each(function() {
      var pattern = $(this).data('pattern');
      f_opts[this.name] = $.extend({}, options.all, options.fields[this.name]);
      if (pattern) {
        f_opts[this.name].patterns = pattern;
      }
    });
    return f_opts;
  }

  //
  // This is the advise jQuery plugin. Use it to activate client-side validation
  // on a form element using a jQuery expression such as:
  //
  // $('.my-form-class').advise();
  //
  $.fn.advise = function(options) {
    var opts = $.extend(true, {}, $.fn.advise.defaults, options);
    var form = this;
    var fields = form.find('input, textarea, select').not(':hidden, [data-advise-ignore]');
    var timers = {};

    opts.fields = build_field_options(fields, opts);

    form.attr('novalidate', 'novalidate').off('.advise');
    fields
      .off('.advise')
      .on('blur.advise change.advise keyup.advise', function(e) {
        var n = e.target.name;
        root.clearTimeout(timers[n]);
        timers[n] = root.setTimeout(function() {
          validate(e, form, opts);
        }, opts.timeout);
      });

    return this;
  };

  //
  // This function is called when a field fails validation. Override this to
  // provide custom error message rendering.
  //
  // 'this' is the field jQuery object that failed validation
  //
  $.fn.advise.set_field_error = function(err, form, options) {
    window.console.log(this.attr('name'), 'invalid', err.msg);
  };

  //
  // This function is called when a field is valid.
  //
  // 'this' is the field jQuery object that failed validation
  //
  $.fn.advise.clear_field_error = function(form, options) {
    window.console.log(this.attr('name'), 'valid');
  };

  $.fn.advise.defaults = {
    // Number of miliseconds until validation is applied
    timeout: 1000,

    // Options can be specified per-field in the option
    fields: {},

    // This provides default options for all fields
    all: {
      // Enable live validation per-field
      live_validation: false,

      // Named regex pattern to match against, this can also be specified on
      // an element using a data attribute
      pattern: null,

      // Can either be the name or the id (an id must start with a #) of another
      // field that this should equal to
      equals: null,

      // Error messages to display
      required_message: 'This field is required',
      pattern_message: 'This field is invalid',
      equals_message: 'This field must match the %s field',

      // Custom validator function
      validator: null
    },

    patterns : {
      alpha : /^[a-zA-Z]+$/,
      alpha_numeric : /^[a-zA-Z0-9]+$/,
      integer : /^[-+]?\d+$/,
      number : /^[-+]?\d*(?:[\.\,]\d+)?$/,

      // http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#valid-e-mail-address
      email : /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,

      // http://blogs.lse.ac.uk/lti/2008/04/23/a-regular-expression-to-match-any-url/
      url: /^(https?|ftp|file|ssh):\/\/([-;:&=\+\$,\w]+@{1})?([-A-Za-z0-9\.]+)+:?(\d+)?((\/[-\+~%\/\.\w]+)?\??([-\+=&;%@\.\w]+)?#?([\w]+)?)?/,

      // abc.de
      domain : /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,8}$/,

      datetime : /^([0-2][0-9]{3})\-([0-1][0-9])\-([0-3][0-9])T([0-5][0-9])\:([0-5][0-9])\:([0-5][0-9])(Z|([\-\+]([0-1][0-9])\:00))$/,

      // YYYY-MM-DD
      date : /(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31))$/,

      // HH:MM:SS
      time : /^(0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9]){2}$/,

      // YYYY/MM/DD
      dateISO : /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/,

      // MM/DD/YYYY
      month_day_year : /^(0[1-9]|1[012])[- \/.](0[1-9]|[12][0-9]|3[01])[- \/.]\d{4}$/,

      // DD/MM/YYYY
      day_month_year : /^(0[1-9]|[12][0-9]|3[01])[- \/.](0[1-9]|1[012])[- \/.]\d{4}$/,

      // #FFF or #FFFFFF
      color : /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/
    }
  };

  $(function() {
    //
    // Forms marked with data-advise will automatically have the advise plugin
    // activated.
    //
    $('[data-advise]').each(function() {
      $(this).advise();
    });
  });

})(jQuery, window);