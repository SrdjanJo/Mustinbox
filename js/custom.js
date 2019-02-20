(function ()
{
	window.DEV = true;
	// LOCAL STORAGE DB
	var db = new (function(loc){
		
		var initArray = ['users', 'loggedUser', 'userEmails', 'userEmailsIds', 'labelsByEmail'];
		var dataArray = {};
		
		// GET ITEM FROM LOCAL STORAGE
		var initItem = (ind) => {
			if ( !ind ) return [];
			
			var obj = loc.getItem(ind);
			
			if ( !obj ) { dataArray[ind] = []; } 
			else { dataArray[ind] = JSON.parse(obj); }
		}
		
		// SET OBJECT IN LOCAL STORAGE
		this.set = (ind, data, json) => {
			if ( !ind || !data ) return;
			
			var d = data;
			
			if ( json ) d = JSON.stringify(data);
			
			loc.setItem(ind, d);
			initItem(ind);
		}
		
		// GET OBJECT
		this.get = (ind) => {
			if ( dataArray[ind] )
				{
					return JSON.parse(JSON.stringify(dataArray[ind]));
				}
			else { return false; }
		}
		
		// REMOVE OBJECT
		this.remove = (ind) => {
			if ( !ind ) return;
			
			loc.removeItem(ind);
			initItem(ind);
		}
		
		// CHECK IF SOME VALUE EXISTS IN SOME OBJECT
		this.exists = (ind, cInd, cVal, isReturn) => {
			let obj = this.get(ind);
			let exists = false;
			var returnObj;
			
			if ( $.type(obj) == "array" )
				{
					$.each(obj, function(ind, val)
						{
							if ( val[cInd] && val[cInd] == cVal ) { exists = true; returnObj = val; }
						});
				}
			else if ( $.type(obj) == "object" )
				{
					if ( obj[cInd] && obj[cInd] == cVal ) { exists = true; returnObj = obj; }
				}
			
			if ( isReturn && exists )
				{
					return returnObj;
				}
			
			return exists;
		}
		
		// APPEND ITEM TO LOCAL ARRAY
		this.append = (ind, data, add_obj, filter) => {
			let obj = this.get(ind);
			if ( add_obj && obj )
				{
					if ( $.type(obj) == 'array' ) { obj = {}; }
					
					if ( obj[filter] && $.type(obj[filter]) == 'array' )
						{
							obj[filter] = obj[filter].concat(data);
						}
					else
						{
							obj[filter] = data;
						}
				}
			else if ( $.type(obj) == "array" )
				{
					obj.push(data);
				}
			this.set(ind, obj, true);
		}
		
		// INIT ALL LOCAL STORAGE ITEMS TO DB OBJECT
		$.each(initArray, (i, v) => {
			initItem(v);
		})
	})(window.localStorage);
	// LOCAL STORAGE DB
	
	var LOGGED = db.get('loggedUser');
	var userEmails = [];
	var userEmailsIds = {};
	var emailType = "inbox";
	var boxInfo = {};
	
	var usedSections = ['sent', 'spam', 'trash', 'drafts', 'inbox', 'starred']; // EMAILS WILL SHOW IN THESE BOXES
	var fetchSections = ['sent', 'spam', 'trash', 'drafts']; 					// MAILS WILL BE FETCHED FROM THESE BOXES
	var customBoxes = [], customBoxesLcase = []; 									// ALL CUSTOM BOXES THAT USER CREATED
	var userLabels = [], loverCaseLabels = [], labelsByEmail = db.get("labelsByEmail");
	
	
	//var apiUrl = 'http://192.168.0.105:2000';
	var apiUrl = 'https://app.mustinbox.com';
	
	var stack = {dir1: "up", dir2: "right", firstpos1: 5, firstpos2: 5, push: 'bottom', context: document.body};
	//$(document).ready(function()
    document.addEventListener('deviceready', function()
		{
			if ( DEV )
				{
					window.addEventListener('native.keyboardshow', focusInputs);
					window.addEventListener('keyboardDidShow', focusInputs);
					
					//alert(JSON.stringify(LOGGED));
					function focusInputs(event)
						{
							var height = event.keyboardHeight;
							
							alert(height+'-'+window.innerHeight);
							var bottomBorder = $('#loginFormInputPassword').offset().top + $('#loginFormInputPassword').height();
							if ( bottomBorder > window.innerHeight )
								{
									$('.bigg-scrollbar').animate({'scrollTop': bottomBorder-window.innerHeight+50});
								}
						}
					
					function focusInputs2()
						{
							alert('Hello keyboardshow 2');
						}
					
					$('.help-item').on('click', function()
						{
							/* $.post(apiUrl+'/api/users/addItemAWS', JSON.stringify({'AWS': true }), function(d)
								{
									
								})
							return; */
							$.post(apiUrl+'/api/users/getBoxes', JSON.stringify(LOGGED), function(data)
								{
									
								})
						})
				}
			
			// RICH TEXT EDITOR SETUP
			var toolbarOptions = [
				['bold', 'italic', 'underline', 'strike'],
				['blockquote'],
				[{ 'list': 'ordered'}, { 'list': 'bullet' }],
				[{ 'header': [1, 2, 3, 4, 5, 6, false] }],
				[{ 'color': [] }, { 'background': [] }],
				[{ 'font': [] }],
				[{ 'align': [] }] ,
				['clean']
			];
			Quill.register(Quill.imports['attributors/style/align'], true);
			Quill.register(Quill.imports['attributors/style/font'], true);
			
			var options = {
				theme: 'snow',
				modules: {
					'toolbar': toolbarOptions
				},
				placeholder: "Reply..."
			};
			var editorRead = new Quill('.readMailArea', options);
			delete options.placeholder;
			var editorCompose = new Quill('.composeMailArea', options);
			// RICH TEXT EDITOR SETUP
			
			
			$(document).on('click', '.a-span', function(){
				$(this).parents('.form-group').find('.ql-toolbar').toggle();
			})
			
			function navigateSection(id)
				{
					 $('#'+id).addClass('animated slideInRight');
					 setTimeout(function()
						{
							$('#'+id).addClass('active');
							$('.custom-scrollbar').scrollTop(0);
							$('section[id]').not('#'+id).removeClass('active animated slideInRight');
						},500);
				}
			
			$(document).on('click', '[data-target_id]', function()
				{
					var id = $(this).attr('data-target_id');
					
					if ( $('#'+id).length == 0 ) return;
					
					navigateSection(id);
					
					if ( $(this).hasClass('exit-mail-read') )
						{
							data = $('.mail-reply').validate();
							if ( !$.isEmptyObject(data) || attachmentsE.length > 0 )
								{
									if ( dataForReply['section'] == 'Sent' ) { data['to'] = dataForReply.to.address }
									else { data['to'] = dataForReply.from.address }
									
									data['subject'] = dataForReply['subject'];
									saveDraftMails(data);
								}
							$('.mail-reply [data-validate]').val('').removeClass('md-has-value is-valid is-invalid');
						}
				})
			
			$('#sign_in').on('click', function()
				{
					var data = $('form[name="loginForm"]').validate();
					
					if ( $('form[name="loginForm"] .is-invalid').length > 0 ) { return; }
					
					data.rememberMe = $('.remember_me').prop('checked');
					
					var user = data;
					
					var p = PNotify.info({
						title: 'Checking credentials!',
						text: '',
						addclass: "stack-bar-bottom",
						stack: stack,
						hide: false
					})
					$.post(apiUrl+'/api/users/login', JSON.stringify(data), function(data)
						{
							if ( data.status != 'success' )
								{
									$('form[name="loginForm"] input').not('input[type="checkbox"]').addClass('is-invalid');
									p.update({
										type: 'error',
										text: 'Wrong credentials',
										title: 'error'
									});
								}
							else
								{
									p.update({
										type: 'success',
										text: '',
										title: 'Welcome'
									});
									user.uniqueId = user.email;
									user.lastFetch = {};
									
									db.set('loggedUser', user, true);
									LOGGED = user;
									
									updateAppView(user);
									userEmails = currentUserMail(db.get('userEmails'), LOGGED['uniqueId']);
									userEmailsIds = currentUserMail(db.get('userEmailsIds'), LOGGED['uniqueId']);
									updateEmailsView(userEmails);
									
									updateNewMails(true);
									getUserLabels(LOGGED);
									getAllBoxes();
									
									navigateSection("mail");
									
									$('.nav-item.open').removeClass('open');
									$('.nav-item').first().addClass('open');
								}
								
							setTimeout(function()
								{
									p.remove();
								}, 1500)
						})
				})
			
			// NAVIGATION FOR MAIL PAGE
			$(document).on('click', '#mail .nav-item', function()
				{
					if ( $(this).is('.help-item, .settings-item, [data-target="#newLabelModal"], .newBox, [data-target_id]') ) return;
						
					$('.nav-item.open').removeClass('open');
					$(this).addClass('open');
					
					if ( $(this).is('.no-refresh') ) return;
					
					emailType = $(this).find('span').text().trim().toLowerCase();
					arrowNav.start = 1; arrowNav.end = 10;
					updateEmailsView(userEmails, emailType, '', true);
					$(".fuse-bar-backdrop").click();
					
					MAILBOX = emailType;
					
					var tempMailbox = MAILBOX;
					if ( tempMailbox == 'inbox' ) tempMailbox = '';
					
					$('[data-target="#deleteModal"]').show();
					if ( fetchSections.indexOf(tempMailbox) < 0 && tempMailbox != '' )
						{
							$('[data-target="#deleteModal"]').hide(); 
							return;
						}
					updateNewMails(true, tempMailbox);
				});
			
			// CHECKBOX FOR MAIL PAGE
			$(document).on('change', '#mail .thread-list input.custom-control-input, #mark-all-mails', function()
				{
					if ( $(this).is($('#mark-all-mails')) )
						{
							var check_all = $(this).prop('checked');
							$('#mail .thread-list input.custom-control-input').prop('checked', check_all).parents('.thread').toggleClass('yellow-thread', check_all);
						}
					else
						{
							$(this).parents('.thread').toggleClass('yellow-thread');
						}
					
					var showOptions = !!$('.thread-list input[type="checkbox"]:checked').length;
					$('.action-buttons .row').toggleClass('d-none', !showOptions)
				})
			
			
			var isSending = false;
			// SEN NEW EMAIL
			$('#send-mail').on('click', function()
				{
					var data = $('#composeModal').validate(),
						el = $('.composeMailArea [contenteditable="true"]'),
						value = el.html();
						
					if ( el.text().trim() == '' ) { el.parent().addClass('is-invalid'); } else { el.parent().removeClass('is-invalid'); }
					if ( $('#composeModal .is-invalid').length > 0 ) { return; }
					data['message'] = value.replace(/</g, '|ltgh|').replace(/>/g, '|rtgh|');

					if ( data.to == LOGGED.email ) { $('#recipient-name').addClass('is-invalid').removeClass('is-valid'); return; }
					
					$('#composeModal form, #read-mail').emptyAll(' [contenteditable="true"]');
					$('#composeModal .form-group.mb-4').emptyAll();
					$('#composeModal').modal('toggle');
					
					isSending = true;
					sendEmail(data);
				})
			
			$('#composeModal').on('hidden.bs.modal', function()
				{
					if ( !isSending )
						{
							var el = $('.composeMailArea [contenteditable="true"]'),
								value = el.html(),
								data = $(this).validate();
								
								data['message'] = value.replace(/</g, '|ltgh|').replace(/>/g, '|rtgh|');
							if ( !$.isEmptyObject(data) || attachmentsE.length > 0 )
								{
									saveDraftMails(data);
								}
						}
						
					attachmentsE = [];
					$('#composeModal form, #read-mail').emptyAll(' [contenteditable="true"]');
					$('#composeModal .form-group.mb-4').emptyAll();
					updateAttachView('.attachList', attachmentsE);
				})
			
			$('#composeModal').on('show.bs.modal', function()
				{
					attachmentsE = [];
					updateAttachView('.attachList', attachmentsE);
					$('#composeModal .ql-toolbar').hide();
				})
			
			$('#reply-mail').on('click', function()
				{
					var data = {},
						el = $('.mail-reply [contenteditable="true"]'),
						value = el.html();
						
					if ( el.text().trim() == '' ) { el.parent().addClass('is-invalid'); return; }
					data['message'] = value.replace(/</g, '|ltgh|').replace(/>/g, '|rtgh|');
					
					$('.mail-reply [data-validate]').removeClass('md-has-value is-valid is-invalid').find('[contenteditable="true"]').html('');
					if ( dataForReply['section'] == 'Sent' ) { data['to'] = dataForReply.to.address }
					else { data['to'] = dataForReply.from.address }
					
					data['subject'] = dataForReply['subject'];
					data['inReplyTo'] = dataForReply['messageId'];
					
					sendEmail(data);
				})
				
			function sendEmail(data)
				{
					var user = db.get('loggedUser');
					if ( typeof user.email == "undefined" ) return;
					
					data['user'] = user;
					data['attachments'] = attachmentsE;
					data['dateTime'] = new Date().getTime();
					
					
					var p = PNotify.info({
						title: 'Sending',
						text: 'Just a moment....',
						addclass: "stack-bar-bottom",
						stack: stack,
						hide: false
					})
					setTimeout( function(){
						p.update({
								title: 'Error',
								text: 'Something vent wrong!',
								type: 'error'
							})
					}, 30000);
					
					attachmentsE = [];
					updateAttachView('.attachList', attachmentsE);
					
					$.post(apiUrl+'/api/users/sendMail', JSON.stringify(data), function(data, status, xhr)
						{
							if ( data.status == 'success' )
								{
									p.update({
										title: 'Success',
										text: 'Email sent!',
										type: 'success'
								    })
									
									updateNewMails(true, 'sent');
										
									/* db.append('userEmails', [data['sendedMail']], true, LOGGED['uniqueId']);
									userEmails = currentUserMail(db.get('userEmails'), LOGGED['uniqueId']);
									updateEmailsView(userEmails, emailType); */
								}
							else
								{
									p.update({
										title: 'Error',
										text: 'Something vent wrong!',
										type: 'error'
								    })
									
									saveDraftMails(data['sendedMail'])
								}
							isSending = false;
							setTimeout( function(){ p.remove(); }, 1500);
						})
				}
			
			function saveDraftMails(data)
				{
					if ( draftOpened ) { draftOpened = false; return; }
					
					if ( !data['attachments'] ) data['attachments'] = attachmentsE;
					data['from'] = LOGGED.email;
					
					$.post(apiUrl+'/api/users/appenToBox', JSON.stringify({ user: {email: LOGGED.email, password: LOGGED.password }, mailbox: 'drafts', saveToMailbox: data }), function(d)
						{
							updateNewMails(true, 'drafts');
						})
				}
			
			var draftOpened = false;
			function openDraftMail(data)
				{
					draftOpened = true;
					$('#subject').val(data.subject).addClass('md-has-value');
					$('#recipient-name').val(data.to.address).addClass('md-has-value');
					$('#composeModal .composeMailArea [contenteditable="true"]').html(data.text);
					if ( data.cc ) $('#cc-name').val(data.cc.address).addClass('md-has-value');
					if ( data.bcc ) $('#bcc-name').val(data.bcc.address).addClass('md-has-value');
					
					if ( data.text ) $('#composeModal .composeMailArea').addClass('md-has-value')
					
					$('#composeModal').modal('show');
				}
				
			$(document).on('click', '.discardDraft', function()
				{
					$('#composeModal form, #read-mail').emptyAll(' [contenteditable="true"]');
					$('#composeModal form, #read-mail').emptyAll();
					attachmentsE = [];
					updateAttachView('.attachList', attachmentsE);
				})

			// READ ATTACHMENTS FOR EMAIL
			var attachmentsE = [];
			$('.attachmentCompose').on('change', function()
				{
					var files = $(this).prop('files');
					
					if ( files.length == 0 ) return;
					
					var reader = new FileReader(), file = files[0],
					name = file.name, size = file.size, type = file.type;
					
					var elem = '#composeModal';
					
					if ( $(this).parents('section[id]').length > 0 )
						{
							elem = '#'+$(this).parents('section[id]').attr('id');
						}
					
					reader.onload = function(ev)
						{
							attachmentsE.push({
								fileName: name,
								fileSize: size,
								data: ev.target.result,
								type: type
							});
							updateAttachView(elem+' .attachList', attachmentsE);
						}
						
					reader.readAsDataURL(file);
				})
				
			// ATTACHMENTS VIEW UPDATE
			function updateAttachView(el, data)
				{
					var html = '';
					
					$.each(data, function(i, v)
						{
							html += '<div class="oneAtt">'+v.fileName+'<span class="sizeAtt">('+sizeFromBytes(v.fileSize)+')</span><span data-index="'+i+'" class="delAtt">x</span></div>';
						})
					
					$(el).html(html);
				}
			
			//DELETE ATTACHMENTS
			$(document).on('click', '.delAtt', function()
				{
					var ind = parseInt($(this).attr('data-index'));
					attachmentsE.splice(ind, 1);
					
					var elem = '#composeModal';
					
					if ( $(this).parents('section[id]').length > 0 )
						{
							elem = '#'+$(this).parents('section[id]').attr('id');
						}
					
					updateAttachView(elem+' .attachList', attachmentsE);
				})
			
			//LOG OUT
			$('.nav-item.logout').on('click', function()
				{
					db.remove('loggedUser');
					navigateSection("login");
				});
			
			var canRefresh = true;
			var MAILBOX = 'inbox';
			$('#refresh-mail').on('click', function()
				{
					if ( !canRefresh ) return;
					
					updateNewMails(true, MAILBOX)
				})
			
			function updateAppView(user)
				{
					$('.account .info-name').html(user.name);
					$('.account .info-email').html(user.email);
				}
			
			// GET NEW MAILS
			function getEmails(date, mailbox, nav)
				{
					return new Promise((resolve, reject) => 
						{
							if ( !canRefresh ) reject();
							
							canRefresh = false;
							if ( $('#mail .thread-list .thread.ripple').length == 0 ) $('#mail .thread-list').html(loader);
							else $('#mail .thread-list').prepend(loader);
							$.post(apiUrl+'/api/users/getMail', JSON.stringify({ user: {email: LOGGED.email, password: LOGGED.password }, startDate: date, mailbox: mailbox, navigation: nav }), function(data)
								{
									canNavigate = true;
									boxInfo[data['mailbox']] = data['box']; $('#mail .messageLoader').remove();
									if ( data['status'] == 'success' ) resolve(data['emails']);
									else reject(data); 
								})
						})
				}
				
			$( document ).ajaxError(function(e, xhr, data) {
				if ( data.url.indexOf('api/users/getMail') > - 1 )
					{
						PNotify.error({
								title: 'Error',
								text: 'Can\'t fetch mails!',
								addclass: "stack-bar-bottom",
								stack: stack
							})
						
						$('#mail .messageLoader').remove();
					}
				else if ( data.url.indexOf('api/users/sendMail') > - 1 )
					{
						PNotify.error({
								title: 'Error',
								text: 'Can\'t send email!',
								addclass: "stack-bar-bottom",
								stack: stack
							})
					}
					
				PNotify.removeAll();
				
				canRefresh = true;
				isSending = false;
			});

				
			// UPDATE NEW MAILS FROM USERS INBOX
			// @param date - (not) use start date to fetch mails
			// @param mailbox - mailbox to fetch mails from
			// @param nav - used to calculate "from" and "to" number when fetching emails
			function updateNewMails(date, mailbox, nav)
				{
					var dateParam;
					if ( date && LOGGED.lastFetch[MAILBOX] )
						{
							dateParam = new Date(LOGGED.lastFetch[MAILBOX]);
						}

					getEmails(dateParam, mailbox, nav).then(function(data)
						{
							canRefresh = true;
							
							if ( data.length > 0 )
								{
									db.append('userEmails', renderEmails(data), true, LOGGED['uniqueId']);
									db.append('userEmailsIds', tempEmailIds, true, LOGGED['uniqueId']);
									db.set('loggedUser', LOGGED, true);
									tempEmailIds = [];
									
									if ( !mailsAddedToDB ) // IF THERE IS NO NEW MAILS NO NEED TO REFRESH THE PAGE
										{
											if ( boxInfo[MAILBOX] ) { arrowNav.allLength = boxInfo[MAILBOX].messages.total; }
											if ( arrowNav.length > arrowNav.allLength ) arrowNav.allLength = arrowNav.length;
											
											makeNavigation(arrowNav);
											return;
										}
									userEmails = currentUserMail(db.get('userEmails'), LOGGED['uniqueId']);
									userEmailsIds = currentUserMail(db.get('userEmailsIds'), LOGGED['uniqueId']);
									updateEmailsView(userEmails, emailType);
								}
							
						}).catch(function(err)
							{
								console.error('Empty mails', err);
								if ( $('#mail .thread-list .thread.ripple').length == 0 ) $('#mail .thread-list').html(noMails);
								canRefresh = true;
							});
				}
			
			// @param dt - date object
			function formatDate(dt)
				{
					if ( !dt ) { dt = new Date(); }
					var format = '';
					
					format = [dt.getFullYear(), '/', (dt.getMonth()+1), '/', dt.getDate()].join('');
					
					return format;
				}
			
			var tempEmailIds = [];
			var mailsAddedToDB = false;
			// RENDER EMAILS FROM USERS MAIL SERVICE
			function renderEmails(e)
				{
					mailsAddedToDB = false;
					if ( $.type(e) !== 'array' ) return [];
					var getLabelsForMails = [];
					
					var neww = e
						.filter(function(v)
							{
								return userEmailsIds.indexOf(v.messageId) < 0 && v.messageId;
							})
						.map(function(val, ind)
							{
								var sender = val.from ? val.from.value[0] || {address: val.from.text, name: ''} : {address: '', name: ''},
									reciever = val.to ? val.to.value[0] || {address: val.to.text, name: ''} : {address: '', name: ''},
									cc = val.cc ? val.cc.value[0] || {address: val.cc.text, name: ''} : {address: '', name: ''},
									bcc = val.bcc ? val.bcc.value[0] || {address: val.bcc.text, name: ''} : {address: '', name: ''},
									subject = val.subject || '',
									text = val.text || val.textAsHtml || val.html || '',
									dt = val.date ? new Date(val.date) : new Date(0),
									attach = [],
									priority = val.priority ? val.priority : 'normal';
								
								if ( userEmailsIds.indexOf(val.messageId) < 0 )
									{
										tempEmailIds.push(val.messageId);
									}
								
								if ( !LOGGED.lastFetch[MAILBOX] ) LOGGED.lastFetch[MAILBOX] = 0;
								if ( !LOGGED.lastFetch[MAILBOX+'Before'] && val.date ) LOGGED.lastFetch[MAILBOX+'Before'] = dt;
								
								if ( dt.getTime() > new Date(LOGGED.lastFetch[MAILBOX]).getTime() ) { LOGGED.lastFetch[MAILBOX] = val.date; } // date to use for fetch mails after him
								if ( dt.getTime() < new Date(LOGGED.lastFetch[MAILBOX+'Before']).getTime() && val.date ) { LOGGED.lastFetch[MAILBOX+'Before'] = val.date; } // date to use for fetch mails before him

								if ( typeof val.attachments != "undefined" )
									{
										attach = val.attachments
										.filter(function(v)
											{
												return v.contentType
											})
										.map(function(v, i)
											{
												var id = v.contentId || v.checksum;
												if ( !v.contentType) return;
												return { fileName: v.filename, id: id, type: v.contentType, fileSize: v.size }
											})
									}
								mailsAddedToDB = true;
								getLabelsForMails.push(val.messageId);
								return {messageId: val.messageId, uid: val.uid ,from: sender, to: reciever, labels: '', section: val.section, subject: subject, text: text, date: dt, dateTime: dt.getTime(), attachments: attach, priority: priority, cc: cc, bcc: bcc};
							})
					if ( getLabelsForMails.length > 0 ) getLabelsByEmail(getLabelsForMails);
					
					return neww;
				}
				
			var mS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
			var arrowNav = {length: 0, start: 1, end: 10, allLength: 0};
			var loader = '<div class="messageLoader"><i class="icon-loading"></i></div>';
			var noMails = '<div class="empty-mail">No Emails found in this section!</div>';
			var currentYear = new Date().getFullYear();
			
			// UPDATE EMAILS VIEW
			// @param m - logged user mails
			// @param type - box type to show
			// @param search - search keyword
			// @param navigated - did user used nav arrows
			function updateEmailsView(m, type, search, navigated)
				{
					if ( !m || $.type(m) != 'array' ) m = [];
					if ( !type ) type = 'inbox';
					arrowNav.length = 0;
					arrowNav.allLength = 0;
					
					var lengthFound = false;
					if ( boxInfo[type] ) { arrowNav.allLength = boxInfo[type].messages.total; lengthFound = true; }
					
					var html;
					
					if ( usedSections.indexOf(type) > -1 ||  loverCaseLabels.indexOf(type) > -1 )
						{
							html = m.sort(function(a, b)
								{
									if ( a.dateTime > b.dateTime ) return -1;
									else if (a.dateTime < b.dateTime ) return 1;
								})
								.map(function(val, ind)
								{
									if ( type !== val.section && !( labelsByEmail[val.messageId] && labelsByEmail[val.messageId].indexOf(type) > -1 ) ) return ''; // section navigate
									
									var name = '';
									if ( val.from.address != LOGGED.email )
										{
											name = val.from.name != '' ? val.from.name : val.from.address;
										}
									else
										{
											name = val.to.name != '' ? val.to.name : val.to.address;
										}
									
									// search engine
									if ( search )
										{
											if ( !searchEngine(val, search, name) ) return "";
										}
									
									if ( !lengthFound ) arrowNav.allLength++;
									arrowNav.length++;
															
									if ( arrowNav.length < arrowNav.start || arrowNav.length > arrowNav.end ) return ''; // page number navigate
									
									var subject = val.subject;
									var message = stripHtmlTags(val.text).trim().substr(0, 70)+'...';
									var attachIco = '';
									var dt = new Date((val.date ? val.date : val.dateTime));
									var stringDt = dt.getDate() + ' ' + mS[dt.getMonth()];
									var namePic = name ? name.substr(0, 1).toUpperCase() : name.substr(0, 1).toUpperCase();
									
									if ( dt.getFullYear() != currentYear ) stringDt += ' '+dt.getFullYear();
									
									if ( val.attachments && val.attachments.length > 0 )
										{
											attachIco = '<i class="icon-paperclip has-attachment s-4"></i>';
										}
									
									subject = subject.replace(/<|>/, '');
									name = name.replace(/<|>/, '');
									
									var starred = '<i class="icon-star-outline"></i>'
									if ( labelsByEmail[val.messageId] && labelsByEmail[val.messageId].indexOf('starred') > -1 )
										{
											starred = '<i class="icon-star"></i>'
										}
									
									return `
										 <div class="thread ripple row no-gutters flex-wrap flex-sm-nowrap align-items-center py-2 px-3 py-sm-4 px-sm-6 unread" data-info="${ind}" data-message="${val.messageId}" data-uid="${val.uid}">
											<label class="col-auto custom-control custom-checkbox">
												<input type="checkbox" class="custom-control-input" />
												<span class="custom-control-indicator"></span>
											</label>
											<div class="info col px-4">
												<div class="name row no-gutters align-items-center">
													<div class="avatar mr-2" >${namePic}</div>
													<span class=""> ${name} </span>
													${attachIco}
												</div>
												<div class="subject">
													${subject}
												</div>
												<div class="message">
													${message}
												</div>
											</div>
											<div class="col-12 col-sm-auto d-flex flex-sm-column justify-content-center align-items-center">
												<div class="time mb-2">${stringDt}</div>
												<div class="actions row no-gutters">
													<button type="button" class="btn btn-icon starEmail">
														${starred}
													</button>
												</div>
											</div>
										</div>
									`;
								}).join('');
						}
						
					if ( arrowNav.length > arrowNav.allLength ) arrowNav.allLength = arrowNav.length;
					if ( !html ) html = noMails;
					
					makeNavigation(arrowNav);
					$('#mail .thread-list').html(html);
					$('.custom-scrollbar').scrollTop(0);
					
					var dateBefore = LOGGED.lastFetch[MAILBOX+'Before'];
					if ( arrowNav.length < arrowNav.end && arrowNav.allLength != arrowNav.length && arrowNav.start > navPgLen && navigated && dateBefore )
						{
							canNavigate = false;
							updateNewMails(false, MAILBOX, dateBefore);
						}
					
					if ( navigated )
						{
							$("#mark-all-mails").prop('checked', false);
							$(".action-buttons .row").addClass('d-none');
						}
				}
				
			// REMOVE ALL HTML TAGS FROM STRING
			function stripHtmlTags(str)
				{
					var div = document.createElement("div");
					div.innerHTML = str;
					var rawText = div.textContent || div.innerText || "";
					return rawText;
				}
			
			/**********************    LABELS      *************************/
			
			// STAR AN EMAIL
			$(document).on('click', '.starEmail', function()
				{
					var data = {clear: true, labels: ['starred'], emails: [], user: {email: LOGGED.email, password: LOGGED.password, labels: [{label_name:{S:"starred"}}]} };
					var i = $(this).find('i');
					var label = 'starred';
					
					if ( i.hasClass('icon-star') )
						{
							i.attr('class', 'icon-star-outline');
							label = '';
							data.labels = [];
						}
					else
						{
							i.attr('class', 'icon-star');
						}
					var index = parseInt($(this).parents('[data-info]').attr('data-info'));
					if ( userEmails.length > 0 && typeof userEmails[index] != "undefined" )
						{
							data['emails'].push(userEmails[index]['messageId']);
							$.post(apiUrl+"/api/users/addLabelEmail", JSON.stringify(data), function(d)
								{
									if ( data['emails'].length > 0 ) getLabelsByEmail(data['emails']);
								});
						}
				})
			
			function getUserLabels(data)
				{
					$.post(apiUrl+'/api/users/getAllLabels', JSON.stringify(data), function(d)
						{
							if ( d['status'] == 'success' )
								{
									var labels = d['labels'];
									if ( labels.Count < 1 ) return;
									
									userLabels = labels.Items;
									loverCaseLabels = userLabels.map(function(v){ return v.label_name.S.toLowerCase() }).concat(usedSections);
									drawLablesMenu(userLabels);
								}
						}, 'json');
				}
			
			/*
				draw labels for left meny
				@param  labs - all user labels
			*/
			function drawLablesMenu(labs)
				{
					var html = labs.map(function(v)
						{
							return '<li class="nav-item newLabel">'+
										'<a class="nav-link ripple" data-fuse-bar-toggle="mail-sidebar" href="#">'+
											'<i class="icon s-4 icon-label"></i>'+
											'<span>'+v.label_name.S+'</span>'+
										'</a>'+
									'</li>';
						}).join("");
						
					$('.allMenuLabels').html(html);
				}
			
			// OPEN CLOSE LABELS POPOVER
			var labelsPopover = $('#labelContainer');
			
			$(document).on("click", function(ev)
				{
					labelsPopover.hide();
				});
				
			$(document).on("click mousedown", '#labelContainer, .labelButton ', function(ev)
				{
					ev.stopPropagation();
				});
				
			$(document).on('click', '.labelButton i', function(ev)
				{
					labelState = "";
					labelsPopover.toggle();
					$(".labelCrateSearched").hide();
					if ( labelsPopover.is(':visible') )
						{
							checkedLabels = getCheckedMailsIds(true);
							allCheckedEmails = $(".thread-list input:checked").length;
							checkedLabelsCount = {};
							checkedLabels.forEach(function(x) { checkedLabelsCount[x] = (checkedLabelsCount[x] || 0)+1; });
							
							drawLabelsPopover(userLabels);
						}
				});
			// OPEN CLOSE LABELS POPOVER
			
			var checkedLabels = []; // saving all labels in order to check them
			var checkedLabelsCount = {}; // saving all labels count
			var allCheckedEmails = 0;
			
			/*
				draw labels for labels popover
				@param  labs - all user labels
				
				@return (void)
			*/
			function drawLabelsPopover(labs, search)
				{
					//console.log("Checked emails", checkedLabelsCount, checkedLabels);
					var html = labs.map(function(v, i)
						{
							if ( !v.label_name.S ) return;
							var label = v.label_name.S,
							lCaseLabel = label.toLowerCase();
							
							var isChecked = false;
							var partialyChecked = false;
							if ( allCheckedEmails > 0 )
								{
									var ind = checkedLabels.indexOf(lCaseLabel);
									if ( ind > -1 )
										{
											labelState += 1;
											isChecked = true;
											//if ( checkedLabelsCount[lCaseLabel] && checkedLabelsCount[lCaseLabel] != allCheckedEmails ) partialyChecked = true;
										}
									else
										{
											labelState += 0;
										}
								}
							
							// IMPLEMENT SEARCH
							if ( search && lCaseLabel.indexOf(search.toLowerCase()) == -1 ) return;
							else if (search) label = label.replace(new RegExp('('+search+')', 'i'), '<b>$1</b>');
							
							
							return '<div class="oneLabel" data-label="'+i+'">'+
										'<label class="custom-control custom-checkbox">'+
											'<input type="checkbox" class="custom-control-input '+(partialyChecked ? "partialyChecked" : "")+'" '+(isChecked ? "checked" : "")+' />'+
											'<span class="custom-control-indicator"></span>'+
										'</label><span class="labelText">'+label+'</span>'+
									'</div>';
						}).join("");
					
					if ( !html && !search ) html = '<div class="emptyLabels">No added labels</div>';
					else if ( !html && search ) $(".fourLabels").addClass("noBorder");
					else $(".fourLabels").removeClass("noBorder");
					
					$("#labelContainer .fourLabels").html(html);
					
					if ( search ) return;
					$("#searchAllLabels").val(""); $(".labelCreate").removeClass("d-none"); $("#labelContainer").removeClass("changedLabels");
					$(".fourLabels").removeClass("noBorder");
					/*$("#labelContainer .fourLabels input").each(function(v){ labelState += $(this).prop("checked") ? 1 : 0; }); */
				}
			
			$(document).on("change", "#labelContainer .fourLabels input", function()
				{
					var currentLabelState = "";
					$("#labelContainer .fourLabels input").each(function(v){ currentLabelState += $(this).prop("checked") ? 1 : 0; });
					
					$("#labelContainer").toggleClass("changedLabels", currentLabelState != labelState);
				})
			
			// LABELS SEARCH
			$(document).on("keyup", "#searchAllLabels", function()
				{
					var input = $(this).val().trim();
					$(".labelCrateSearched").hide();
					
					if ( input != "" )
						{
							$(".labelCrateSearched span").text(input);
							$(".labelCrateSearched").show();
							$(".labelCreate").addClass("d-none");
						}
					
					drawLabelsPopover(userLabels, input);
				})

			// CREATE NEW LABEL 
			
			$(".labelCrateSearched").on("click", function()
				{
					$("#newLabelModal").modal('show');
					$("#labelName").val($(this).find("span").html()).addClass("md-has-value");
				})
				
			$("#newLabelModal").on('show.bs.modal', function()
				{
					$("#labelName").val("").removeClass("md-has-value is-invalid");
					$(".labelExistsError, .labelExistsErrorSys").hide();
				});
			
			$("#saveLabel").on("click", function()
				{
					var label = $("#labelName").val().trim().replace(/ +/g, ' ');
					$("#labelName").toggleClass("is-invalid", !label);
					$(".labelExistsError, .labelExistsErrorSys").hide();
					if ( !label )
						{
							return;
						}
					
					// IF LABEL EXISTS DONT ADD IT
					if ( loverCaseLabels.indexOf(label.toLowerCase()) > -1 )
						{
							$("#labelName").addClass("is-invalid");
							
							if ( usedSections.indexOf(label.toLowerCase()) > -1 )
								{
									$(".labelExistsErrorSys").show().find("span").text('"'+label+'"');
									return;
								}
							
							$(".labelExistsError").show();
							return;
						}
					
					var data = {user: {email: LOGGED.email, password: LOGGED.password }, label: label};
					$("#newLabelModal").modal('hide');
					$.post(apiUrl+"/api/users/newLabel", JSON.stringify(data), function(d)
						{
							if ( d['status'] == "success" )
								{
									getUserLabels(LOGGED);
									PNotify.success({
										type: "success",
										title: "Success" ,
										text: "New label added!",
										addclass: "stack-bar-bottom",
										stack: stack,
										hide: true
									})
								}
							else
								{
									PNotify.error({
										type: "error",
										title: "Error",
										text: "Could not add label!",
										addclass: "stack-bar-bottom",
										stack: stack,
										hide: true
									})
								}
						})
				})

			// CREATE NEW LABEL 
			
			// ADD LABEL TO MAIL
			$(".labelApply").on("click", function()
				{
					var checkedLabels = getCheckedLabels();
					var checkedEmails = getCheckedMailsIds();

					if ( checkedLabels.length > 0 && checkedEmails.length > 0 )
						{
							var data = {clear: true, labels: checkedLabels, emails: checkedEmails, user: {email: LOGGED.email, password: LOGGED.password, labels: userLabels} };
							$.post(apiUrl+"/api/users/addLabelEmail", JSON.stringify(data), function(d)
								{
									labelsPopover.hide();
									getLabelsByEmail(data['emails']);
								});
						}
				})
			
			/*
				@param withNames - if this param is true then function will return object of type [emailId: email labels]
				@param withNames - if this param is true then function will return object of type [emailId: email uids]
				@return (array)  -  Ids of checked mails
			*/
			function getCheckedMailsIds(withNames, uids)
				{
					var temp = uids ? {} : [];
					$(".thread-list input:checked").each(function()
						{
							var id = $(this).parents("[data-message]").attr("data-message");
							if ( uids )
								{
									temp[id] = parseInt($(this).parents("[data-uid]").attr("data-uid"));
									return true;
								} 
							
							if ( withNames )
								{
									if ( labelsByEmail[id] ) temp = temp.concat(labelsByEmail[id]);
								}
							else
								{
									temp.push(id);
								}
						});
					return temp;
				}
			
			/*
				@return (array)  -  Names of checked labels
			*/
			function getCheckedLabels()
				{
					var temp = [];
					$("#labelContainer .fourLabels input:checked").each(function(){ temp.push($(this).parents(".oneLabel").find(".labelText").text()) });
					return temp;
				}
				
			/*
				@param email - ids of emails
			*/
			function getLabelsByEmail(emails)
				{
					if ( $.type(emails) != "array" ) return;
					var data = {user: {email: LOGGED.email, password: LOGGED.password}, emails: emails };
					
					$.post(apiUrl+"/api/users/getEmailLabels", JSON.stringify(data), function(d)
						{
							if ( d['status'] == "success" )
								{
									if ( d['labels']['Count'] > 0 )
										{
											var labels = d['labels']['Items'];
											var firstFound = [];
											if ( $.type(labelsByEmail) == "array" && labelsByEmail.length == 0 ) labelsByEmail = {};
											
											$.each(labels, function(i, val)
												{
													var labelName = val.label_name.S.toLowerCase(),
														emailId = val.email.S;
													if ( firstFound.indexOf(emailId) < 0 )
														{
															firstFound.push(emailId);
															labelsByEmail[emailId] = [];
														}
														
													labelsByEmail[emailId].push(labelName);
												})
											db.set("labelsByEmail", labelsByEmail, true);
										}
								}
						})
				}
			// ADD LABEL TO MAIL
				
			/* 	CREATE NEW MAILBOX  */
			
			$("#newBoxModal").on("hidden.bs.modal", function()
				{
					$("#boxName").val("").removeClass('md-has-value is-valid is-invalid');
					$(".MailboxExistsError").hide();
				});
			
			$("#saveMailbox").on("click", function()
				{
					var box = $("#boxName").val().trim().replace(/ +/g, ' ');
					$("#boxName").toggleClass("is-invalid", box.length < 3 );
					$(".MailboxExistsError").hide();
					if ( box.length < 3 ) { return; }
					if ( usedSections.indexOf(box.toLowerCase()) > -1 || customBoxesLcase.indexOf(box.toLowerCase()) > -1 )
						{
							$(".MailboxExistsError").show();
							$("#boxName").addClass("is-invalid");
							return;
						}
					
					$("#newBoxModal").modal("hide");
					var data = {user: {email: LOGGED.email, password: LOGGED.password}, mailbox: box };
					
					$.post(apiUrl+"/api/users/newBox", JSON.stringify(data), function(d)
						{
							if ( d['status'] == 'success' )
								{
									customBoxes.push(d['mailbox']);
									customBoxesLcase.push(d['mailbox'].toLowerCase());
									PNotify.success({
											type: "success",
											title: "Success" ,
											text: "New Mailbox created added!",
											addclass: "stack-bar-bottom",
											stack: stack,
											hide: true
										})
									
									drawMailboxesMenu();
								}
							else
								{
									PNotify.error({
										type: "error",
										title: "Error",
										text: "Could not create new Mailbox!",
										addclass: "stack-bar-bottom",
										stack: stack,
										hide: true
									})
								}
						})
				})
				
			
			function getAllBoxes()
				{
					$.post(apiUrl+'/api/users/getBoxes', JSON.stringify(LOGGED), function(data)
						{
							if ( data["status"] == "success" )
								{
									customBoxesLcase = [];
									customBoxes = data['mailboxes'].map(function(v)
										{
											var name = v.split(".");
											if ( name.length < 2 ) return;
											name.splice(0,1);
											customBoxesLcase.push(name.join("").toLowerCase())
											return name.join("");
										})
									drawMailboxesMenu();
								}
						})
				}
			
			function drawMailboxesMenu()
				{
					var html = "";
					html = customBoxes.map(function(v)
						{
							if ( usedSections.indexOf(v.toLowerCase()) > -1 ) return "";
							return '<li class="nav-item">'+
                                        '<a class="nav-link ripple" data-fuse-bar-toggle="mail-sidebar" href="#">'+
                                            '<i class="icon s-4 icon-mailbox"></i>'+
                                            '<span>'+v+'</span>'+
                                        '</a>'+
                                    '</li>';
						}).join("")
					
					$(".customBoxes").html(html)
				}
			/* 	CREATE NEW MAILBOX  */
			
			$("#deleteModal").on('show.bs.modal', function()
				{
					$("#deleteModal .modal-body").addClass('d-none');
					if ( MAILBOX == "trash" ) $('.permanently').removeClass("d-none")
					else $('.toTrash').removeClass("d-none")
				});
			
			/* MOVE EMAILS TO TRASH */
			$("#moveToTrash").on("click", function()
				{
					$("#deleteModal").modal("hide");
					var data = {user: {email: LOGGED.email, password: LOGGED.password}, remove: false };
					data['mailbox'] = MAILBOX;
					data['uids'] = getCheckedMailsIds(false, true);
					
					if ( MAILBOX == 'trash' ) { data['remove'] = true; } // PERMANENTLU DELETE MAILS
					
					$.post(apiUrl+"/api/users/moveToTrash", JSON.stringify(data), function(d)
						{
							if ( d["status"] == "expunged" )
								{
									boxInfo[data['mailbox']] = d['box'];
									var tempEmail;
									console.log(tempEmail)
									for ( var i = (userEmails.length-1); i >= 0; i-- )
										{
											tempEmail = userEmails[i];
											if ( data['uids'][tempEmail.messageId] ) 
												{
													tempEmail.section = "trash";
													if ( data['remove'] ) { userEmails.splice(i, 1); }
												}
										}
									
									var mails = {};
									mails[LOGGED['email']] = userEmails;
									db.set('userEmails', mails, true); // override mails in local db
									
									// UPDATE VIEW
									$(".action-buttons .row").addClass('d-none');
									$("#mark-all-mails").prop("checked", false);
									updateEmailsView(userEmails, MAILBOX)
								}
						})
				})
			
			/* MOVE EMAILS TO TRASH */
			
			
			
			// SEARCH MAILS
			var searchTimeout;
			var previousSearch = '';
			$(document).on('keyup','#mail .search-bar-input', function()
				{
					var keywords = $(this).val().trim().toLowerCase();
					
					if ( previousSearch == keywords ) return;
					clearTimeout(searchTimeout);
					
					searchTimeout = setTimeout(function()
						{
							updateEmailsView(userEmails, emailType, keywords);
						}, 300);
					previousSearch = keywords;
				})
			
			function searchEngine(val, keyword, n)
				{
					var keyArr = keyword.replace(/\s{2,}/g, ' ').split(' ');
					var keyArrLen = keyArr.length;
					
					var subjectMatch = 0, textMatch = 0, nameMatch = 0;
					$.each(keyArr, function(i, v)
						{
							if ( val['subject'].toLowerCase().indexOf(v) > -1 ) subjectMatch++;
								
							//if ( val['text'].toLowerCase().indexOf(v) > -1 ) textMatch++;
							
							if ( n.toLowerCase().indexOf(v) > -1 ) nameMatch++;
						})
					
					if ( nameMatch == keyArrLen || subjectMatch == keyArrLen ) return true;
						
					return false;
				}
				
			
			
			// MAKE ARROW NAVIGATION
			var canNavigate = true;
			var navPgLen = 10;
			function makeNavigation(nav)
				{
					var end = nav.end > nav.allLength ? nav.allLength : nav.end;
					var start = nav.start > nav.allLength ? nav.allLength : nav.start;
					
					$('.prev-mail-page').toggleClass('disbled-nav', nav.start <= 1);
					$('.next-mail-page').toggleClass('disbled-nav', nav.end >= nav.allLength);
					
					$('.page-counter').text(start + ' - ' + end + ' of ' + nav.allLength);
				}
				
				
			
			// NAVIGATE TO PREVIOUS EMAIL PAGE
			$(document).on('click','.prev-mail-page', function()
				{
					if ( $(this).hasClass('disbled-nav') ) return;
					
					arrowNav.start -= navPgLen; arrowNav.end -= navPgLen;
					updateEmailsView(userEmails, emailType, false, true);
				})	
				
				
			
			// NAVIGATE TO NEXT EMAIL PAGE
			$(document).on('click','.next-mail-page', function()
				{
					if ( $(this).hasClass('disbled-nav') || !canNavigate ) return;
					
					arrowNav.start += navPgLen; arrowNav.end += navPgLen;
					updateEmailsView(userEmails, emailType, false, true);
				})
				
				
			
			var dataForReply;
			$(document).on('click','#mail .ripple.thread .info', function()
				{
					var index = parseInt($(this).parents('[data-info]').attr('data-info'));
					var mail = userEmails[index];
					if ( userEmails.length > 0 && typeof mail != "undefined" )
						{
							if ( mail.section == "drafts" ) { openDraftMail(mail); return; }
							getMailAttachments(mail);
							$('.read-from-to, .read-subject, .message-text, .att-title, .attachemnt-items').html('');
							navigateSection("read-mail");
							setTimeout(function(){updateReadView(mail)}, 500);
							dataForReply = mail;
						}
				})
				
				
			
			var localAttachments = {};
			//GET ATTACHMENTS FOR CERTAIM EMAIL
			//@param mail - email to fetch attachments for
			function getMailAttachments(mail)
				{
					var attachmentsArr = [];
					if ( !mail.messageId || mail.attachments.length == 0 ) return false;
					$.post(apiUrl+'/api/users/getMail', JSON.stringify({ user: {email: LOGGED.email, password: LOGGED.password }, mailbox: mail.section, mailId: mail.messageId }), function(data)
						{
							if ( data['status'] == 'success' )
								{
									var mail = data.emails[0];
									var attachments = mail['attachments'];
									
									$.each(attachments, function(i, v)
										{
											if ( !v.contentType ) return true;
											
											var id = v.contentId || v.checksum;
											var prefix = 'data:'+v.contentType+';base64,';
											
											var d = v.content.data;
											var a = d.map(v => String.fromCharCode(v)).join('');
											var base64 = prefix + btoa(a);
											
											localAttachments[id] = base64;
											if ( v.contentType.match(/image\//) )
												{ 
													$('[data-id="'+id+'"]').find('.attachemnt-content').css('backgroundImage', 'url('+base64+')').find('.messageLoader').remove();
												}
											else
												{
													$('[data-id="'+id+'"]').find('.attachemnt-content').css({
														'backgroundImage': 'url(assets/images/file-black-text-paper-sheet-symbol-with-one-folded-corner.png)',
														'backgroundSize': '70%',
													}).find('.messageLoader').remove();
												}
											
											$('[data-id="'+id+'"] .att-download a').attr('href', base64);
										})
								}
						})
					
					return attachmentsArr;
				}
			
			//UPDATE VIEW FOR READ MAIL PAGE
			function updateReadView(mail)
				{
					if ( $.type(mail) != "object" ) return;
					
					var fromTo = '';
					var name = '';
					var address = '';
					var textt = mail.text.split('\n').join('<br/>');
					var dt = new Date((mail.date ? mail.date : mail.dateTime));
							
					var stringDt = dt.getDate() + ' ' + mS[dt.getMonth()];
					
					// NAME AND ADDRESS
					name = mail.from.name ? mail.from.name : mail.from.address;
					address = name != mail.from.address ? mail.from.address : '';
					
					var namePic = name.substr(0, 1).toUpperCase();
					
					// WRITE NAME AND DATE
					fromTo += '<div class="avatar mr-2">'+namePic+'</div><span class="names">'+name+'</span><span class="mail">'+(address.replace('<', '&lt').replace('>', '&gt'))+' to</span>';
					
					var to = '';
					if ( mail.section == 'Inbox' ) to = 'me';
					else to = mail.to.address;
					
					fromTo += '<span class="names">'+to.replace('<>', '')+'</span><div class="abs-email-date">'+stringDt+'</div>';
					// WRITE NAME AND DATE
					
					// SHOW ATTACHMENTS
					var count = mail.attachments.length;
					var attacments = '';
					$.each(mail.attachments, function(i, v)
						{
							var view = 'img';
							var href = '';
							
							if ( !v.type.match(/image\//) ) view = 'file';
								
							attacments += '<div class="one-attachemnt" data-id="'+v.id+'">'+
											'<div class="attachemnt-content" style="">'+
												'<div class="messageLoader"><i class="icon-loading"></i></div>'+
											'</div>'+
											'<div class="att-view" data-view="'+view+'" data-viewindex="'+i+'" data-toggle="modal" data-target="#viewModal">View</div>'+
											'<div class="att-download"><a href="'+href+'" download>Download</a></div>'+
											'<div class="att-size">('+sizeFromBytes(v.fileSize)+')</div>'+
										'</div>';
						})
					
					$('.read-from-to').html(fromTo);
					$('.read-subject').html(mail.subject+'<span class="exit-mail-read" data-target_id="mail">x</span>');
					$('.message-text').html(textt);
					$('.att-title').html("Attachments ("+count+")");
					$('.attachemnt-items').html(attacments);
				}
			
			$('#viewModal').on('show.bs.modal', function(e)
				{	
					$('#viewImage, #viewFrame').remove();
				})
			
			$('#viewModal').on('shown.bs.modal', function(e)
				{
					var viewindex = $(e.relatedTarget).attr('data-viewindex');
					var attachment = dataForReply.attachments[viewindex];
					var src = localAttachments[attachment.id];
					
					$('#viewImage, #viewFrame').remove();
					
					if ( attachment.type.match(/image\//) )
						{
							$('#viewModal .modal-body').append('<img id="viewImage" src="'+src+'"/>');
						}
					else if ( attachment.type.match(/officedocument.wordprocessingml/) || attachment.type.match(/officedocument.spreadsheetml/) )
						{
							src = 'https://docs.google.com/gview?url='+src+'&embedded=true'
							$('#viewModal .modal-body').append('<iframe id="viewFrame" src="'+src+'"></iframe>');
						}
					else
						{
							$('#viewModal .modal-body').append('<iframe id="viewFrame" src="'+src+'"></iframe>');
						}
				})
			
			function sizeFromBytes(bytes)
				{
					if ( bytes < 1024 ) return Math.floor(bytes) + 'b';
					
					bytes = Math.floor(bytes/1024);
					
					if ( bytes < 1024 ) return bytes+'KB';
					
					bytes = bytes/1024;
					
					if ( bytes < 1024 ) return bytes.toFixed(1)+'MB';
				}
			
			function currentUserMail(data, id)
				{
					if ( !data  || !id ) return [];
					
					if ( data[id] && $.type(data[id]) == 'array' ) return data[id];
					
					return [];
				}
			
			setTimeout(function()
				{
					if ( LOGGED && LOGGED['rememberMe'] )
						{
							$('.active').removeClass('active')
							$('#mail').addClass('active')
							updateAppView(LOGGED);

							getUserLabels(LOGGED);
							getAllBoxes();
							// Get emails and email ids
							userEmails = currentUserMail(db.get('userEmails'), LOGGED['uniqueId']);
							userEmailsIds = currentUserMail(db.get('userEmailsIds'), LOGGED['uniqueId']);
							updateEmailsView(userEmails);
							
							updateNewMails(true);
						}
					else
						{
							$('.active').removeClass('active')
							$('#login').addClass('active')
						}
				}, 300);
		});
})();