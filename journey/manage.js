(() => {
  'use strict';
  const staff = document.body.dataset.dashboard === 'staff';
  const $ = id => document.getElementById(id);
  const copy = {
    en: { logout:'Log out', yourCare:'YOUR CAR CARE, IN ONE PLACE', myAppointments:'My appointments', manageIntro:'Your next wash, your check-in pass, and every fresh start before it.', newBooking:'Book a wash', active:'Active bookings', past:'Past washes', refresh:'Refresh', loading:'Loading appointments…', staffArea:'STAFF / CHECK-IN', todayBookings:"Today’s bookings", scan:'Scan QR code', searchLabel:'Find a customer by phone number', search:'Search', clear:'Show all', arrivalQueue:'Arrival queue', booked:'Booked', checked_in:'Checked in', completed:'Completed · paid', cancelled:'Cancelled', missed:'Missed', exterior:'Exterior wash', interior:'Interior wash', full:'Full wash', tires:'Tire shine', wax:'Premium wax', qr:'View check-in pass', cancel:'Cancel', reschedule:'Reschedule', receipt:'View receipt', checkin:'Check in', complete:'Complete & record payment', noActive:'No active bookings', noPast:'No past washes yet', noStaff:'No matching bookings today', emptyHint:'Your appointments will appear here.', emptyPast:'Completed, cancelled, and missed visits appear here.', timeZone:'Tripoli time', phone:'Customer phone', vehicle:'Vehicle', package:'Wash package', date:'Date', time:'Time', extras:'Extras', total:'Total', pass:'Your check-in pass', passHint:'Show this QR code to a member of staff when you arrive.', grace:'Check-in opens 1 hour before your appointment and closes 30 minutes after it.', save:'Save new time', chooseTime:'Choose a time', chooseDate:'Choose a date', cancelTitle:'Cancel this appointment?', cancelHint:'Your reserved time will be released. You can book another wash at any time.', confirmCancel:'Yes, cancel appointment', keep:'Keep appointment', cancelledMessage:'Appointment cancelled.', rescheduledMessage:'Appointment rescheduled. Your check-in QR code has been updated.', checking:'Checking in…', checkedMessage:'Customer checked in.', already:'This customer is already checked in.', paymentTitle:'Complete this wash?', paymentHint:'Confirm that the wash is finished and payment has been collected. This issues a paid receipt.', paid:'Payment collected', confirmPaid:'Complete wash & issue receipt', completedMessage:'Wash completed. The receipt is now available to the customer.', receiptTitle:'Wash receipt', receiptNumber:'Receipt number', paidAt:'Paid on', payment:'Payment', paidInPerson:'Paid at the wash', print:'Print / save PDF', base:'Vehicle base price', packageExtra:'Wash package supplement', smsOff:'SMS reminders are not available yet. Check your appointment details here.', smsStaff:'SMS delivery is not configured. Set the Twilio credentials on the server to enable one-hour reminders.', smsIssues:'Some reminders need attention. Check the reminder log and provider delivery status.', smsOn:'SMS reminder requested for approximately 1 hour before your appointment.', smsNone:'SMS reminder not requested.', close:'Close', scannerHint:'Point the camera at the customer’s booking QR code. A valid scan checks the customer in automatically.', cameraError:'Camera unavailable or permission denied. Search by phone number, or select a QR image below.', scanImage:'Scan a QR image', noCode:'No QR code found. Try a clearer image or search by phone.', processing:'Please wait…', network:'Unable to connect. Check your connection and try again.', noSlots:'No available times on this date.', staffOnly:'This account does not have staff access.', login:'Log in', staffLogin:'Staff login', noReceipt:'Receipts are issued after a completed, paid wash.', receiptNote:'Payment recorded by staff. No online charge was made.', staffSearchHint:'Use the full phone number, including the country code or the local 09 prefix.' },
    ar: { logout:'تسجيل الخروج', yourCare:'كل العناية بسيارتك في مكان واحد', myAppointments:'مواعيدي', manageIntro:'غسلتك القادمة، ورمز الدخول، وسجل العناية بسيارتك.', newBooking:'احجز غسلة', active:'الحجوزات النشطة', past:'الغسلات السابقة', refresh:'تحديث', loading:'جارٍ تحميل المواعيد…', staffArea:'الموظفون / تسجيل الوصول', todayBookings:'حجوزات اليوم', scan:'مسح رمز QR', searchLabel:'ابحث عن العميل برقم الهاتف', search:'بحث', clear:'عرض الكل', arrivalQueue:'قائمة الوصول', booked:'محجوز', checked_in:'تم تسجيل الوصول', completed:'مكتمل · مدفوع', cancelled:'ملغى', missed:'فات الموعد', exterior:'غسيل خارجي', interior:'غسيل داخلي', full:'غسيل كامل', tires:'تلميع الإطارات', wax:'شمع فاخر', qr:'عرض رمز الوصول', cancel:'إلغاء', reschedule:'تغيير الموعد', receipt:'عرض الإيصال', checkin:'تسجيل الوصول', complete:'إكمال وتسجيل الدفع', noActive:'لا توجد حجوزات نشطة', noPast:'لا توجد غسلات سابقة', noStaff:'لا توجد حجوزات مطابقة اليوم', emptyHint:'ستظهر مواعيدك هنا.', emptyPast:'تظهر هنا الزيارات المكتملة والملغاة والفائتة.', timeZone:'بتوقيت طرابلس', phone:'هاتف العميل', vehicle:'السيارة', package:'باقة الغسيل', date:'التاريخ', time:'الوقت', extras:'الإضافات', total:'الإجمالي', pass:'رمز تسجيل الوصول', passHint:'أظهر هذا الرمز لأحد الموظفين عند وصولك.', grace:'يُفتح تسجيل الوصول قبل الموعد بساعة ويُغلق بعده بنصف ساعة.', save:'حفظ الموعد الجديد', chooseTime:'اختر الوقت', chooseDate:'اختر التاريخ', cancelTitle:'إلغاء هذا الموعد؟', cancelHint:'سيُتاح موعدك للآخرين. يمكنك حجز غسلة جديدة في أي وقت.', confirmCancel:'نعم، إلغاء الموعد', keep:'الاحتفاظ بالموعد', cancelledMessage:'تم إلغاء الموعد.', rescheduledMessage:'تم تغيير الموعد وتحديث رمز الوصول.', checking:'جارٍ تسجيل الوصول…', checkedMessage:'تم تسجيل وصول العميل.', already:'تم تسجيل وصول هذا العميل مسبقاً.', paymentTitle:'إكمال هذه الغسلة؟', paymentHint:'أكد اكتمال الغسيل واستلام الدفع لإصدار إيصال مدفوع.', paid:'تم استلام الدفع', confirmPaid:'إكمال الغسيل وإصدار الإيصال', completedMessage:'اكتمل الغسيل. الإيصال متاح الآن للعميل.', receiptTitle:'إيصال الغسيل', receiptNumber:'رقم الإيصال', paidAt:'تاريخ الدفع', payment:'الدفع', paidInPerson:'مدفوع في المركز', print:'طباعة / حفظ PDF', base:'السعر الأساسي للسيارة', packageExtra:'إضافة باقة الغسيل', smsOff:'تذكيرات الرسائل غير متاحة بعد. راجع تفاصيل موعدك هنا.', smsStaff:'الرسائل غير مفعلة. اضبط بيانات Twilio على الخادم لتفعيل التذكير قبل الموعد بساعة.', smsIssues:'بعض التذكيرات تحتاج إلى مراجعة. تحقق من سجل التذكيرات وحالة التسليم لدى المزود.', smsOn:'تم طلب تذكير برسالة قبل الموعد بساعة تقريباً.', smsNone:'لم يُطلب تذكير برسالة.', close:'إغلاق', scannerHint:'وجّه الكاميرا إلى رمز حجز العميل. يسجل المسح الصحيح وصول العميل تلقائياً.', cameraError:'الكاميرا غير متاحة أو لم يُسمح بالوصول. ابحث بالهاتف أو اختر صورة للرمز أدناه.', scanImage:'مسح صورة رمز QR', noCode:'لم يُعثر على رمز. جرّب صورة أوضح أو ابحث بالهاتف.', processing:'يرجى الانتظار…', network:'تعذّر الاتصال. تحقق من اتصالك وحاول مجدداً.', noSlots:'لا توجد أوقات متاحة لهذا اليوم.', staffOnly:'هذا الحساب غير مصرح له بدخول الموظفين.', login:'تسجيل الدخول', staffLogin:'دخول الموظفين', noReceipt:'تصدر الإيصالات بعد اكتمال الغسيل واستلام الدفع.', receiptNote:'سجّل الموظف الدفع. لم يُخصم أي مبلغ إلكترونياً.', staffSearchHint:'استخدم رقم الهاتف كاملاً مع رمز الدولة أو البادئة المحلية 09.' }
  };
  Object.assign(copy.en, { car:'Normal car', suv:'SUV', pickup:'Pickup truck', van:'Van', minivan:'Minivan' });
  Object.assign(copy.ar, { car:'سيارة عادية', suv:'دفع رباعي', pickup:'بيك أب', van:'فان', minivan:'ميني فان' });
  let language = 'en'; try { language = localStorage.getItem('naqa-language') === 'ar' ? 'ar' : 'en'; } catch {}
  const t = key => copy[language][key] || key;
  const money = quote => new Intl.NumberFormat(language === 'ar' ? 'ar-LY' : 'en-US', { style:'currency', currency:quote.currency }).format(quote.total);
  const dateText = date => new Intl.DateTimeFormat(language === 'ar' ? 'ar-LY' : 'en-GB', { day:'numeric', month:'short', year:'numeric', timeZone:'UTC' }).format(new Date(date + 'T12:00:00Z'));
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  let rows = [], tab = 'active', sms = false, issues = 0, stream, frame, scannerGeneration = 0, loadGeneration = 0;
  let authorized = false;
  async function api(path, body) {
    let res;
    try { res = await fetch('/api/' + path, { method:body === undefined ? 'GET' : 'POST', headers:body === undefined ? {} : { 'Content-Type':'application/json' }, body:body === undefined ? undefined : JSON.stringify(body), signal:AbortSignal.timeout(20000) }); }
    catch { throw new Error(t('network')); }
    const data = await res.json();
    if (res.status === 401) { location.assign('login.html' + (staff ? '?staff=1' : '')); throw new Error(t('login')); }
    if (!res.ok) throw new Error(data.error || t('network'));
    return data;
  }
  function setError(message, id = 'page-error') { const node = $(id); node.textContent = message; node.hidden = !message; }
  function localize() {
    document.documentElement.lang = language; document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.title = t(staff ? 'todayBookings' : 'myAppointments') + ' | Naqa Qurtuba';
    document.querySelectorAll('[data-m]').forEach(el => { el.textContent = t(el.dataset.m); });
    $('language').textContent = language === 'ar' ? 'EN' : 'العربية';
    $('close-dialog').setAttribute('aria-label', t('close'));
    render();
  }
  function render() {
    if (!authorized) return;
    const notice = !sms ? t(staff ? 'smsStaff' : 'smsOff') : staff && issues ? t('smsIssues') : '';
    $('reminder-notice').textContent = notice; $('reminder-notice').hidden = !notice;
    const active = row => ['booked','checked_in'].includes(row.status);
    const visible = staff ? rows : rows.filter(row => tab === 'active' ? active(row) : !active(row));
    visible.sort((a,b) => tab === 'past' && !staff ? b.starts-a.starts : a.starts-b.starts);
    if (!visible.length) { $('bookings').innerHTML = `<div class="empty-state"><h2>${t(staff ? 'noStaff' : tab === 'active' ? 'noActive' : 'noPast')}</h2><p>${t(staff ? 'staffSearchHint' : tab === 'active' ? 'emptyHint' : 'emptyPast')}</p></div>`; return; }
    $('bookings').innerHTML = visible.map(row => {
      const v = row.vehicle;
      const button = (action, label, primary = false) => `<button type="button" class="${primary ? 'primary-button' : 'back-button'}" data-action="${action}" data-id="${row.id}">${t(label)}</button>`;
      let actions = '';
      if (staff) {
        if (row.status === 'booked' && Date.now() >= row.starts - 3600000 && Date.now() <= row.starts + 1800000) actions += button('checkin','checkin',true);
        if (row.status === 'checked_in') actions += button('complete','complete',true);
      } else {
        if (active(row)) actions += button('qr','qr',true);
        if (row.status === 'booked' && row.starts > Date.now()) actions += button('reschedule','reschedule') + button('cancel','cancel');
        if (row.status === 'completed') actions += button('receipt','receipt',true);
      }
      return `<article class="booking-card"><div class="booking-date">${escape(dateText(row.date))}<strong>${row.time}</strong><small class="muted">${t('timeZone')}</small></div><div><h2>${t(row.package)}</h2><p>${escape(t(v.type))}</p><p class="booking-meta">${escape(money(row.quote))}</p>${staff ? `<p>${t('phone')}: <bdi>${escape(row.phone)}</bdi></p>` : ''}<span class="status-chip status-${row.status}">${t(row.status)}</span></div><div class="booking-actions">${actions}</div></article>`;
    }).join('');
  }
  async function load() {
    const generation = ++loadGeneration;
    setError(''); $('refresh').disabled = true;
    try {
      const query = staff && $('phone-search').value.trim() ? '?phone=' + encodeURIComponent($('phone-search').value.trim()) : '';
      const data = await api(staff ? 'staff/bookings' + query : 'appointments');
      if (generation !== loadGeneration) return;
      rows = data.appointments; sms = data.smsConfigured; issues = data.reminderIssues || 0;
      if (staff) $('today-date').textContent = dateText(data.date) + ' · ' + t('timeZone');
      render();
    } catch (err) { if (generation === loadGeneration) setError(err.message); }
    finally { if (generation === loadGeneration) $('refresh').disabled = false; }
  }
  function details(row) {
    const v = row.vehicle;
    return `<dl class="pass-details">${[['date',dateText(row.date)],['time',row.time + ' · ' + t('timeZone')],['package',t(row.package)],['vehicle',t(v.type)],['extras',row.quote.addons.map(a=>t(a.id)).join(', ') || '—'],['phone',row.phone]].map(([key,value])=>`<div><dt>${t(key)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>`;
  }
  function stopCamera() { scannerGeneration++; cancelAnimationFrame(frame); stream?.getTracks().forEach(track=>track.stop()); stream = null; }
  function close() { stopCamera(); $('booking-dialog').close(); }
  function open(title, html) {
    stopCamera();
    $('dialog-content').innerHTML = `<h2 id="dialog-title">${escape(title)}</h2>${html}<p id="dialog-error" class="error" role="alert" hidden></p>`;
    if (!$('booking-dialog').open) $('booking-dialog').showModal();
  }
  async function mutate(button, path, body, message) {
    button.disabled = true; setError('', 'dialog-error');
    try { const result = await api(path,body); close(); $('page-status').textContent = t(result.alreadyCheckedIn ? 'already' : message); await load(); }
    catch (err) { setError(err.message, 'dialog-error'); button.disabled = false; }
  }
  async function act(action, row) {
    setError('');
    try {
      if (action === 'qr') {
        const data = await api(`appointments/${row.id}/qr`); row = data.appointment;
        open(t('pass'), `<p class="muted">${t('passHint')}</p><img class="pass-qr" src="${data.image}" alt="${t('pass')}" width="320" height="320">${details(row)}<p class="muted">${t('grace')}</p><p class="muted">${t(row.reminder && sms ? 'smsOn' : row.reminder ? 'smsOff' : 'smsNone')}</p>${row.status === 'booked' && row.starts > Date.now() ? `<div class="booking-actions"><button id="pass-reschedule" class="back-button">${t('reschedule')}</button><button id="pass-cancel" class="back-button">${t('cancel')}</button></div>` : ''}`);
        $('pass-reschedule')?.addEventListener('click',()=>act('reschedule',row)); $('pass-cancel')?.addEventListener('click',()=>act('cancel',row));
      } else if (action === 'cancel') {
        open(t('cancelTitle'), `<p>${t('cancelHint')}</p>${details(row)}<button class="primary-button" id="confirm-action">${t('confirmCancel')}</button><button class="back-button" id="keep-booking">${t('keep')}</button>`);
        $('confirm-action').onclick = event => mutate(event.target,`appointments/${row.id}/cancel`,{},'cancelledMessage');
        $('keep-booking').onclick = close;
      } else if (action === 'reschedule') {
        const now = new Date(); const date = new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Tripoli',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
        const max = new Date(now.getTime()+30*86400000).toISOString().slice(0,10);
        open(t('reschedule'), `<p class="muted">${t('timeZone')}</p><form id="reschedule-form"><label for="new-date">${t('chooseDate')}</label><input type="date" id="new-date" min="${date}" max="${max}" value="${row.date}" required><label for="new-time">${t('chooseTime')}</label><select id="new-time" required></select><button id="confirm-action" class="primary-button">${t('save')}</button></form>`);
        let generation = 0;
        const times = async () => {
          const current = ++generation; const select = $('new-time'); const button = $('confirm-action');
          button.disabled = true; select.replaceChildren();
          try { const data = await api('availability?date=' + encodeURIComponent($('new-date').value) + '&exclude=' + row.id); if (current !== generation || !select.isConnected) return;
            const slots = data.slots.filter(slot=>slot.available);
            select.replaceChildren(...slots.map(slot=>new Option(slot.time,slot.time)));
            if (slots.some(slot=>slot.time===row.time)) select.value=row.time;
            button.disabled = !slots.length; setError(slots.length ? '' : t('noSlots'),'dialog-error');
          } catch(err) { if(select.isConnected) setError(err.message,'dialog-error'); }
        };
        $('new-date').onchange = times;
        $('reschedule-form').onsubmit = event => { event.preventDefault(); mutate($('confirm-action'),`appointments/${row.id}/reschedule`,{date:$('new-date').value,time:$('new-time').value},'rescheduledMessage'); };
        await times();
      } else if (action === 'receipt') {
        const data = await api(`appointments/${row.id}/receipt`); row = data.appointment;
        open(t('receiptTitle'), `<p>NAQA QURTUBA · TRIPOLI</p><p class="muted">${t('receiptNumber')}: ${escape(data.receipt)}</p>${details(row)}<dl class="pass-details">${[['base',row.quote.base],['packageExtra',row.quote.package],...row.quote.addons.map(a=>[a.id,a.price])].map(([key,value])=>`<div><dt>${t(key)}</dt><dd>${escape(money({...row.quote,total:value}))}</dd></div>`).join('')}<div class="receipt-total"><dt>${t('total')}</dt><dd>${escape(money(row.quote))}</dd></div><div><dt>${t('payment')}</dt><dd>${t('paidInPerson')}</dd></div><div><dt>${t('paidAt')}</dt><dd>${escape(new Date(row.completed).toLocaleString(language === 'ar' ? 'ar-LY' : 'en-GB',{timeZone:'Africa/Tripoli'}))}</dd></div></dl><p>${t('receiptNote')}</p><button class="primary-button" id="print-receipt">${t('print')}</button>`);
        $('print-receipt').onclick = () => window.print();
      } else if (action === 'checkin') {
        open(t('checkin'), `${details(row)}<button class="primary-button" id="confirm-action">${t('checkin')}</button>`);
        $('confirm-action').onclick = event=>mutate(event.target,'staff/check-in',{id:row.id},'checkedMessage');
      } else if (action === 'complete') {
        open(t('paymentTitle'), `<p>${t('paymentHint')}</p>${details(row)}<p class="receipt-total">${t('total')}: ${escape(money(row.quote))}</p><form id="payment-form"><label><input type="checkbox" required id="paid-confirm"> ${t('paid')}</label><button class="primary-button" id="confirm-action">${t('confirmPaid')}</button></form>`);
        $('payment-form').onsubmit = event => { event.preventDefault(); mutate($('confirm-action'),'staff/complete',{id:row.id,paid:$('paid-confirm').checked},'completedMessage'); };
      }
    } catch(err) { setError(err.message); }
  }
  async function scan() {
    open(t('scan'), `<p>${t('scannerHint')}</p><video id="scanner-video" class="scanner-video" autoplay muted playsinline></video><p id="scan-feedback" role="status"></p><label for="qr-file">${t('scanImage')}</label><input type="file" accept="image/*" id="qr-file">`);
    const generation = scannerGeneration;
    let reading = false, lastCode = '', lastAt = 0;
    const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d',{willReadFrequently:true});
    const handleCode = async code => {
      if (reading || !code || (code===lastCode && Date.now()-lastAt<5000)) return;
      reading=true; lastCode=code; lastAt=Date.now(); $('scan-feedback').textContent=t('checking');
      try { const result = await api('staff/check-in',{qr:code}); stopCamera(); close(); $('page-status').textContent=t(result.alreadyCheckedIn?'already':'checkedMessage') + ' ' + result.appointment.phone; await load(); }
      catch(err) { if($('scan-feedback')) $('scan-feedback').textContent=err.message; }
      finally { reading=false; }
    };
    const decode = source => {
      const width=source.videoWidth||source.width, height=source.videoHeight||source.height;
      const scale=Math.min(1,960/Math.max(width,height)); canvas.width=Math.round(width*scale); canvas.height=Math.round(height*scale);
      if(!canvas.width||!canvas.height) return null;
      ctx.drawImage(source,0,0,canvas.width,canvas.height);
      const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
      return window.jsQR(pixels.data,canvas.width,canvas.height,{inversionAttempts:'attemptBoth'})?.data;
    };
    $('qr-file').onchange=async event=>{
      const file=event.target.files[0]; if(!file) return;
      try { if(file.size>15000000) throw new Error(t('noCode')); const bitmap=await createImageBitmap(file); const code=decode(bitmap); bitmap.close(); if(code) await handleCode(code); else $('scan-feedback').textContent=t('noCode'); }
      catch { if($('scan-feedback')) $('scan-feedback').textContent=t('noCode'); }
    };
    try {
      if(!navigator.mediaDevices?.getUserMedia || !window.jsQR) throw new Error('camera');
      const camera=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
      if(generation!==scannerGeneration) { camera.getTracks().forEach(track=>track.stop()); return; }
      stream=camera; const video=$('scanner-video'); video.srcObject=stream; await video.play();
      let lastFrame=0;
      const loop=time=>{ if(generation!==scannerGeneration) return; if(!reading && video.readyState>=2 && time-lastFrame>200) { lastFrame=time; const code=decode(video); if(code) handleCode(code); } frame=requestAnimationFrame(loop); };
      frame=requestAnimationFrame(loop);
    } catch { if(generation===scannerGeneration) $('scan-feedback').textContent=t('cameraError'); }
  }
  $('close-dialog').onclick=close; $('booking-dialog').addEventListener('close',stopCamera);
  window.addEventListener('pagehide',stopCamera);
  document.addEventListener('visibilitychange',()=>{if(document.hidden) {if(stream) close();} else if(authorized) load();});
  $('language').onclick=()=>{ close(); language=language==='en'?'ar':'en'; try{localStorage.setItem('naqa-language',language);}catch{} localize(); if(staff) load(); };
  $('logout').onclick=async()=>{try{await api('logout',{});location.assign('index.html');}catch(err){setError(err.message);}};
  $('refresh').onclick=load;
  document.querySelectorAll('[data-tab]').forEach(button=>button.onclick=()=>{tab=button.dataset.tab;document.querySelectorAll('[data-tab]').forEach(el=>el.removeAttribute('aria-current'));button.setAttribute('aria-current','page');render();});
  $('bookings').onclick=event=>{const button=event.target.closest('[data-action]');if(button) act(button.dataset.action,rows.find(row=>row.id===button.dataset.id));};
  if(staff) { $('search-form').onsubmit=event=>{event.preventDefault();load();};$('clear-search').onclick=()=>{$('phone-search').value='';load();};$('scan').onclick=scan; }
  localize();
  (async()=>{
    try { const {user}=await api('session'); if(!user){location.assign('login.html'+(staff?'?staff=1':''));return;}
      if(staff&&user.role!=='staff'){ $('bookings').replaceChildren(); $('scan').disabled=true; throw new Error(t('staffOnly')); }
      authorized=true; $('signed-in-phone').textContent=user.phone; await load();
      setInterval(()=>{if(!document.hidden&&!$('booking-dialog').open)load();},30000);
    }catch(err){setError(err.message);}
  })();
})();
