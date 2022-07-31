(function (Editor, markdownit, WebUploader) {
  // Set default options
  var md = new markdownit();

  md.set({
    html: false, // Enable HTML tags in source
    xhtmlOut: false, // Use '/' to close single tags (<br />)
    breaks: true, // Convert '\n' in paragraphs into <br>
    langPrefix: "language-", // CSS language prefix for fenced blocks
    linkify: false, // Autoconvert URL-like text to links
    typographer: false, // Enable smartypants and other sweet transforms
  });

  window.markdowniter = md;

  var toolbar = Editor.toolbar;

  var replaceTool = function (name, callback) {
    for (var i = 0, len = toolbar.length; i < len; i++) {
      var v = toolbar[i];
      if (typeof v !== "string" && v.name === name) {
        v.action = callback;
        break;
      }
    }
  };

  var $body = $("body");

  var ToolLink = function () {
    var self = this;
    this.$win = $(
      [
        '<div class="modal fade" tabindex="-1" role="dialog" aria-labelledby="editorToolImageTitle" aria-hidden="true">',
        '<div class="modal-dialog">',
        '<div class="modal-content">',
        '<div class="modal-header">',
        '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>',
        '<h3 id="editorToolImageTitle">Add connection</h3>',
        "</div>",
        '<div class="modal-body">',
        '<form class="form-horizontal">',
        '<div class="control-group">',
        '<label class="control-label">title</label>',
        '<div class="controls">',
        '<input type="text" name="title" placeholder="Title">',
        "</div>",
        "</div>",
        '<div class="control-group">',
        '<label class="control-label">Connect</label>',
        '<div class="controls">',
        '<input type="text" name="link" value="http://" placeholder="Link">',
        "</div>",
        "</div>",
        "</form>",
        "</div>",
        '<div class="modal-footer">',
        '<button class="btn btn-primary" role="save">OK</button>',
        "</div>",
        "</div>",
        "</div>",
        "</div>",
      ].join("")
    ).appendTo($body);

    this.$win
      .on("click", "[role=save]", function () {
        self.$win.find("form").submit();
      })
      .on("submit", "form", function () {
        var $el = $(this);
        var title = $el.find("[name=title]").val();
        var link = $el.find("[name=link]").val();

        self.$win.modal("hide");
        self.editor.push(" [" + title + "](" + link + ")");

        $el.find("[name=title]").val("");
        $el.find("[name=link]").val("http://");

        return false;
      });
  };

  ToolLink.prototype.bind = function (editor) {
    this.editor = editor;
    this.$win.modal("show");
  };

  var ToolImage = function () {
    var self = this;
    this.$win = $(
      [
        '<div class="modal fade" tabindex="-1" role="dialog" aria-labelledby="editorToolImageTitle" aria-hidden="true">',
        '<div class="modal-dialog">',
        '<div class="modal-content">',
        '<div class="modal-header">',
        '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>',
        '<h3 id="editorToolImageTitle">image</h3>',
        "</div>",
        '<div class="modal-body">',
        '<div class="upload-img">',
        '<div class="button">Upload image</div>',
        '<span class="tip"></span>',
        '<div class="alert alert-error hide"></div>',
        "</div>",
        "</div>",
        "</div>",
        "</div>",
        "</div>",
      ].join("")
    ).appendTo($body);

    this.$upload = this.$win.find(".upload-img").css({
      height: 50,
      padding: "60px 0",
      textAlign: "center",
      border: "4px dashed#ddd",
    });

    this.$uploadBtn = this.$upload.find(".button").css({
      width: 86,
      height: 40,
      margin: "0 auto",
    });

    this.$uploadTip = this.$upload.find(".tip").hide();

    this.file = false;
    var _csrf = $("[name=_csrf]").val();

    this.uploader = WebUploader.create({
      swf: "/public/libs/webuploader/Uploader.swf",
      server: "/upload?_csrf=" + _csrf,
      pick: this.$uploadBtn[0],
      paste: document.body,
      dnd: this.$upload[0],
      auto: true,
      fileSingleSizeLimit: 2 * 1024 * 1024,
      //sendAsBinary: true,
      // Only image files are allowed to be selected.
      accept: {
        title: "Images",
        extensions: "gif,jpg,jpeg,bmp,png",
        mimeTypes: "image/*",
      },
    });

    this.uploader.on("beforeFileQueued", function (file) {
      if (self.file !== false || !self.editor) {
        return false;
      }
      self.showFile(file);
    });

    this.uploader.on("uploadProgress", function (file, percentage) {
      // console.log(percentage);
      self.showProgress(file, percentage * 100);
    });

    this.uploader.on("uploadSuccess", function (file, res) {
      if (res.success) {
        self.$win.modal("hide");
        self.editor.push(" ![" + file.name + "](" + res.url + ")");
      } else {
        self.removeFile();
        self.showError(res.msg || "The server is distracted, upload failed");
      }
    });

    this.uploader.on("uploadComplete", function (file) {
      self.uploader.removeFile(file);
      self.removeFile();
    });

    this.uploader.on("error", function (type) {
      self.removeFile();
      switch (type) {
        case "Q_EXCEED_SIZE_LIMIT":
        case "F_EXCEED_SIZE":
          self.showError("The file is too large, cannot exceed 2M");
          break;
        case "Q_TYPE_DENIED":
          self.showError("Only upload pictures");
          break;
        default:
          self.showError("An unknown error occurred");
      }
    });

    this.uploader.on("uploadError", function () {
      self.removeFile();
      self.showError("The server is distracted, upload failed");
    });
  };
  ToolImage.prototype.removeFile = function () {
    //var self = this;
    this.file = false;
    this.$uploadBtn.show();
    this.$uploadTip.hide();
  };

  ToolImage.prototype.showFile = function (file) {
    //var self = this;
    this.file = file;
    this.$uploadBtn.hide();
    this.$uploadTip.html("Uploading: " + file.name).show();
    this.hideError();
  };

  ToolImage.prototype.showError = function (error) {
    this.$upload.find(".alert-error").html(error).show();
  };

  ToolImage.prototype.hideError = function (error) {
    this.$upload.find(".alert-error").hide();
  };

  ToolImage.prototype.showProgress = function (file, percentage) {
    this.$uploadTip
      .html("Uploading: " + file.name + " " + percentage + "%")
      .show();
  };
  ToolImage.prototype.bind = function (editor) {
    this.editor = editor;
    this.$win.modal("show");
  };

  var toolImage = new ToolImage();
  var toolLink = new ToolLink();

  replaceTool("image", function (editor) {
    toolImage.bind(editor);
  });
  replaceTool("link", function (editor) {
    toolLink.bind(editor);
  });

  var createToolbar = Editor.prototype.createToolbar;
  Editor.prototype.createToolbar = function (items) {
    createToolbar.call(this, items);
    var self = this;
    $(self.codemirror.display.input).on("focus", function () {
      toolImage.editor = self;
    });
  };

  Editor.prototype.push = function (txt) {
    var cm = this.codemirror;
    var line = cm.lastLine();
    cm.setLine(line, cm.getLine(line) + txt);
  };
})(window.Editor, window.markdownit, window.WebUploader);
