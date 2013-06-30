//variables
var footerIndent = -170;
var fullName = null;
var ideaList = new Array();
var readLeftOff = 0;

//init
$(document).ready(function() {


	//get rid of old improperly set cookies
	//clear old domain.com or www.domain.com cookies
	document.cookie = "readLeftOff=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT"; 
	document.cookie = "readLeftOff=;path=/;expires=Thu, 01-Jan-1970 00:00:01 GMT"; 



	//preload button
	preload([
	    '/images/bt_join_hover.png',
	    '/images/bullet_bg_ordered_read.png'
	]);

	
	//turn on cookie on submit
	$('#joinform').submit(function(e) {
		//e.preventDefault();

		fullName = $("#fname").val();
		var firstName = fullName.split(' ').slice(0, 1).join(' ');
		var lastName = fullName.split(' ').slice(1).join(' ');

	    $("#lname").val(lastName);
	    $("#fname").val(firstName);

	    setCookie('visited','true');
	    return true;
		//alert(firstName);
		//alert(lastName);

	});


	//save all h2 tags once and count total
	$("h2").each(function(){
    	ideaList.push(this);
    });

	
	//determine read / unread states
	readLeftOff = getCookie('readLeftOff');
	if (readLeftOff == undefined) {readLeftOff = 0;}
	else {readLeftOff = parseInt(readLeftOff);}

	//toggle all read from cookie
	if (readLeftOff > 0) {
		for (var i = 0; i < readLeftOff; i++) {
			$(ideaList[i]).parent().parent().addClass("read");
		}
	}

	//set default readStatus
	setUnreadText();


	$(window).scroll(function(e) {
		//only run if there are unread items
		if (readLeftOff < ideaList.length) {
			for (var i = 0; i < ideaList.length; i++) {

			//only run if the iteam isn't already set
			if(($(window).scrollTop() + 200 > $(ideaList[i]).offset().top) && !($(ideaList[i]).parent().parent().hasClass("read")))  {
				//add class to the idea
				$(ideaList[i]).parent().parent().addClass("read");

				//update readLeftOff
				readLeftOff = i + 1;

				//save readLeftOff
				setCookie('readLeftOff',parseInt(readLeftOff));

				//update unreadtext
				setUnreadText();
		        
		    }
		}
	}
	});
	


	//read cookie and determine footer state
	if ((getCookie('visited') == 'true') || getCookie('hidefooter') == 'true') {
		footerIndent = -320;

		//turn on click to scroll to bottom on footer
		$("#footer").bind("click", function(){
			if($(window).scrollTop() + $(window).height() != $(document).height()) {
				$("html, body").animate({ scrollTop: $(document).height() }, 500);
			}
		});

		//hide hidefooter if it has been clicked
		$("#hidefooter, #hidefooter2").css('visibility', 'hidden');

		//$('#footer').addClass('footerRedBorder');
	}
	else {
		$('#footer').css('border-top-color','#8f8f8f','important');
		$('#footer').css('cursor','default','important');
	}

	//turn on hidefooter functionality
	$('#hidefooter, #hidefooter2').mousedown(function() {
		setCookie('hidefooter','true');

		footerIndent = -320;
		//drop footer
		$('#footer').scrollToFixed( { bottom: footerIndent, limit: (footerHeight)} );
		$("#footer").css("bottom","-320px");
		$("#footer").css("top","");
		$("#footer").css("margin-left","0");
		$("#footer").addClass("scroll-to-fixed-fixed");

		//change styling on collapsed footer
		$('#footer').css('border-top-color','','');
		$('#footer').css('cursor','','');

		//turn on click to scroll to bottom on footer
		$("#footer").bind("click", function(){
			if($(window).scrollTop() + $(window).height() != $(document).height()) {
				$("html, body").animate({ scrollTop: $(document).height() }, 500);
			}
		});

		//hide hidefooter if it has been clicked
		$("#hidefooter, #hidefooter2").css('visibility', 'hidden');
	});


	

	//saveinitial field names
	var initfname = $("#fname").val();
	var initfemail = $("#femail").val();


	//turn on clearing for name
	$("#fname").bind("click focus", function(){
		if($("#fname").val() == initfname) {
			$("#fname").val('');
		}
	});
	$("#fname").bind("blur", function(){
		if($("#fname").val() == "") {
			$("#fname").val(initfname);
		}
	});


	//turn on clearing for email
	$("#femail").bind("click focus", function(){
		if($("#femail").val() == initfemail) {
			$("#femail").val('');
		}
	});
	$("#femail").bind("blur", function(){
		if($("#femail").val() == "") {
			$("#femail").val(initfemail);
		}
	});


	//turn on next and previous N P
	$(document).keydown(function (e) {
		if ( $('input:focus').length == 0) {

			//N
			if(e.which == "78") {
				//determin where the user is
				for (var i = 0; i < ideaList.length; i++) {
					if($(window).scrollTop() + 100 < $(ideaList[i]).offset().top)  {
						//alert(i);
						$("html, body").stop().animate({ scrollTop: $(ideaList[i]).offset().top - 50 }, 150);
						break;
					}
				}
			}
			//P
			else if(e.which == "80") {
				//determin where the user is
				for (var i = 0; i < ideaList.length; i++) {
					if($(window).scrollTop() - 300 < $(ideaList[i]).offset().top)  {
						//alert(i);
						$("html, body").stop().animate({ scrollTop: $(ideaList[(i - 1)]).offset().top - 50 }, 150);
						break;
					}
				}
				
			}
		}
    	
    	//alert(e.which);
	});




});



$(window).load(function() {
	footerHeight = $(document).height() - 360;
	$('#footer').scrollToFixed( { bottom: footerIndent, limit: (footerHeight)} );
});



function preload(arrayOfImages) {
    $(arrayOfImages).each(function(){
        $('<img/>')[0].src = this;
    });
}



function setCookie(name, value) {
	var now = new Date();
	var expireDate= new Date();
	expireDate.setTime(now.getTime() + 20*365*24*60*60*1000); 
	var curCookie = name + "=" + escape(value) + ";path=/;domain=.goodui.org;expires=" + expireDate; 
	document.cookie = curCookie;
}


function getCookie(name) {
  var dc = document.cookie;
  var prefix = name + "=";
  var begin = dc.indexOf("; " + prefix);
  if (begin == -1) {
    begin = dc.indexOf(prefix);
    if (begin != 0) return null;
  } else
    begin += 2;
  var end = document.cookie.indexOf(";", begin);
  if (end == -1)
    end = dc.length;
  return unescape(dc.substring(begin + prefix.length, end));
}


function isScrolledIntoView(elem)
{
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();

    var elemTop = $(elem).offset().top;
    var elemBottom = elemTop + $(elem).height();

    return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
}



function setUnreadText() {
	//nothing read
	if (readLeftOff == 0) {
		$("#readStatus").html('Looks like you have <a href="#1">' + ideaList.length + ' unread</a> ideas.');
	}
	//some read
	else if ((readLeftOff > 0) && (readLeftOff < ideaList.length)) {
		var ideasOutstanding = ideaList.length - readLeftOff;
		var nextToRead = readLeftOff + 1;
		$("#readStatus").html('Looks like you have <a href="#' + nextToRead + '">' + ideasOutstanding + ' unread</a> ideas.');
	}
	//everything read and signed up
	else if ((readLeftOff = ideaList.length) && (getCookie('visited') == 'true')) {
		$("#readStatus").html('All is read. Check back later.');	
	}
	//everything read but not signed up
	else {
		$("#readStatus").html('All is read. <a href="#more">Sign up</a> for updates.');	

	}
	
}