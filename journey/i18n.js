/* ====================================================================
   LOCALIZATION — central catalog for visible text and accessible labels.
   Only language preference is stored; customer details are never stored.
   Use data-t="key" for text and data-label="key" for accessible names.
   ==================================================================== */
(() => {
  'use strict';
  const catalog = {
    en: {
      pageTitle:'Naqa Qurtuba | The Wash Lab', skip:'Skip to booking', brand:'NAQA QURTUBA',brandSub:'CAR CARE / TRIPOLI',lab:'THE WASH LAB',help:'Need a hand?',language:'Language',
      introLabel:'A LITTLE PLAY. A LOT OF SHINE.',intro:'Your car. Your clean.',prototype:'Interactive preview · sample USD prices',steps:'Booking steps',carStage:'Interactive vehicle',livePreview:'LIVE CONFIGURATION',topView:'TOP VIEW / INTERACTIVE',
      step1:'Your ride',step2:'Your wash',step3:'The extras',step4:'Your time',
      title1:'What are you driving?',title2:'Where should we shine?',title3:'Make it unmistakable.',title4:'Let’s make a date.',
      desc1:'Start at the hood. Pick your vehicle and we’ll take care of the details.',desc2:'Your car is the control. Tap the body or open the doors to choose your clean.',desc3:'A little shine goes a long way. Touch the wheels or the roof to finish your wash.',desc4:'Choose a day and time. We’ll leave the payment until you arrive.',
      kicker1:'01 / THE HOOD',kicker2:'02 / THE DOORS',kicker3:'03 / THE FINISH',kicker4:'04 / THE DASHBOARD',
      view1:'HOOD / VEHICLE',view2:'DOORS / COVERAGE',view3:'WHEELS / PAINT',view4:'DASHBOARD / SCHEDULE',
      hint1:'Find your silhouette',hint2:'Tap the body or a door',hint3:'Tap tires + roof',hint4:'Your next fresh start',
      previousVehicle:'Previous vehicle',nextVehicle:'Next vehicle',vehicleTypes:'Vehicle types',basePrice:'Vehicle base price',vehicleNote:'Cycle through the silhouettes. Find your ride.',
      car:'Normal Car',suv:'SUV',pickup:'Pickup Truck',van:'Van',minivan:'Minivan',
      washPackage:'Wash package',exterior:'Exterior Only',interior:'Interior Only',full:'Full Wash (Both)',
      exteriorDesc:'Body, wheels & hand dry',interiorDesc:'Vacuum, surfaces & glass',fullDesc:'The complete inside-out refresh',
      doorHint:'Tap the body for exterior. Tap a door for interior. Select both for a full wash.',
      extrasHint:'Tap a tire to add shine, or tap the roof for wax. Tap again to remove.',optional:'ALL EXTRAS ARE OPTIONAL',
      tires:'Tire Shine',wax:'Premium Wax',tiresDesc:'A deep, satin-black tire finish.',waxDesc:'A glossy finish with extra protection.',
      exteriorControl:'Toggle exterior wash on the car body',interiorControl:'Toggle interior wash by opening the doors',tiresControl:'Toggle Tire Shine, plus $5',waxControl:'Toggle Premium Wax, plus $10',
      previousMonth:'Previous month',nextMonth:'Next month',chooseDate:'Choose a date',time:'Choose a time',timezone:'Tripoli time',chooseDateFirst:'Pick a day to see available times.',noTimes:'No times remain. Please choose another day.',
      arrivalTitle:'30-MINUTE GRACE PERIOD',policy:'Appointments have a strict 30-minute grace period. If you are more than 30 minutes late, your spot will be forfeited.',
      reminder:'Send me a reminder',reminderSub:'Optional SMS or email',channel:'Reminder channel',sms:'SMS',email:'Email',phone:'Phone number',emailAddress:'Email address',reminderDemo:'Preview only. No messages are sent.',
      accept:'I accept the arrival policy and payment at the location.',payShort:'PAY AT THE WASH. NO CARD NEEDED.',estimate:'YOUR WASH ESTIMATE',currency:'USD / sample',back:'Back',continue:'Continue',confirm:'Confirm preview',
      demo:'Prototype only. No appointment is reserved. Call 091 210 3120 to book with the team.',close:'Close confirmation',finishLabel:'YOUR NEXT FRESH START',finishTitle:'Looking sharp.',previewOnly:'Your booking preview is ready. No appointment has been reserved.',payment:'Pay in person at the car wash location.',callBook:'Call to book: 091 210 3120',edit:'Edit my selection',
      vehicle:'Vehicle',wash:'Wash package',extras:'Extras',appointment:'Appointment',reminders:'Reminders',total:'Total estimate',none:'None',off:'Not requested',previewSuffix:'(preview only)',base:'base',selected:'Selected',notSelected:'Not selected',
      errorPackage:'Choose exterior, interior, or both to continue.',errorDate:'Choose an available day and time.',errorPolicy:'Please accept the arrival and payment policy.',errorPhone:'Enter a valid phone number (7–15 digits).',errorEmail:'Enter a valid email address.',
      noPackage:'Select a wash package',noExtras:'No extras',stepOf:'STEP',of:'OF',calendarNote:'Sample availability · next 30 days'
    },
    ar: {
      pageTitle:'نقاء قرطبة | مختبر العناية',skip:'انتقل إلى الحجز',brand:'نقاء قرطبة',brandSub:'العناية بالسيارات / طرابلس',lab:'مختبر العناية',help:'تحتاج مساعدة؟',language:'اللغة',
      introLabel:'تجربة ممتعة. ولمعان يليق بك.',intro:'سيارتك. عناية على ذوقك.',prototype:'تجربة تفاعلية · أسعار توضيحية بالدولار',steps:'خطوات الحجز',carStage:'السيارة التفاعلية',livePreview:'تخصيص مباشر',topView:'من الأعلى / تفاعلي',
      step1:'سيارتك',step2:'غسلتك',step3:'الإضافات',step4:'موعدك',title1:'ما نوع سيارتك؟',title2:'أين تريد لمستنا؟',title3:'أضف لمستك الخاصة.',title4:'لنختَر موعداً.',
      desc1:'نبدأ من المقدّمة. اختر نوع سيارتك ودع التفاصيل لنا.',desc2:'سيارتك هي لوحة التحكّم. المس الهيكل أو افتح الأبواب لاختيار الغسيل.',desc3:'لمسة صغيرة تصنع فرقاً. المس الإطارات أو السقف لإضافة العناية.',desc4:'اختر اليوم والوقت المناسبين. الدفع عند وصولك إلى المركز.',
      kicker1:'٠١ / مقدّمة السيارة',kicker2:'٠٢ / الأبواب',kicker3:'٠٣ / اللمسات الأخيرة',kicker4:'٠٤ / لوحة القيادة',
      view1:'المقدّمة / نوع السيارة',view2:'الأبواب / نطاق الغسيل',view3:'الإطارات / الطلاء',view4:'لوحة القيادة / الموعد',
      hint1:'اختر شكل سيارتك',hint2:'المس الهيكل أو أحد الأبواب',hint3:'المس الإطارات والسقف',hint4:'بداية جديدة تنتظرك',
      previousVehicle:'السيارة السابقة',nextVehicle:'السيارة التالية',vehicleTypes:'أنواع السيارات',basePrice:'السعر الأساسي للسيارة',vehicleNote:'تصفّح الأشكال واختر سيارتك.',
      car:'سيارة عادية',suv:'دفع رباعي',pickup:'بيك أب',van:'فان',minivan:'ميني فان',washPackage:'باقة الغسيل',exterior:'غسيل خارجي فقط',interior:'غسيل داخلي فقط',full:'غسيل كامل',
      exteriorDesc:'الهيكل والعجلات وتجفيف يدوي',interiorDesc:'المكنسة والأسطح والزجاج',fullDesc:'عناية متكاملة من الداخل والخارج',doorHint:'المس الهيكل للغسيل الخارجي، والباب للداخلي. اختر الاثنين لغسيل كامل.',
      extrasHint:'المس الإطار لتلميعه أو السقف لإضافة الشمع. المس مرة أخرى للإزالة.',optional:'جميع الإضافات اختيارية',tires:'تلميع الإطارات',wax:'شمع فاخر',tiresDesc:'لمسة سوداء ساتانية لإطاراتك.',waxDesc:'لمعان إضافي مع طبقة حماية.',
      exteriorControl:'تبديل الغسيل الخارجي بلمس الهيكل',interiorControl:'تبديل الغسيل الداخلي بفتح الأبواب',tiresControl:'تبديل تلميع الإطارات، إضافة ٥ دولارات',waxControl:'تبديل الشمع الفاخر، إضافة ١٠ دولارات',
      previousMonth:'الشهر السابق',nextMonth:'الشهر التالي',chooseDate:'اختر تاريخاً',time:'اختر الوقت',timezone:'بتوقيت طرابلس',chooseDateFirst:'اختر يوماً لعرض الأوقات المتاحة.',noTimes:'لا توجد أوقات متبقية. اختر يوماً آخر.',
      arrivalTitle:'مهلة سماح مدتها ٣٠ دقيقة',policy:'توجد مهلة سماح صارمة مدتها ٣٠ دقيقة للموعد. إذا تأخرت أكثر من ٣٠ دقيقة، فستفقد موعدك المحجوز.',
      reminder:'أرسل لي تذكيراً',reminderSub:'رسالة نصية أو بريد إلكتروني، اختيارياً',channel:'طريقة التذكير',sms:'رسالة نصية',email:'البريد الإلكتروني',phone:'رقم الهاتف',emailAddress:'عنوان البريد الإلكتروني',reminderDemo:'تجربة فقط. لا تُرسل أي رسائل.',
      accept:'أوافق على سياسة الحضور والدفع في المركز.',payShort:'الدفع في المركز. لا تحتاج إلى بطاقة.',estimate:'التكلفة التقديرية لغسلتك',currency:'دولار / مثال',back:'السابق',continue:'متابعة',confirm:'تأكيد التجربة',
      demo:'نسخة تجريبية فقط. لا يُحجز موعد فعلي. اتصل على 091 210 3120 للحجز مع الفريق.',close:'إغلاق التأكيد',finishLabel:'بداية جديدة لسيارتك',finishTitle:'إطلالة تستحقها.',previewOnly:'اكتملت تجربة الحجز. لم يُحجز أي موعد فعلي.',payment:'يُرجى الدفع شخصياً في مركز غسيل السيارات.',callBook:'اتصل للحجز: 091 210 3120',edit:'تعديل اختياراتي',
      vehicle:'السيارة',wash:'باقة الغسيل',extras:'الإضافات',appointment:'الموعد',reminders:'التذكيرات',total:'الإجمالي التقديري',none:'لا توجد',off:'غير مطلوبة',previewSuffix:'(تجربة فقط)',base:'الأساس',selected:'محدد',notSelected:'غير محدد',
      errorPackage:'اختر الغسيل الخارجي أو الداخلي أو كليهما للمتابعة.',errorDate:'اختر يوماً ووقتاً متاحين.',errorPolicy:'يرجى الموافقة على سياسة الحضور والدفع.',errorPhone:'أدخل رقم هاتف صحيحاً من ٧ إلى ١٥ رقماً.',errorEmail:'أدخل عنوان بريد إلكتروني صحيحاً.',
      noPackage:'اختر باقة غسيل',noExtras:'دون إضافات',stepOf:'الخطوة',of:'من',calendarNote:'مواعيد توضيحية · خلال ٣٠ يوماً'
    }
  };
  let language = 'en';
  try { language = localStorage.getItem('naqa-language') === 'ar' ? 'ar' : 'en'; } catch { /* Preferences are optional. */ }
  const t = key => catalog[language][key] || catalog.en[key] || key;
  const locale = () => language === 'ar' ? 'ar-LY' : 'en-US';
  function translateDocument() {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.title = t('pageTitle');
    document.querySelectorAll('[data-t]').forEach(element => { element.textContent = t(element.dataset.t); });
    document.querySelectorAll('[data-label]').forEach(element => { element.setAttribute('aria-label', t(element.dataset.label)); });
    document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
  }
  function setLanguage(value) {
    language = value === 'ar' ? 'ar' : 'en';
    translateDocument();
    try { localStorage.setItem('naqa-language', language); } catch { /* No storage requirement. */ }
    document.dispatchEvent(new CustomEvent('wash:language'));
  }
  window.WashI18n = Object.freeze({ t, locale, setLanguage, translateDocument, get language() { return language; } });
  translateDocument();
})();
