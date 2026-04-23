window.ShareLinkView = {
  alreadyRendered: true,

  renderLinkGenerated: function(link, obj) {
    obj.html([
        "Link: <input value='"+link+"' onclick='$(this).select();'/>",
        "<a href=\"javascript:void(0);\" onclick='ShareLinkController.resetLink();' title='Close share link output'><img src='images/close_thin.png' style='height:15px;margin: 0 0 -3px 3px;cursor:pointer;'/><a/>"
    ].join(""));
  },
  renderButton: function(obj) {
    obj.html([
        "<a href='javascript:void(0);' onclick='ShareLinkController.createLink();' title='Create short link for sharing'><img style=\"vertical-align: middle\" src=\"images/link.gif\" alt=\"Create Share link icon\"/>&nbsp;Create Share Link</a>"
    ].join(""));
  }
}
