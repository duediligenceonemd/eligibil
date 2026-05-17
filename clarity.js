// Microsoft Clarity — analytics & heatmaps
// Replace YOUR_PROJECT_ID with your Clarity project ID from https://clarity.microsoft.com
(function(){
  var id = 'wsfo1nc2r4';
  if (localStorage.getItem('cookie_consent') !== 'accepted') return; // GDPR
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window,document,"clarity","script",id);
})();
