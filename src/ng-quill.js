var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['quill'], factory)
  } else if (typeof module !== 'undefined' && typeof exports === 'object') {
    module.exports = factory(require('quill'))
  } else {
    root.Requester = factory(root.Quill)
  }
}(this, function (Quill) {
  'use strict'

  var app
  // declare ngQuill module
  app = angular.module('ngQuill', [])

  app.provider('ngQuillConfig', function () {
    var config = {
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
          ['blockquote', 'code-block'],

          [{ 'header': 1 }, { 'header': 2 }],               // custom button values
          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
          [{ 'script': 'sub' }, { 'script': 'super' }],      // superscript/subscript
          [{ 'indent': '-1' }, { 'indent': '+1' }],          // outdent/indent
          [{ 'direction': 'rtl' }],                         // text direction

          [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
          [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

          [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
          [{ 'font': [] }],
          [{ 'align': [] }],

          ['clean'],                                         // remove formatting button

          ['link', 'image', 'video']                         // link and image, video
        ]
      },
      theme: 'snow',
      placeholder: 'Insert text here ...',
      readOnly: false,
      bounds: document.body
    }

    this.set = function (customConf) {
      customConf = customConf || {}

      if (customConf.modules) {
        config.modules = customConf.modules
      }
      if (customConf.theme) {
        config.theme = customConf.theme
      }
      if (customConf.placeholder !== null && customConf.placeholder !== undefined) {
        config.placeholder = customConf.placeholder.trim()
      }
      if (customConf.bounds) {
        config.bounds = customConf.bounds
      }
      if (customConf.readOnly) {
        config.readOnly = customConf.readOnly
      }
      if (customConf.formats) {
        config.formats = customConf.formats
      }
    }

    this.$get = function () {
      return config
    }
  })

  app.component('ngQuillEditor', {
    bindings: {
      'modules': '<modules',
      'theme': '@?',
      'readOnly': '<?',
      'formats': '<?',
      'placeholder': '@?',
      'bounds': '<?',
      'onEditorCreated': '&?',
      'onContentChanged': '&?',
      'onSelectionChanged': '&?',
      'ngModel': '<',
      'maxLength': '<',
      'minLength': '<'
    },
    require: {
      ngModelCtrl: 'ngModel'
    },
    transclude: {
      'toolbar': '?ngQuillToolbar'
    },
    template: '<div class="ng-hide" ng-show="$ctrl.ready"><ng-transclude ng-transclude-slot="toolbar"></ng-transclude></div>',
    controller: ['$scope', '$element', '$timeout', '$transclude', 'ngQuillConfig', function ($scope, $element, $timeout, $transclude, ngQuillConfig) {
      var config = {}
      var content
      var editorElem
      var modelChanged = false
      var editorChanged = false
      var editor
      var placeholder = ngQuillConfig.placeholder

      this.validate = function (text) {
        if (this.maxLength) {
          if (text.length > this.maxLength + 1) {
            this.ngModelCtrl.$setValidity('maxlength', false)
          } else {
            this.ngModelCtrl.$setValidity('maxlength', true)
          }
        }

        if (this.minLength > 1) {
          // validate only if text.length > 1
          if (text.length <= this.minLength && text.length > 1) {
            this.ngModelCtrl.$setValidity('minlength', false)
          } else {
            this.ngModelCtrl.$setValidity('minlength', true)
          }
        }
      }

      this.$onChanges = function (changes) {
        if (changes.ngModel && changes.ngModel.currentValue !== changes.ngModel.previousValue) {
          if(!changes.ngModel.previousValue || (editor && editor.hasFocus())) {
            content = changes.ngModel.currentValue
          }

          if (editor && !editorChanged) {
            modelChanged = true
            if (content) {
              editor.setContents(editor.clipboard.convert(content))
            } else {
              editor.setText('')
            }
          }
          editorChanged = false
        }

        if (editor && changes.readOnly) {
          editor.enable(!changes.readOnly.currentValue)
        }
      }

      this.$onInit = function () {
        if (this.placeholder !== null && this.placeholder !== undefined) {
          placeholder = this.placeholder.trim()
        }

        config = {
          theme: this.theme || ngQuillConfig.theme,
          readOnly: this.readOnly || ngQuillConfig.readOnly,
          modules: this.modules || ngQuillConfig.modules,
          formats: this.formats || ngQuillConfig.formats,
          placeholder: placeholder,
          bounds: this.bounds || ngQuillConfig.bounds
        }
      }

      this.$postLink = function () {
        // create quill instance after dom is rendered
        $timeout(function () {
          this._initEditor(editorElem)
        }.bind(this), 0)
      }

      this._initEditor = function (editorElem) {
        var $editorElem = angular.element('<div></div>')
        var container = $element.children()

        editorElem = $editorElem[0]

        // set toolbar to custom one
        if ($transclude.isSlotFilled('toolbar')) {
          config.modules.toolbar = container.find('ng-quill-toolbar').children()[0]
        }

        container.append($editorElem)

        var Embed = Quill.import('blots/block/embed');

        var Hr = function (_Embed) {
          _inherits(Hr, _Embed);

          function Hr() {
            _classCallCheck(this, Hr);

            return _possibleConstructorReturn(this, (Hr.__proto__ || Object.getPrototypeOf(Hr)).apply(this, arguments));
          }

          _createClass(Hr, null, [{
            key: 'create',
            value: function create(value) {
              var node = _get(Hr.__proto__ || Object.getPrototypeOf(Hr), 'create', this).call(this, value);
              // give it some margin
              node.setAttribute('style', "height:0px; margin-top:10px; margin-bottom:10px;");
              return node;
            }
          }]);

          return Hr;
        }(Embed);

        Hr.blotName = 'hr'; //now you can use .ql-hr classname in your toolbar
        Hr.className = 'my-hr';
        Hr.tagName = 'hr';

        var customHrHandler = function customHrHandler() {
          // get the position of the cursor
          var range = editor.getSelection();
          if (range && editor.hasFocus()) {
            // insert the <hr> where the cursor is
            editor.insertEmbed(range.index, "hr", "null");
          }
        };

        Quill.register({
          'formats/hr': Hr
        });

        config.modules.toolbar.handlers = {
          'hr': customHrHandler,
          undo: function undo(value) {
            editor.history.undo();
          },
          redo: function redo(value) {
            editor.history.redo();
          }
        };

        editor = new Quill(editorElem, config)

        this.ready = true

        // mark model as touched if editor lost focus
        editor.on('selection-change', function (range, oldRange, source) {
          if (this.onSelectionChanged) {
            this.onSelectionChanged({
              editor: editor,
              oldRange: oldRange,
              range: range,
              source: source
            })
          }

          if (range) {
            return
          }
          $scope.$applyAsync(function () {
            this.ngModelCtrl.$setTouched()
          }.bind(this))
        }.bind(this))

        // update model if text changes
        editor.on('text-change', function (delta, oldDelta, source) {
          var html = editorElem.children[0].innerHTML
          var text = editor.getText()

          if (html === '<p><br></p>') {
            html = null
          }
          this.validate(text)

          if (!modelChanged) {
            $scope.$applyAsync(function () {
              editorChanged = true

              this.ngModelCtrl.$setViewValue(html)

              if (this.onContentChanged) {
                this.onContentChanged({
                  editor: editor,
                  html: html,
                  text: text,
                  delta: delta,
                  oldDelta: oldDelta,
                  source: source
                })
              }
            }.bind(this))
          }
          modelChanged = false
        }.bind(this))

        // set initial content
        if (content) {
          modelChanged = true

          var contents = editor.clipboard.convert(content)
          editor.setContents(contents)
          editor.history.clear()
        }

        // provide event to get informed when editor is created -> pass editor object.
        if (this.onEditorCreated) {
          this.onEditorCreated({editor: editor})
        }
      }
    }]
  })

  return app.name
}))
