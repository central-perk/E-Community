$(document).ready(function () {
  var $backtotop = $("#backtotop");
  var top = $(window).height() - $backtotop.height() - 200;

  function moveBacktotop() {
    $backtotop.css({ top: top, right: 0 });
  }

  function setMessageCount() {
    $.get("/messages/count", function (data) {
      if (data.count) {
        $(".messages .sprite").addClass("active");
      }
    });
  }

  function setTabCount() {
    $.get("/tabs/count", function (data) {
      $("#sidebar")
        .find("li")
        .each(function () {
          var tab = $(this).data("tab");
          $(this)
            .find(".count")
            .text(data[tab] || 0);
        });
    });
  }

  $backtotop.click(function () {
    $("html,body").animate({ scrollTop: 0 });
    return false;
  });

  $(window).scroll(function () {
    var windowHeight = $(window).scrollTop();
    if (windowHeight > 200) {
      $backtotop.fadeIn();
    } else {
      $backtotop.fadeOut();
    }
  });

  moveBacktotop();
  $(window).resize(moveBacktotop);

  $(".topic_content a,.reply_content a").attr("target", "_blank");

  // pretty code
  setTabCount();
  $(".submit_btn").click(function () {
    $(this).button("loading");
  });

  $(".sponsor_outlink").click(function () {
    var $this = $(this);
    var label = $this.data("label");
    ga("send", "event", "banner", "click", label, 1.0, { nonInteraction: 1 });
  });

  if ($(".avatar").html()) {
    setMessageCount();
  }

  $(".dropdown").on("mouseleave", function (event) {
    $(".dropdown-toggle").dropdown("toggle");
    $(this).removeClass("open");
    event.stopPropagation();
    event.preventDefault();
  });

  $(".dropdown").on("mouseenter", function (event) {
    $(".dropdown-toggle").dropdown("toggle");
    $(this).addClass("open");
    event.stopPropagation();
    event.preventDefault();
  });

  $(".top-menu-btn").click(function () {
    if ($(".top-menu").hasClass("open")) {
      $(".top-menu").removeClass("open");
    } else {
      $(".top-menu").addClass("open");
    }
  });
});
