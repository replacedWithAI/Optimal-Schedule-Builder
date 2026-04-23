window.ShareLinkController = {
	createLink: function() {
		var urlPage = window.location.href;
		urlPage+="&shared=1";
		urlPage=urlPage.replace("&scratch=1","");

		var url = "s/create?href="+encodeURIComponent(urlPage);

		$.ajax({
			url: url,
			cache: false
		}).done(function(response) {
			var r = JSON.parse(response);
			var domain = window.location.origin;

			var obj = $("#createShareLink");

			ShareLinkView.renderLinkGenerated(domain+"/vsb/s/"+r, obj);
		});
	},
	resetLink: function() {
		var obj = $("#createShareLink");

		ShareLinkView.renderButton(obj);
	}
};
