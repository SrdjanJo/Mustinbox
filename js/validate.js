(function ()
{
	// $(document).ready(function()
   document.addEventListener('deviceready', function()
		{
			var validateFn = {
				email: function(val)
					{
						var regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
						return regex.test(val.trim());
					},
				password: function(val)
					{
						var regex = /.{5}/;
						var regex2 = /\s/;
						return regex.test(val) && !regex2.test(val);
					},
				checkbox: function(th)
					{
						return th.prop('checked');
					},
				name: function(val)
					{
						var regex =  /[^ '.A-Za-z1-9-]/;
						return !regex.test(val) && val.length > 0;
					},
				confirm: function(val, data, comp_val)
					{
						return data[comp_val] && data[comp_val] === val;
					},
				message: function(val)
					{
						//var regex =  /\.{10,}/;
						return val.trim().length > 10;
					}
			}
			
			$.fn.validate = function()
				{
					var data = {};
					this.find('[data-validate]').each(function()
						{
							var th = $(this),
							    value = th.val(),
								val_arr = th.attr('data-validate').split('-'),
								val_fn = val_arr[0],
								val_option = val_arr.length > 1 ? val_arr[1] : false,
								save = true,
								is_valid = false;

							if ( !validateFn[val_fn] ) 
								{
									console.error('Not supported validation function');
									return true;
								}
							
							// IF ELEMENT IS CHECKBOX DONT SAVE ITS VALUE
							if ( val_fn == 'checkbox' ) { value = th; save = false; }
							
							if ( val_option === 'optional' && value.trim().length == 0 ) 
								{
									return true;
								}
							
							if ( val_fn == 'confirm' ) { is_valid = validateFn[val_fn](value, data, val_option); save = false; }
							else { is_valid = validateFn[val_fn](value); }

							th.toggleClass('is-invalid', !is_valid).toggleClass('is-valid', is_valid);
							// IF VALUE IS VALID SAVE ITS VALUE TO DATA
							if ( is_valid && save )
								{
									var name = th.attr('data-validate_name');
									if ( name ) val_fn = name;
									
									data[val_fn] = value;
								}
						})
					return data;
				}
			
			$.fn.emptyAll = function(find)
				{
					if ( !find ) find = '';
					this.find('[data-validate]'+find).val('').html('').removeClass('md-has-value is-valid is-invalid');
					this.find('[data-validate]').removeClass('md-has-value is-valid is-invalid');
				}
			
			$(document).on('focus', '[data-validate]', function()
				{
					$(this).removeClass('is-invalid');
				})
		})
})();